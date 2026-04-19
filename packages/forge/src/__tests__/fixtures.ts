import type {
  AgentContext,
  AgentFinding,
  AgentResult,
  AuditReport,
  FindingSeverity,
  VerifiedFinding,
  VerifiedReport,
} from '../commands/audit/types.js';
import type { ModelAlias } from '../core/anthropic.js';

// ─── Agent finding factory ─────────────────────────────────

export function makeFinding(overrides: Partial<AgentFinding> = {}): AgentFinding {
  return {
    id: 'sec-1',
    severity: 'critical' as FindingSeverity,
    category: 'security',
    title: 'Missing RLS policy',
    description: 'Table lacks row-level security',
    file: 'supabase/migrations/001.sql',
    line: 42,
    recommendation: 'Add RLS policy for organization_id',
    checklist_item: 'All tables have RLS enabled',
    ...overrides,
  };
}

// ─── Agent result factory ──────────────────────────────────

export function makeAgentResult(overrides: Partial<AgentResult> = {}): AgentResult {
  return {
    agent: 'security',
    score: 7.5,
    total_items: 10,
    passed_items: 8,
    findings: [makeFinding()],
    summary: 'Overall good security posture with one critical finding.',
    ...overrides,
  };
}

// ─── Verified finding factory ──────────────────────────────

export function makeVerifiedFinding(overrides: Partial<VerifiedFinding> = {}): VerifiedFinding {
  return {
    ...makeFinding(),
    verified: true,
    verification_note: 'Confirmed via code review',
    merged_with: [],
    ...overrides,
  };
}

// ─── Verified report factory ───────────────────────────────

export function makeVerifiedReport(overrides: Partial<VerifiedReport> = {}): VerifiedReport {
  return {
    findings: [makeVerifiedFinding()],
    overall_score: 7.5,
    agent_scores: { security: 7.5 },
    skipped_agents: [],
    summary: 'Module is in good shape.',
    ...overrides,
  };
}

// ─── Audit report factory ──────────────────────────────────

export function makeAuditReport(overrides: Partial<AuditReport> = {}): AuditReport {
  return {
    module: 'worker',
    timestamp: '2026-04-05T10:00:00.000Z',
    gitSha: 'abc1234',
    durationMs: 120_000,
    costBreakdown: { security: 0.9, verifier: 0.45 },
    totalCost: 1.35,
    verified: makeVerifiedReport(),
    ...overrides,
  };
}

// ─── Agent context factory ─────────────────────────────────

export function makeAgentContext(overrides: Partial<AgentContext> = {}): AgentContext {
  return {
    files: '--- FILE: src/test.ts ---\nconsole.log("test");',
    specs: '--- SPEC: openspec/specs/test.md ---\n# Test spec',
    promptTemplate:
      'You are an audit agent. Module: {{MODULE_NAME}}. Files: {{FILE_CONTENTS}}. Specs: {{SPEC_CONTENTS}}.',
    model: 'opus' as ModelAlias,
    estimatedTokens: 5000,
    ...overrides,
  };
}

// ─── Anthropic response factory ────────────────────────────

export function makeAnthropicResponse(text: string, inputTokens = 1000, outputTokens = 500) {
  return {
    id: 'msg_test_123',
    type: 'message' as const,
    content: [{ type: 'text' as const, text }],
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    model: 'claude-opus-4-6',
    role: 'assistant' as const,
  };
}
