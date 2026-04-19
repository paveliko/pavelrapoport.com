import { callClaude, computeCost, MODELS } from '../../core/anthropic.js';
import type { ModelId } from '../../core/anthropic.js';
import { buildAgentContexts } from './context-builder.js';
import { getModule, listModules } from './modules.js';
import { runVerifier } from './verifier.js';
import { generateReport, printEstimate } from './report.js';
import type {
  AgentContext,
  AgentName,
  AgentOutcome,
  AgentResult,
  AgentSuccess,
  AgentSkipped,
  AuditOptions,
  AuditReport,
} from './types.js';
import { groupAgentsByModel, parseJsonResponse } from './utils.js';

// ─── Rate-limit-aware batching ─────────────────────────────
/** Max agents to fire in parallel per model to avoid rate-limit exhaustion */
const MAX_PARALLEL_PER_MODEL = 3;
/** Delay between same-model batches (ms) — lets the 1-min rate window reset */
const INTER_BATCH_DELAY_MS = 65_000;

// ─── Public API ─────────────────────────────────────────────

export async function runAudit(
  options: AuditOptions,
  repoRoot: string,
): Promise<AuditReport | null> {
  const mod = getModule(options.moduleName);
  if (!mod) {
    console.error(
      `Unknown module: "${options.moduleName}". Available: ${listModules().join(', ')}`,
    );
    process.exit(1);
  }

  // Resolve agent list from module config
  const moduleAgentNames = Object.keys(mod.agents) as AgentName[];
  const agentNames: AgentName[] = options.agentFilter ? [options.agentFilter] : moduleAgentNames;

  // Validate --agent flag against module's agent set
  if (options.agentFilter && !mod.agents[options.agentFilter]) {
    console.error(
      `Agent "${options.agentFilter}" is not configured for module "${mod.name}". Available: ${moduleAgentNames.join(', ')}`,
    );
    process.exit(1);
  }

  // Build context per agent
  console.error(`\nBuilding context for ${agentNames.length} agent(s) on module "${mod.name}"...`);
  const contexts = await buildAgentContexts(mod, agentNames, repoRoot);

  // Estimate mode: print costs and exit
  if (options.estimate) {
    printEstimate(mod.name, agentNames, contexts);
    return null;
  }

  // Run agents — stagger same-model agents to avoid rate-limit exhaustion
  const startTime = Date.now();
  const modelGroups = groupAgentsByModel(agentNames, contexts);
  const needsStagger = [...modelGroups.values()].some(
    (group) => group.length > MAX_PARALLEL_PER_MODEL,
  );

  if (needsStagger) {
    console.error(
      `Running ${agentNames.length} agent(s) in staggered batches (max ${MAX_PARALLEL_PER_MODEL} per model)...\n`,
    );
  } else {
    console.error(`Running ${agentNames.length} agent(s) in parallel...\n`);
  }

  // Execute each model group concurrently; within each group, batches are sequential
  const groupResults = await Promise.all(
    [...modelGroups.entries()].map(([, groupAgents]) =>
      executeAgentBatches(groupAgents, contexts, options.apiKey, options.verbose, mod.name),
    ),
  );

  // Merge all results back
  const allResults = new Map<AgentName, PromiseSettledResult<AgentOutcome>>();
  for (const groupResult of groupResults) {
    for (const [name, result] of groupResult) {
      allResults.set(name, result);
    }
  }

  // Collect results
  const agentOutcomes: AgentOutcome[] = [];
  const costBreakdown: Record<string, number> = {};

  for (const name of agentNames) {
    const outcome = allResults.get(name);
    if (!outcome) continue;

    if (outcome.status === 'fulfilled') {
      agentOutcomes.push(outcome.value);
      if (outcome.value.status === 'success') {
        costBreakdown[name] = outcome.value.cost;
      }
    } else {
      const skipped: AgentSkipped = {
        status: 'skipped',
        agent: name,
        reason: String(outcome.reason),
        durationMs: 0,
      };
      agentOutcomes.push(skipped);
    }
  }

  // Collect successful results for verifier
  const successfulResults = agentOutcomes
    .filter((o): o is AgentSuccess => o.status === 'success')
    .map((o) => o.result);

  const skippedAgents = agentOutcomes
    .filter((o): o is AgentSkipped => o.status === 'skipped')
    .map((o) => ({ agent: o.agent, reason: o.reason }));

  if (successfulResults.length === 0) {
    console.error('\nAll agents failed. No report generated.');
    process.exit(1);
  }

  // Run verifier
  console.error(`\nRunning verifier on ${successfulResults.length} agent result(s)...`);
  const verified = await runVerifier(
    successfulResults,
    skippedAgents,
    options.apiKey,
    options.verbose,
  );
  const verifierCost = verified.cost;
  costBreakdown['verifier'] = verifierCost;

  const durationMs = Date.now() - startTime;
  const totalCost = Object.values(costBreakdown).reduce((sum, c) => sum + c, 0);

  // Generate report
  return generateReport({
    moduleName: mod.name,
    verified: verified.report,
    costBreakdown,
    totalCost,
    durationMs,
    json: options.json,
    verbose: options.verbose,
    repoRoot,
  });
}

// ─── Batching helpers ──────────────────────────────────────

async function executeAgentBatches(
  agents: AgentName[],
  contexts: Record<string, AgentContext>,
  apiKey: string,
  verbose: boolean,
  moduleName: string,
): Promise<Map<AgentName, PromiseSettledResult<AgentOutcome>>> {
  const results = new Map<AgentName, PromiseSettledResult<AgentOutcome>>();

  const batches: AgentName[][] = [];
  for (let i = 0; i < agents.length; i += MAX_PARALLEL_PER_MODEL) {
    batches.push(agents.slice(i, i + MAX_PARALLEL_PER_MODEL));
  }

  const needsStagger = batches.length > 1;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx]!;

    if (needsStagger) {
      console.error(`  Batch ${batchIdx + 1}/${batches.length} (${batch.join(', ')})...`);
    }

    // Wait between batches (not before the first one)
    if (batchIdx > 0 && needsStagger) {
      console.error(
        `  Waiting ${Math.round(INTER_BATCH_DELAY_MS / 1000)}s for rate limit reset...`,
      );
      await new Promise<void>((r) => setTimeout(r, INTER_BATCH_DELAY_MS));
    }

    const batchOutcomes = await Promise.allSettled(
      batch.map((name) => executeAgent(name, contexts[name]!, apiKey, verbose, moduleName)),
    );

    for (let i = 0; i < batch.length; i++) {
      results.set(batch[i]!, batchOutcomes[i]!);
    }
  }

  return results;
}

// ─── Agent execution ────────────────────────────────────────

async function executeAgent(
  name: AgentName,
  context: AgentContext,
  apiKey: string,
  verbose: boolean,
  moduleName?: string,
): Promise<AgentOutcome> {
  const startTime = Date.now();
  const modelId = MODELS[context.model];

  // Assemble the prompt
  const systemPrompt = context.promptTemplate
    .replaceAll('{{MODULE_NAME}}', moduleName ?? name)
    .replaceAll('{{FILE_CONTENTS}}', context.files)
    .replaceAll('{{SPEC_CONTENTS}}', context.specs);

  const userMessage =
    'Perform the audit now. Evaluate every checklist item. Return ONLY the JSON result, no markdown fences.';

  try {
    const result = await callClaudeWithJsonRetry(
      apiKey,
      modelId,
      systemPrompt,
      userMessage,
      verbose,
    );
    const durationMs = Date.now() - startTime;

    const agentResult: AgentResult = {
      ...result.parsed,
      agent: name, // ensure agent name matches
    };

    const cost = computeCost(modelId, result.inputTokens, result.outputTokens);

    console.error(
      `  ✓ ${name} — score: ${agentResult.score}/10, findings: ${agentResult.findings.length}, cost: $${cost.toFixed(3)}`,
    );

    return {
      status: 'success',
      result: agentResult,
      cost,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${name} — SKIPPED: ${reason}`);

    return {
      status: 'skipped',
      agent: name,
      reason,
      durationMs,
    };
  }
}

// ─── JSON parsing with retry ────────────────────────────────

interface ParsedResponse {
  parsed: AgentResult;
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
    maxTokens: 8192,
  });

  const text = response.content[0]?.text ?? '';
  let inputTokens = response.usage.input_tokens;
  let outputTokens = response.usage.output_tokens;

  try {
    const parsed = parseJsonResponse(text);
    return { parsed, inputTokens, outputTokens };
  } catch {
    if (verbose) {
      console.error(`    Retrying JSON parse for model ${model}...`);
    }

    // Retry with explicit instruction
    const retryResponse = await callClaude(apiKey, {
      model,
      system,
      userMessage: `Your previous response was not valid JSON. Here is what you returned:\n\n${text.slice(0, 500)}\n\nPlease return ONLY valid JSON matching the schema. No markdown fences, no extra text.`,
      maxTokens: 8192,
    });

    inputTokens += retryResponse.usage.input_tokens;
    outputTokens += retryResponse.usage.output_tokens;

    const retryText = retryResponse.content[0]?.text ?? '';
    const parsed = parseJsonResponse(retryText);
    return { parsed, inputTokens, outputTokens };
  }
}
