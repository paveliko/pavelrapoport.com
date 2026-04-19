import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeAgentResult, makeAnthropicResponse, makeVerifiedFinding } from './fixtures.js';
import type { VerifiedReport } from '../commands/audit/types.js';
import { AGENT_WEIGHTS } from '../commands/audit/types.js';

// ─── Mocks ─────────────────────────────────────────────────

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(() =>
    Promise.resolve(
      'Verifier prompt. Summaries: {{AGENT_SUMMARIES}}. Findings: {{FINDINGS_JSON}}. Weights: {{WEIGHT_FORMULA}}.',
    ),
  ),
}));

vi.mock('../core/anthropic.js', () => ({
  callClaude: vi.fn(),
  computeCost: vi.fn(() => 0.45),
  MODELS: { opus: 'claude-opus-4-6', sonnet: 'claude-sonnet-4-20250514' },
}));

// ─── Imports (after mocks) ─────────────────────────────────

const { runVerifier } = await import('../commands/audit/verifier.js');
const { callClaude, computeCost } = await import('../core/anthropic.js');

const mockCallClaude = vi.mocked(callClaude);
const mockComputeCost = vi.mocked(computeCost);

// ─── Helpers ───────────────────────────────────────────────

function makeVerifiedReportJson(overrides: Partial<VerifiedReport> = {}): VerifiedReport {
  return {
    findings: [makeVerifiedFinding()],
    overall_score: 7.5,
    agent_scores: { security: 7.5 },
    skipped_agents: [],
    summary: 'Verified OK',
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────

describe('Verifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns verified findings with correct structure', async () => {
    const report = makeVerifiedReportJson();
    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(report)));

    const result = await runVerifier([makeAgentResult()], [], 'test-key', false);

    expect(result.report.findings).toHaveLength(1);
    expect(result.report.findings[0]!.verified).toBe(true);
    expect(result.report.overall_score).toBe(7.5);
  });

  it('includes false positives in output', async () => {
    const report = makeVerifiedReportJson({
      findings: [
        makeVerifiedFinding({ verified: true, title: 'Real issue' }),
        makeVerifiedFinding({ verified: false, title: 'False alarm' }),
      ],
    });
    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(report)));

    const result = await runVerifier([makeAgentResult()], [], 'test-key', false);

    const verified = result.report.findings.filter((f) => f.verified);
    const falsePositives = result.report.findings.filter((f) => !f.verified);
    expect(verified).toHaveLength(1);
    expect(falsePositives).toHaveLength(1);
  });

  it('attaches skipped agents to the report', async () => {
    const report = makeVerifiedReportJson();
    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(report)));

    const skipped = [{ agent: 'qa', reason: 'API timeout' }];
    const result = await runVerifier([makeAgentResult()], skipped, 'test-key', false);

    expect(result.report.skipped_agents).toEqual(skipped);
  });

  it('includes correct weight formula in system prompt', async () => {
    const report = makeVerifiedReportJson();
    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(report)));

    await runVerifier(
      [makeAgentResult({ agent: 'security' }), makeAgentResult({ agent: 'pm' })],
      [],
      'test-key',
      false,
    );

    const systemPrompt = mockCallClaude.mock.calls[0]![1].system as string;
    expect(systemPrompt).toContain(`security x ${AGENT_WEIGHTS.security}`);
    expect(systemPrompt).toContain(`pm x ${AGENT_WEIGHTS.pm}`);
  });

  it('handles empty findings input', async () => {
    const report = makeVerifiedReportJson({ findings: [], overall_score: 10 });
    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(report)));

    const agentResult = makeAgentResult({ findings: [] });
    const result = await runVerifier([agentResult], [], 'test-key', false);

    expect(result.report.findings).toHaveLength(0);
    expect(result.report.overall_score).toBe(10);
  });

  it('retries JSON parse when first response is invalid', async () => {
    const validReport = makeVerifiedReportJson();
    mockCallClaude
      .mockResolvedValueOnce(makeAnthropicResponse('not valid json'))
      .mockResolvedValueOnce(makeAnthropicResponse(JSON.stringify(validReport)));

    const result = await runVerifier([makeAgentResult()], [], 'test-key', true);

    expect(mockCallClaude).toHaveBeenCalledTimes(2);
    expect(result.report.overall_score).toBe(7.5);
  });

  it('computes cost from Opus model pricing', async () => {
    const report = makeVerifiedReportJson();
    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(report)));
    mockComputeCost.mockReturnValue(1.23);

    const result = await runVerifier([makeAgentResult()], [], 'test-key', false);

    expect(mockComputeCost).toHaveBeenCalledWith(
      'claude-opus-4-6',
      expect.any(Number),
      expect.any(Number),
    );
    expect(result.cost).toBe(1.23);
  });

  it('includes merged_with data from verifier', async () => {
    const report = makeVerifiedReportJson({
      findings: [
        makeVerifiedFinding({
          id: 'sec-1',
          merged_with: ['arch-3', 'tl-2'],
          verification_note: 'Merged duplicate findings',
        }),
      ],
    });
    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(report)));

    const result = await runVerifier([makeAgentResult()], [], 'test-key', false);

    expect(result.report.findings[0]!.merged_with).toEqual(['arch-3', 'tl-2']);
  });
});
