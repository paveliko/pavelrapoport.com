import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeAuditReport, makeVerifiedFinding, makeVerifiedReport } from './fixtures.js';
import type { CreateIssuesOptions } from '../commands/audit/linear-integration.js';

// ─── Mock fetch ────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ─── Import (after mock) ──────────────────────────────────

const { createLinearIssuesFromAudit } = await import('../commands/audit/linear-integration.js');

// ─── Helpers ───────────────────────────────────────────────

const BASE_OPTS: CreateIssuesOptions = {
  linearApiKey: 'lin-test-key',
  linearTeamId: 'team-123',
  filter: 'all',
  verbose: false,
};

function mockGraphQL(responses: Array<{ data: unknown }>): void {
  for (const resp of responses) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(resp),
    });
  }
}

/** Standard mock responses for ensureLabels + findExistingIssueTitles */
function mockLabelAndTitleSetup(existingTitles: string[] = []): void {
  mockGraphQL([
    // ensureLabels: return existing labels
    {
      data: {
        team: {
          labels: {
            nodes: [
              { id: 'label-audit', name: 'audit' },
              { id: 'label-tech-debt', name: 'tech-debt' },
              { id: 'label-spec-gap', name: 'spec-gap' },
            ],
          },
        },
      },
    },
    // findExistingIssueTitles: first (and only) page
    {
      data: {
        team: {
          issues: {
            nodes: existingTitles.map((t) => ({ title: t })),
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      },
    },
  ]);
}

function mockIssueCreation(identifier: string): void {
  mockGraphQL([
    {
      data: {
        issueCreate: {
          success: true,
          issue: { identifier, url: `https://linear.app/test/${identifier}` },
        },
      },
    },
  ]);
}

// ─── Tests ─────────────────────────────────────────────────

describe('Linear Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates individual issue for critical finding with priority 1', async () => {
    const report = makeAuditReport({
      verified: makeVerifiedReport({
        findings: [makeVerifiedFinding({ severity: 'critical', title: 'Missing RLS' })],
      }),
    });

    mockLabelAndTitleSetup();
    mockIssueCreation('ABC-100');

    await createLinearIssuesFromAudit(report, BASE_OPTS);

    // Find the issueCreate call (3rd fetch call: labels, titles, create)
    const createCall = mockFetch.mock.calls[2]!;
    const body = JSON.parse(createCall[1].body);
    expect(body.variables.input.title).toBe('[Audit] Missing RLS');
    expect(body.variables.input.priority).toBe(1);
    expect(body.variables.input.labelIds).toContain('label-audit');
  });

  it('creates grouped summary issue for warnings with tech-debt label', async () => {
    const warnings = Array.from({ length: 5 }, (_, i) =>
      makeVerifiedFinding({ severity: 'warning', title: `Warning ${i + 1}`, id: `warn-${i}` }),
    );
    const report = makeAuditReport({
      verified: makeVerifiedReport({ findings: warnings }),
    });

    mockLabelAndTitleSetup();
    mockIssueCreation('ABC-101');

    await createLinearIssuesFromAudit(report, BASE_OPTS);

    const createCall = mockFetch.mock.calls[2]!;
    const body = JSON.parse(createCall[1].body);
    expect(body.variables.input.title).toContain('Tech debt');
    expect(body.variables.input.title).toContain('5 warnings');
    expect(body.variables.input.priority).toBe(4);
    expect(body.variables.input.labelIds).toContain('label-tech-debt');
  });

  it('creates grouped summary issue for spec gaps', async () => {
    const specGaps = Array.from({ length: 3 }, (_, i) =>
      makeVerifiedFinding({ severity: 'spec_gap', title: `Gap ${i + 1}`, id: `gap-${i}` }),
    );
    const report = makeAuditReport({
      verified: makeVerifiedReport({ findings: specGaps }),
    });

    mockLabelAndTitleSetup();
    mockIssueCreation('ABC-102');

    await createLinearIssuesFromAudit(report, BASE_OPTS);

    const createCall = mockFetch.mock.calls[2]!;
    const body = JSON.parse(createCall[1].body);
    expect(body.variables.input.title).toContain('Spec gaps');
    expect(body.variables.input.labelIds).toContain('label-spec-gap');
  });

  it('does not create issues for info findings', async () => {
    const report = makeAuditReport({
      verified: makeVerifiedReport({
        findings: [makeVerifiedFinding({ severity: 'info', title: 'FYI' })],
      }),
    });

    mockLabelAndTitleSetup();

    await createLinearIssuesFromAudit(report, BASE_OPTS);

    // Only 2 fetch calls: labels + titles, no issue creation
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('skips duplicate issues based on existing titles', async () => {
    const report = makeAuditReport({
      verified: makeVerifiedReport({
        findings: [makeVerifiedFinding({ severity: 'critical', title: 'Missing RLS' })],
      }),
    });

    // Existing title matches the one we'd create
    mockLabelAndTitleSetup(['[Audit] Missing RLS']);

    await createLinearIssuesFromAudit(report, BASE_OPTS);

    // Only 2 fetch calls: labels + titles, no creation (duplicate skipped)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('creates missing labels via mutation', async () => {
    const report = makeAuditReport({
      verified: makeVerifiedReport({
        findings: [makeVerifiedFinding({ severity: 'critical', title: 'Bug' })],
      }),
    });

    // Return empty labels list → triggers label creation
    mockGraphQL([{ data: { team: { labels: { nodes: [] } } } }]);

    // Three label creation mutations
    for (const name of ['audit', 'tech-debt', 'spec-gap']) {
      mockGraphQL([
        {
          data: {
            issueLabelCreate: { success: true, issueLabel: { id: `created-${name}` } },
          },
        },
      ]);
    }

    // findExistingIssueTitles
    mockGraphQL([
      {
        data: {
          team: {
            issues: {
              nodes: [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      },
    ]);

    // Issue creation
    mockIssueCreation('ABC-103');

    await createLinearIssuesFromAudit(report, BASE_OPTS);

    // Verify label creation calls happened (calls 1-3 after initial query)
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  it('skips warnings and spec gaps when filter is critical', async () => {
    const report = makeAuditReport({
      verified: makeVerifiedReport({
        findings: [
          makeVerifiedFinding({ severity: 'critical', title: 'Critical bug' }),
          makeVerifiedFinding({ severity: 'warning', title: 'Warning thing' }),
          makeVerifiedFinding({ severity: 'spec_gap', title: 'Spec gap thing' }),
        ],
      }),
    });

    mockLabelAndTitleSetup();
    mockIssueCreation('ABC-104');

    await createLinearIssuesFromAudit(report, { ...BASE_OPTS, filter: 'critical' });

    // 3 fetch calls: labels, titles, 1 critical issue (no warning/spec_gap issues)
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('prints no-op message when there are zero findings', async () => {
    const report = makeAuditReport({
      verified: makeVerifiedReport({ findings: [] }),
    });

    mockLabelAndTitleSetup();

    const logSpy = vi.spyOn(console, 'log');
    await createLinearIssuesFromAudit(report, BASE_OPTS);

    const output = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('No issues to create');
  });
});
