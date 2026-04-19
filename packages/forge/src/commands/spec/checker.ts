import { readFile } from 'node:fs/promises';
import { callClaude, computeCost, MODELS } from '../../core/anthropic.js';
import type { ModelId } from '../../core/anthropic.js';
import { getProjectContext } from '../../core/project-context.js';
import { getModule, listModules } from '../audit/modules.js';
import { buildSpecContext } from './context-builder.js';
import { generateSpecReport, printSpecEstimate } from './report.js';
import { generateFixProposals } from './fix.js';
import type { SpecCheckResult, SpecOptions, SpecReport } from './types.js';

// ─── Prompt loading ─────────────────────────────────────────

const PROMPT_PATH = new URL('./prompts/spec-checker.md', import.meta.url);

async function loadPrompt(): Promise<string> {
  return readFile(PROMPT_PATH, 'utf-8');
}

// ─── Public API ─���────────────────────��──────────────────────

export async function runSpecCheck(
  options: SpecOptions,
  repoRoot: string,
): Promise<SpecReport | null> {
  if (options.all) {
    return runAll(options, repoRoot);
  }

  return runSingle(options.moduleName, options, repoRoot);
}

// ─── All-modules mode ─────��─────────────────────────────────

async function runAll(options: SpecOptions, repoRoot: string): Promise<SpecReport | null> {
  const modules = listModules();
  const reports: SpecReport[] = [];

  console.error(`\nRunning spec check on ${modules.length} module(s)...\n`);

  for (const moduleName of modules) {
    const report = await runSingle(moduleName, { ...options, moduleName }, repoRoot);
    if (report) reports.push(report);
  }

  // Print summary
  if (reports.length > 0 && !options.json) {
    console.error('\n── All Modules Summary ──────────────────────────');
    for (const r of reports) {
      const { match, total, percentage } = r.result.coverage;
      console.error(`  ${r.module.padEnd(15)} ${match}/${total} (${percentage.toFixed(1)}%)`);
    }
    console.error();
  }

  return reports[reports.length - 1] ?? null;
}

// ─── Single-module check ────────────────────────────────────

async function runSingle(
  moduleName: string,
  options: SpecOptions,
  repoRoot: string,
): Promise<SpecReport | null> {
  const mod = getModule(moduleName);
  if (!mod) {
    console.error(`Unknown module: "${moduleName}". Available: ${listModules().join(', ')}`);
    process.exit(1);
  }

  // Build unified context
  console.error(`\nBuilding context for module "${mod.name}"...`);
  const context = await buildSpecContext(mod, repoRoot);
  console.error(
    `  ${context.fileCount} code files, ${context.specPaths.length} spec files, ~${context.estimatedTokens.toLocaleString()} tokens`,
  );

  const modelAlias = options.sonnet ? 'sonnet' : 'opus';
  const modelId: ModelId = MODELS[modelAlias];

  // Estimate mode
  if (options.estimate) {
    printSpecEstimate(mod.name, context, modelId);
    return null;
  }

  // Load and assemble prompt
  const promptTemplate = await loadPrompt();
  const systemPrompt = promptTemplate
    .replaceAll('{{MODULE_NAME}}', mod.name)
    .replaceAll('{{PROJECT_CONTEXT}}', getProjectContext())
    .replaceAll('{{SPEC_CONTENTS}}', context.specs)
    .replaceAll('{{FILE_CONTENTS}}', context.files);

  const userMessage =
    'Perform the bidirectional spec compliance check now. Return ONLY the JSON result, no markdown fences.';

  // Call Claude
  console.error(`  Running spec check with ${modelAlias}...`);
  const startTime = Date.now();

  const result = await callClaudeWithJsonRetry(
    options.apiKey,
    modelId,
    systemPrompt,
    userMessage,
    options.verbose,
  );

  const durationMs = Date.now() - startTime;
  const cost = computeCost(modelId, result.inputTokens, result.outputTokens);

  console.error(
    `  Done — ${result.parsed.coverage.match}/${result.parsed.coverage.total} (${result.parsed.coverage.percentage.toFixed(1)}%) coverage, cost: $${cost.toFixed(3)}`,
  );

  // Generate report
  const report = generateSpecReport({
    moduleName: mod.name,
    result: result.parsed,
    cost,
    durationMs,
    model: modelId,
    json: options.json,
    verbose: options.verbose,
    repoRoot,
  });

  // Persist to Supabase
  if (options.persist) {
    try {
      const { persistSpecResult } = await import('../../core/persist.js');
      const dbResult = await persistSpecResult(report);
      if (dbResult) {
        console.error(`  Persisted to DB: ${dbResult.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Warning: DB persist failed: ${msg}`);
    }
  }

  // Fix mode
  if (options.fix) {
    const missingDocs = report.result.requirements.filter((r) => r.category === 'MISSING-DOC');
    if (missingDocs.length > 0) {
      console.error(
        `\nGenerating OpenSpec proposals for ${missingDocs.length} undocumented behavior(s)...`,
      );
      const paths = await generateFixProposals(report, repoRoot, options.apiKey, options.verbose);
      for (const p of paths) {
        console.error(`  Created: ${p}`);
      }
    } else {
      console.error('\nNo MISSING-DOC findings — nothing to fix.');
    }
  }

  return report;
}

// ─── JSON parsing with retry ────────────────────────────────

interface ParsedResponse {
  parsed: SpecCheckResult;
  inputTokens: number;
  outputTokens: number;
}

async function callClaudeWithJsonRetry(
  apiKey: string,
  model: ModelId,
  system: string,
  userMessage: string,
  verbose: boolean,
): Promise<ParsedResponse> {
  const response = await callClaude(apiKey, {
    model,
    system,
    userMessage,
    maxTokens: 16384,
  });

  const text = response.content[0]?.text ?? '';
  let inputTokens = response.usage.input_tokens;
  let outputTokens = response.usage.output_tokens;

  try {
    const parsed = parseJsonResponse(text);
    return { parsed, inputTokens, outputTokens };
  } catch {
    if (verbose) {
      console.error('    Retrying JSON parse...');
    }

    const retryResponse = await callClaude(apiKey, {
      model,
      system,
      userMessage: `Your previous response was not valid JSON. Here is what you returned:\n\n${text.slice(0, 500)}\n\nPlease return ONLY valid JSON matching the schema. No markdown fences, no extra text.`,
      maxTokens: 16384,
    });

    inputTokens += retryResponse.usage.input_tokens;
    outputTokens += retryResponse.usage.output_tokens;

    const retryText = retryResponse.content[0]?.text ?? '';
    const parsed = parseJsonResponse(retryText);
    return { parsed, inputTokens, outputTokens };
  }
}

function parseJsonResponse(text: string): SpecCheckResult {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned) as SpecCheckResult;
}
