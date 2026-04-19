import { describe, expect, it } from 'vitest';
import {
  escapeNextjsBrackets,
  filePriority,
  formatCriticalBody,
  formatDuration,
  formatSummaryBody,
  groupAgentsByModel,
  parseJsonResponse,
  parseVerifierResponse,
  sanitizeFileName,
} from '../commands/audit/utils.js';
import { makeAgentContext, makeVerifiedFinding } from './fixtures.js';
import type { AgentName } from '../commands/audit/types.js';

// ─── sanitizeFileName ──────────────────────────────────────

describe('sanitizeFileName', () => {
  it('converts complex names with special chars', () => {
    expect(sanitizeFileName('UI Library (@scope/ui)')).toBe('ui-library-scope-ui');
  });

  it('leaves simple names unchanged', () => {
    expect(sanitizeFileName('worker')).toBe('worker');
  });

  it('strips leading and trailing dashes', () => {
    expect(sanitizeFileName('--leading-trailing--')).toBe('leading-trailing');
  });

  it('returns empty string for all-special-char input', () => {
    expect(sanitizeFileName('!@#$%')).toBe('');
  });
});

// ─── formatDuration ────────────────────────────────────────

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(5000)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125_000)).toBe('2m 5s');
  });
});

// ─── parseJsonResponse ─────────────────────────────────────

describe('parseJsonResponse', () => {
  it('parses plain JSON', () => {
    const json = JSON.stringify({
      agent: 'pm',
      score: 8,
      total_items: 5,
      passed_items: 4,
      findings: [],
      summary: 'ok',
    });
    const result = parseJsonResponse(json);
    expect(result.agent).toBe('pm');
    expect(result.score).toBe(8);
  });

  it('strips markdown code fences', () => {
    const json = JSON.stringify({
      agent: 'qa',
      score: 7,
      total_items: 3,
      passed_items: 2,
      findings: [],
      summary: 'ok',
    });
    const wrapped = '```json\n' + json + '\n```';
    const result = parseJsonResponse(wrapped);
    expect(result.agent).toBe('qa');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJsonResponse('not json')).toThrow();
  });
});

// ─── parseVerifierResponse ─────────────────────────────────

describe('parseVerifierResponse', () => {
  it('parses verifier JSON with code fences', () => {
    const json = JSON.stringify({
      findings: [],
      overall_score: 8,
      agent_scores: { security: 8 },
      skipped_agents: [],
      summary: 'good',
    });
    const wrapped = '```json\n' + json + '\n```';
    const result = parseVerifierResponse(wrapped);
    expect(result.overall_score).toBe(8);
  });
});

// ─── groupAgentsByModel ────────────────────────────────────

describe('groupAgentsByModel', () => {
  it('groups agents by their model alias', () => {
    const agents: AgentName[] = ['security', 'pm', 'architect'];
    const contexts: Record<string, ReturnType<typeof makeAgentContext>> = {
      security: makeAgentContext({ model: 'opus' }),
      pm: makeAgentContext({ model: 'sonnet' }),
      architect: makeAgentContext({ model: 'opus' }),
    };

    const groups = groupAgentsByModel(agents, contexts);
    expect(groups.get('opus')).toEqual(['security', 'architect']);
    expect(groups.get('sonnet')).toEqual(['pm']);
  });

  it('returns a single group for one agent', () => {
    const agents: AgentName[] = ['security'];
    const contexts = { security: makeAgentContext({ model: 'opus' }) };

    const groups = groupAgentsByModel(agents, contexts);
    expect(groups.size).toBe(1);
    expect(groups.get('opus')).toEqual(['security']);
  });
});

// ─── escapeNextjsBrackets ──────────────────────────────────

describe('escapeNextjsBrackets', () => {
  it('escapes Next.js dynamic segments', () => {
    expect(escapeNextjsBrackets('apps/web/src/app/[locale]/(platform)/**')).toBe(
      'apps/web/src/app/\\[locale\\]/(platform)/**',
    );
  });

  it('leaves patterns without brackets unchanged', () => {
    expect(escapeNextjsBrackets('packages/ui/src/**/*.ts')).toBe('packages/ui/src/**/*.ts');
  });
});

// ─── filePriority ──────────────────────────────────────────

describe('filePriority', () => {
  it('gives component-api agent highest priority for composed files', () => {
    expect(filePriority('packages/ui/src/composed/Button.tsx', 'component-api')).toBe(0);
    expect(filePriority('packages/ui/src/primitives/Input.tsx', 'component-api')).toBe(0);
  });

  it('gives pm agent high priority for route files', () => {
    expect(filePriority('apps/web/src/app/worker/page.tsx', 'pm')).toBe(1);
  });

  it('gives security agent low priority for route files, high for migrations', () => {
    expect(filePriority('apps/web/src/app/worker/page.tsx', 'security')).toBe(6);
    expect(filePriority('supabase/migrations/001.sql', 'security')).toBe(1);
  });

  it('assigns default priorities for non-route non-component files', () => {
    expect(filePriority('apps/web/src/actions/create.ts', 'pm')).toBe(0);
    expect(filePriority('apps/web/src/utils.test.ts', 'pm')).toBe(5);
  });
});

// ─── formatCriticalBody ────────────────────────────────────

describe('formatCriticalBody', () => {
  it('formats a critical finding body with all fields', () => {
    const finding = makeVerifiedFinding({
      id: 'sec-1',
      category: 'security',
      file: 'src/auth.ts',
      line: 10,
      description: 'Missing auth check',
      recommendation: 'Add middleware',
      verification_note: 'Confirmed',
    });

    const body = formatCriticalBody(finding, 'worker', '2026-04-05');
    expect(body).toContain('AUDIT Engine');
    expect(body).toContain('`worker`');
    expect(body).toContain('`src/auth.ts:10`');
    expect(body).toContain('## Details');
    expect(body).toContain('## Verification');
  });

  it('omits verification section when note is empty', () => {
    const finding = makeVerifiedFinding({ verification_note: '' });
    const body = formatCriticalBody(finding, 'worker', '2026-04-05');
    expect(body).not.toContain('## Verification');
  });
});

// ─── formatSummaryBody ─────────────────────────────────────

describe('formatSummaryBody', () => {
  it('formats warnings summary', () => {
    const findings = [
      makeVerifiedFinding({ title: 'Warning 1', severity: 'warning' }),
      makeVerifiedFinding({ title: 'Warning 2', severity: 'warning' }),
    ];

    const body = formatSummaryBody(findings, 'worker', '2026-04-05', 'tech-debt');
    expect(body).toContain('## Warnings (2)');
    expect(body).toContain('### 1. Warning 1');
    expect(body).toContain('### 2. Warning 2');
  });

  it('formats spec gaps summary', () => {
    const findings = [makeVerifiedFinding({ title: 'Gap 1', severity: 'spec_gap' })];

    const body = formatSummaryBody(findings, 'platform', '2026-04-05', 'spec-gap');
    expect(body).toContain('## Spec Gaps (1)');
  });
});
