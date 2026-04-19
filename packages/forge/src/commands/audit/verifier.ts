import { readFile } from 'node:fs/promises';
import { callClaude, computeCost, MODELS } from '../../core/anthropic.js';
import { AGENT_WEIGHTS } from './types.js';
import type { AgentName, AgentResult, VerifiedReport } from './types.js';
import { parseVerifierResponse } from './utils.js';

// ─── Types ──────────────────────────────────────────────────

export interface VerifierResult {
  report: VerifiedReport;
  cost: number;
}

// ─── Public API ─────────────────────────────────────────────

const PROMPT_PATH = new URL('./prompts/verifier.md', import.meta.url);

export async function runVerifier(
  agentResults: AgentResult[],
  skippedAgents: Array<{ agent: string; reason: string }>,
  apiKey: string,
  verbose: boolean,
): Promise<VerifierResult> {
  const promptTemplate = await readFile(PROMPT_PATH, 'utf-8');

  const agentSummaries = agentResults
    .map((r) => `**${r.agent}** (score: ${r.score}/10): ${r.summary}`)
    .join('\n');

  const allFindings = agentResults.flatMap((r) => r.findings);

  // Build dynamic weight formula from active agents
  const activeAgents = agentResults.map((r) => r.agent);
  const weightParts = activeAgents.map((a) => `${a} x ${AGENT_WEIGHTS[a as AgentName] ?? 1}`);
  const totalWeight = activeAgents.reduce(
    (sum, a) => sum + (AGENT_WEIGHTS[a as AgentName] ?? 1),
    0,
  );
  const weightFormula = `${weightParts.join(' + ')}, divided by total weight (${totalWeight})`;

  const systemPrompt = promptTemplate
    .replaceAll('{{AGENT_SUMMARIES}}', agentSummaries)
    .replaceAll('{{FINDINGS_JSON}}', JSON.stringify(allFindings, null, 2))
    .replaceAll('{{WEIGHT_FORMULA}}', weightFormula);

  const userMessage =
    'Verify all findings now. Check for false positives, duplicates, and severity calibration. Return ONLY the JSON result, no markdown fences.';

  const model = MODELS.opus;
  const response = await callClaude(apiKey, {
    model,
    system: systemPrompt,
    userMessage,
    maxTokens: 16_384,
  });

  const text = response.content[0]?.text ?? '';
  let parsed: VerifiedReport;

  try {
    parsed = parseVerifierResponse(text);
  } catch {
    if (verbose) {
      console.error('  Retrying verifier JSON parse...');
    }

    const retryResponse = await callClaude(apiKey, {
      model,
      system: systemPrompt,
      userMessage: `Your previous response was not valid JSON:\n\n${text.slice(0, 500)}\n\nReturn ONLY valid JSON. No markdown fences.`,
      maxTokens: 16_384,
    });

    const retryText = retryResponse.content[0]?.text ?? '';
    parsed = parseVerifierResponse(retryText);
  }

  // Attach skipped agents info
  parsed.skipped_agents = skippedAgents;

  const cost = computeCost(model, response.usage.input_tokens, response.usage.output_tokens);

  const verifiedCount = parsed.findings.filter((f) => f.verified).length;
  const falsePositiveCount = parsed.findings.filter((f) => !f.verified).length;
  console.error(
    `  ✓ verifier — verified: ${verifiedCount}, false positives: ${falsePositiveCount}, cost: $${cost.toFixed(3)}`,
  );

  return { report: parsed, cost };
}
