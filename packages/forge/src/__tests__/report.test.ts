import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeAgentContext, makeVerifiedReport } from './fixtures.js';
import type { AgentName } from '../commands/audit/types.js';
import type { GenerateReportOptions } from '../commands/audit/report.js';

// ─── Mocks ─────────────────────────────────────────────────

vi.mock('node:fs', () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execSync: vi.fn(() => 'abc1234'),
}));

// ─── Imports (after mocks) ─────────────────────────────────

const { generateReport, printEstimate } = await import('../commands/audit/report.js');
const { mkdirSync, writeFileSync } = await import('node:fs');
const { execSync } = await import('node:child_process');

const mockMkdirSync = vi.mocked(mkdirSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockExecSync = vi.mocked(execSync);

// ─── Helpers ───────────────────────────────────────────────

function makeReportOptions(overrides: Partial<GenerateReportOptions> = {}): GenerateReportOptions {
  return {
    moduleName: 'worker',
    verified: makeVerifiedReport(),
    costBreakdown: { security: 0.5, verifier: 0.3 },
    totalCost: 0.8,
    durationMs: 60_000,
    json: false,
    verbose: false,
    repoRoot: '/tmp/test-repo',
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────

describe('Report Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates .forge/audits/ directory', () => {
    generateReport(makeReportOptions());

    expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining('.forge/audits'), {
      recursive: true,
    });
  });

  it('writes JSON file with correct schema fields', () => {
    generateReport(makeReportOptions());

    // Find the JSON write (first writeFileSync call)
    const jsonCall = mockWriteFileSync.mock.calls.find((call) =>
      (call[0] as string).endsWith('.json'),
    );
    expect(jsonCall).toBeDefined();

    const written = JSON.parse(jsonCall![1] as string);
    expect(written).toHaveProperty('module', 'worker');
    expect(written).toHaveProperty('timestamp');
    expect(written).toHaveProperty('gitSha', 'abc1234');
    expect(written).toHaveProperty('durationMs', 60_000);
    expect(written).toHaveProperty('costBreakdown');
    expect(written).toHaveProperty('totalCost', 0.8);
    expect(written).toHaveProperty('verified');
  });

  it('writes Markdown file with correct heading structure', () => {
    generateReport(makeReportOptions());

    const mdCall = mockWriteFileSync.mock.calls.find((call) => (call[0] as string).endsWith('.md'));
    expect(mdCall).toBeDefined();

    const md = mdCall![1] as string;
    expect(md).toContain('# AUDIT Report: worker');
    expect(md).toContain('## Scores');
    expect(md).toContain('## Summary');
  });

  it('outputs JSON to stdout in json mode', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    generateReport(makeReportOptions({ json: true }));

    const jsonOutput = logSpy.mock.calls.find((call) => {
      try {
        const parsed = JSON.parse(call[0] as string);
        return parsed.module === 'worker';
      } catch {
        return false;
      }
    });
    expect(jsonOutput).toBeDefined();
  });

  it('uses safe characters in filenames (replaces colons and dots)', () => {
    generateReport(makeReportOptions());

    const jsonCall = mockWriteFileSync.mock.calls.find((call) =>
      (call[0] as string).endsWith('.json'),
    );
    const filePath = jsonCall![0] as string;
    // filename portion should not contain : or . except the .json extension
    const fileName = filePath.split('/').pop()!;
    const withoutExt = fileName.replace('.json', '');
    expect(withoutExt).not.toContain(':');
    expect(withoutExt).not.toContain('.');
  });

  it('falls back to "unknown" gitSha when execSync fails', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('git not found');
    });

    const report = generateReport(makeReportOptions());

    expect(report.gitSha).toBe('unknown');
  });

  it('returns a valid AuditReport object', () => {
    const report = generateReport(makeReportOptions());

    expect(report.module).toBe('worker');
    expect(report.totalCost).toBe(0.8);
    expect(report.durationMs).toBe(60_000);
    expect(report.verified.findings).toBeDefined();
  });
});

describe('printEstimate', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints agent cost table', () => {
    const logSpy = vi.spyOn(console, 'log');
    const agents: AgentName[] = ['security', 'pm'];
    const contexts: Record<string, ReturnType<typeof makeAgentContext>> = {
      security: makeAgentContext({ model: 'opus', estimatedTokens: 50_000 }),
      pm: makeAgentContext({ model: 'sonnet', estimatedTokens: 30_000 }),
    };

    printEstimate('worker', agents, contexts);

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('security');
    expect(output).toContain('pm');
    expect(output).toContain('verifier');
    expect(output).toContain('TOTAL');
  });
});
