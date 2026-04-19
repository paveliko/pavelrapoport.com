import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeAgentContext,
  makeAgentResult,
  makeAnthropicResponse,
  makeAuditReport,
  makeVerifiedReport,
} from './fixtures.js';
import type { AgentName, AuditOptions } from '../commands/audit/types.js';

// ─── Mocks ─────────────────────────────────────────────────

vi.mock('../core/anthropic.js', () => ({
  callClaude: vi.fn(),
  computeCost: vi.fn(() => 0.5),
  estimateCost: vi.fn(() => 0.1),
  MODELS: { opus: 'claude-opus-4-6', sonnet: 'claude-sonnet-4-20250514' },
}));

vi.mock('../commands/audit/context-builder.js', () => ({
  buildAgentContexts: vi.fn(),
}));

vi.mock('../commands/audit/modules.js', () => ({
  getModule: vi.fn(),
  listModules: vi.fn(() => ['worker', 'platform', 'admin', 'marketing']),
}));

vi.mock('../commands/audit/verifier.js', () => ({
  runVerifier: vi.fn(),
}));

vi.mock('../commands/audit/report.js', () => ({
  generateReport: vi.fn(),
  printEstimate: vi.fn(),
}));

// ─── Imports (after mocks) ─────────────────────────────────

const { runAudit } = await import('../commands/audit/orchestrator.js');
const { callClaude } = await import('../core/anthropic.js');
const { buildAgentContexts } = await import('../commands/audit/context-builder.js');
const { getModule } = await import('../commands/audit/modules.js');
const { runVerifier } = await import('../commands/audit/verifier.js');
const { generateReport, printEstimate } = await import('../commands/audit/report.js');

// ─── Helpers ───────────────────────────────────────────────

const mockCallClaude = vi.mocked(callClaude);
const mockGetModule = vi.mocked(getModule);
const mockBuildAgentContexts = vi.mocked(buildAgentContexts);
const mockRunVerifier = vi.mocked(runVerifier);
const mockGenerateReport = vi.mocked(generateReport);
const mockPrintEstimate = vi.mocked(printEstimate);

const BASE_OPTIONS: AuditOptions = {
  moduleName: 'worker',
  apiKey: 'test-key',
  estimate: false,
  verbose: false,
  json: false,
};

function setupSingleAgentModule(agentName: AgentName = 'security') {
  mockGetModule.mockReturnValue({
    name: 'worker',
    description: 'Worker module',
    agents: {
      [agentName]: { globs: ['src/**'], specs: [], model: 'opus' as const },
    },
  });

  mockBuildAgentContexts.mockResolvedValue({
    [agentName]: makeAgentContext(),
  });
}

// ─── Tests ─────────────────────────────────────────────────

describe('Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(((code: number) => {
      throw new Error(`process.exit(${code})`);
    }) as never);
    // Suppress console.error noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits with error for unknown module', async () => {
    mockGetModule.mockReturnValue(undefined);

    await expect(runAudit(BASE_OPTIONS, '/repo')).rejects.toThrow('process.exit(1)');
  });

  it('exits with error when agent filter is not in module', async () => {
    mockGetModule.mockReturnValue({
      name: 'worker',
      description: 'Worker module',
      agents: {
        pm: { globs: ['src/**'], specs: [], model: 'sonnet' as const },
      },
    });
    mockBuildAgentContexts.mockResolvedValue({
      pm: makeAgentContext({ model: 'sonnet' }),
    });

    const opts = { ...BASE_OPTIONS, agentFilter: 'security' as AgentName };
    await expect(runAudit(opts, '/repo')).rejects.toThrow('process.exit(1)');
  });

  it('calls printEstimate and returns null in estimate mode', async () => {
    setupSingleAgentModule();

    const result = await runAudit({ ...BASE_OPTIONS, estimate: true }, '/repo');

    expect(result).toBeNull();
    expect(mockPrintEstimate).toHaveBeenCalledOnce();
  });

  it('runs single agent through full pipeline', async () => {
    setupSingleAgentModule();

    const agentResult = makeAgentResult();
    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(agentResult)));

    const verifiedReport = makeVerifiedReport();
    mockRunVerifier.mockResolvedValue({ report: verifiedReport, cost: 0.3 });

    const auditReport = makeAuditReport();
    mockGenerateReport.mockReturnValue(auditReport);

    const result = await runAudit(BASE_OPTIONS, '/repo');

    expect(mockCallClaude).toHaveBeenCalled();
    expect(mockRunVerifier).toHaveBeenCalledOnce();
    expect(mockGenerateReport).toHaveBeenCalledOnce();
    expect(result).toEqual(auditReport);
  });

  it('includes cost breakdown from successful agents', async () => {
    setupSingleAgentModule();

    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(makeAgentResult())));
    mockRunVerifier.mockResolvedValue({ report: makeVerifiedReport(), cost: 0.3 });
    mockGenerateReport.mockReturnValue(makeAuditReport());

    await runAudit(BASE_OPTIONS, '/repo');

    const reportCall = mockGenerateReport.mock.calls[0]![0];
    expect(reportCall.costBreakdown).toHaveProperty('security');
    expect(reportCall.costBreakdown).toHaveProperty('verifier');
  });

  it('marks failed agent as SKIPPED while others continue', async () => {
    mockGetModule.mockReturnValue({
      name: 'worker',
      description: 'Worker module',
      agents: {
        security: { globs: ['src/**'], specs: [], model: 'opus' as const },
        pm: { globs: ['src/**'], specs: [], model: 'sonnet' as const },
      },
    });
    mockBuildAgentContexts.mockResolvedValue({
      security: makeAgentContext({ model: 'opus' }),
      pm: makeAgentContext({ model: 'sonnet' }),
    });

    // security fails, pm succeeds
    mockCallClaude
      .mockRejectedValueOnce(new Error('API timeout'))
      .mockResolvedValueOnce(
        makeAnthropicResponse(JSON.stringify(makeAgentResult({ agent: 'pm' }))),
      );

    mockRunVerifier.mockResolvedValue({ report: makeVerifiedReport(), cost: 0.3 });
    mockGenerateReport.mockReturnValue(makeAuditReport());

    await runAudit(BASE_OPTIONS, '/repo');

    // Verifier should receive only the successful pm result
    const verifierCall = mockRunVerifier.mock.calls[0]!;
    const successfulResults = verifierCall[0];
    expect(successfulResults).toHaveLength(1);

    const skippedAgents = verifierCall[1];
    expect(skippedAgents).toHaveLength(1);
    expect(skippedAgents[0]!.agent).toBe('security');
  });

  it('exits when all agents fail', async () => {
    setupSingleAgentModule();

    mockCallClaude.mockRejectedValue(new Error('API down'));

    await expect(runAudit(BASE_OPTIONS, '/repo')).rejects.toThrow('process.exit(1)');
  });

  it('retries JSON parse when first response is invalid', async () => {
    setupSingleAgentModule();

    const validResult = makeAgentResult();
    // First call returns invalid JSON, second returns valid
    mockCallClaude
      .mockResolvedValueOnce(makeAnthropicResponse('not json'))
      .mockResolvedValueOnce(makeAnthropicResponse(JSON.stringify(validResult)));

    mockRunVerifier.mockResolvedValue({ report: makeVerifiedReport(), cost: 0.3 });
    mockGenerateReport.mockReturnValue(makeAuditReport());

    await runAudit(BASE_OPTIONS, '/repo');

    // callClaude called twice for agent (initial + retry) + once for verifier
    expect(mockCallClaude).toHaveBeenCalledTimes(2);
    expect(mockRunVerifier).toHaveBeenCalledOnce();
  });

  it('runs verifier after all agents complete', async () => {
    setupSingleAgentModule();

    const agentResult = makeAgentResult({ score: 9.0, findings: [] });
    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(agentResult)));
    mockRunVerifier.mockResolvedValue({
      report: makeVerifiedReport({ overall_score: 9.0 }),
      cost: 0.2,
    });
    mockGenerateReport.mockReturnValue(makeAuditReport());

    await runAudit(BASE_OPTIONS, '/repo');

    const verifierCall = mockRunVerifier.mock.calls[0]!;
    expect(verifierCall[0][0]!.score).toBe(9.0);
    expect(verifierCall[2]).toBe('test-key'); // apiKey forwarded
  });

  it('passes json and verbose options to generateReport', async () => {
    setupSingleAgentModule();

    mockCallClaude.mockResolvedValue(makeAnthropicResponse(JSON.stringify(makeAgentResult())));
    mockRunVerifier.mockResolvedValue({ report: makeVerifiedReport(), cost: 0.3 });
    mockGenerateReport.mockReturnValue(makeAuditReport());

    await runAudit({ ...BASE_OPTIONS, json: true, verbose: true }, '/repo');

    const reportCall = mockGenerateReport.mock.calls[0]![0];
    expect(reportCall.json).toBe(true);
    expect(reportCall.verbose).toBe(true);
  });
});
