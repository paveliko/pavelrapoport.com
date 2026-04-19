// Main estimate orchestrator: Linear issue → Claude Sonnet → estimation table.

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { callClaude, computeCost, MODELS } from '../../core/anthropic.js';
import { LinearClient } from '../../core/linear-client.js';
import { parseRelevantSpecs, extractSection, buildSpecContext } from '../../core/spec-reader.js';
import { loadEstimatePrompt, buildEstimateUserPrompt } from './prompt-loader.js';
import type { EstimateOptions, EstimateResult, Estimation } from './types.js';

// ─── Constants ─────────────────────────────────────────────

const MAX_SPEC_CONTEXT_BYTES = 5_000;
const MAX_TOKENS = 1024;
const MODEL = MODELS.sonnet;

// ─── Public API ────────────────────────────────────────────

export async function runEstimate(opts: EstimateOptions): Promise<EstimateResult> {
  if (!opts.json) {
    console.log(chalk.bold('\n  FORGE Estimate\n'));
  }

  const estimations: Estimation[] = [];
  let totalCostUsd = 0;
  const startMs = Date.now();

  for (const issueKey of opts.issueKeys) {
    const estimation = await estimateIssue(issueKey, opts);
    estimations.push(estimation.result);
    totalCostUsd += estimation.costUsd;
  }

  const totalDurationMs = Date.now() - startMs;

  if (opts.json) {
    console.log(JSON.stringify({ estimations, totalCostUsd, totalDurationMs }, null, 2));
  } else {
    printAggregate(estimations, totalCostUsd, totalDurationMs);
  }

  if (opts.persist) {
    try {
      const { persistEstimateResults } = await import('./persist-estimate.js');
      const dbResult = await persistEstimateResults(estimations, totalCostUsd, MODEL);
      if (dbResult) {
        console.log(`\n  ${chalk.green('✅')} Persisted ${dbResult.ids.length} estimate(s) to DB`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n  Warning: DB persist failed: ${msg}`);
    }
  }

  return { estimations, totalCostUsd, totalDurationMs };
}

// ─── Per-issue estimation ─────────────────────────────────

async function estimateIssue(
  issueKey: string,
  opts: EstimateOptions,
): Promise<{ result: Estimation; costUsd: number }> {
  // 1. Fetch Linear issue
  if (!opts.json) console.log(chalk.dim(`  Fetching ${issueKey}...`));
  const linear = new LinearClient({ apiKey: opts.linearApiKey, issuePrefix: opts.issuePrefix });
  const issue = await linear.fetchIssue(issueKey);

  // 2. Build optional spec context (small budget)
  const specContext = await buildSpecContextFromDisk(
    opts.repoRoot,
    issue.description,
    opts.verbose,
  );

  // 3. Load prompt and call Claude
  if (!opts.json && opts.verbose) console.log(chalk.dim(`  Estimating with ${MODEL}...`));
  const systemPrompt = await loadEstimatePrompt();
  const userMessage = buildEstimateUserPrompt(
    issue.title,
    issue.description,
    specContext || undefined,
  );

  const response = await callClaude(opts.apiKey, {
    model: MODEL,
    system: systemPrompt,
    userMessage,
    maxTokens: MAX_TOKENS,
  });

  const costUsd = computeCost(MODEL, response.usage.input_tokens, response.usage.output_tokens);
  const raw = response.content[0]!.text;

  // 4. Parse estimation
  const estimation = parseEstimation(raw, issueKey, issue.title);

  // 5. Print result
  if (!opts.json) {
    printEstimation(estimation);
    if (opts.verbose) {
      console.log(
        chalk.dim(
          `    Cost: $${costUsd.toFixed(4)} | Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`,
        ),
      );
    }
  }

  return { result: estimation, costUsd };
}

// ─── JSON parsing ─────────────────────────────────────────

function parseEstimation(raw: string, issueKey: string, title: string): Estimation {
  const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse estimation for ${issueKey}: no JSON block found in response`);
  }

  const parsed = JSON.parse(jsonMatch[1]!) as Record<string, unknown>;

  return {
    issueKey,
    title,
    complexity: (parsed.complexity as Estimation['complexity']) ?? 'Medium',
    complexityReason: String(parsed.complexityReason ?? ''),
    risk: (parsed.risk as Estimation['risk']) ?? 'Medium',
    riskReason: String(parsed.riskReason ?? ''),
    storyPoints: Number(parsed.storyPoints ?? 3),
    hoursMin: Number(parsed.hoursMin ?? 2),
    hoursMax: Number(parsed.hoursMax ?? 4),
    dependencies: Array.isArray(parsed.dependencies) ? (parsed.dependencies as string[]) : [],
    filesNew: Number(parsed.filesNew ?? 0),
    filesModified: Number(parsed.filesModified ?? 0),
    confidence: (parsed.confidence as Estimation['confidence']) ?? 'Medium',
    confidenceReason: String(parsed.confidenceReason ?? ''),
  };
}

// ─── Spec context (small budget) ──────────────────────────

async function buildSpecContextFromDisk(
  repoRoot: string,
  description: string,
  verbose?: boolean,
): Promise<string> {
  const specRefs = parseRelevantSpecs(description);
  if (specRefs.length === 0) return '';

  if (verbose) console.log(chalk.dim(`  Found ${specRefs.length} spec reference(s).`));

  const fetched: { path: string; section?: string; content: string }[] = [];
  let totalBytes = 0;

  for (const ref of specRefs) {
    if (totalBytes >= MAX_SPEC_CONTEXT_BYTES) break;

    try {
      const fullPath = resolve(repoRoot, ref.path);
      const raw = await readFile(fullPath, 'utf-8');
      const content = ref.section ? extractSection(raw, ref.section) : raw;

      if (!content) {
        if (verbose)
          console.log(chalk.dim(`  Warning: Section "${ref.section}" not found in ${ref.path}`));
        continue;
      }

      totalBytes += content.length;
      fetched.push({ path: ref.path, section: ref.section, content });
    } catch {
      if (verbose) console.log(chalk.dim(`  Warning: Could not read spec ${ref.path}`));
    }
  }

  return buildSpecContext(fetched);
}

// ─── Console output ───────────────────────────────────────

function printEstimation(est: Estimation): void {
  const divider = '\u2500'.repeat(40);
  console.log(`\n  ${chalk.bold(`${est.issueKey}: ${est.title}`)}`);
  console.log(`  ${chalk.dim(divider)}`);
  console.log(`    Complexity:    ${est.complexity} (${est.complexityReason})`);
  console.log(`    Risk:          ${est.risk} (${est.riskReason})`);
  console.log(`    Story Points:  ${chalk.cyan(String(est.storyPoints))}`);
  console.log(`    Est. Hours:    ${est.hoursMin}-${est.hoursMax}h`);
  if (est.dependencies.length > 0) {
    console.log(`    Dependencies:  ${est.dependencies.join(', ')}`);
  }
  console.log(`    Affected:      ${est.filesNew} files new, ${est.filesModified} files modified`);
  console.log(`    Confidence:    ${est.confidence} (${est.confidenceReason})`);
}

function printAggregate(results: Estimation[], totalCost: number, totalMs: number): void {
  if (results.length > 1) {
    const totalSP = results.reduce((s, e) => s + e.storyPoints, 0);
    const totalHoursMin = results.reduce((s, e) => s + e.hoursMin, 0);
    const totalHoursMax = results.reduce((s, e) => s + e.hoursMax, 0);

    console.log(chalk.bold('\n  ── Summary ──'));
    console.log(`    Total Story Points: ${chalk.cyan(String(totalSP))}`);
    console.log(`    Total Hours:        ${totalHoursMin}-${totalHoursMax}h`);
  }

  console.log(
    `\n  ${chalk.dim(`API Cost: $${totalCost.toFixed(4)} | Duration: ${(totalMs / 1000).toFixed(1)}s`)}\n`,
  );
}
