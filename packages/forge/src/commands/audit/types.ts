import type { ModelAlias } from '../../core/anthropic.js';

// ─── Agent names ────────────────────────────────────────────

export const AGENT_NAMES = [
  'pm',
  'architect',
  'tech-lead',
  'ui-designer',
  'security',
  'qa',
  'seo',
  'growth',
  'performance',
  'a11y',
  'risk',
  'component-api',
] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

/** Original 6 agents used by app modules (worker, platform, admin) */
export const DEFAULT_AGENT_NAMES: readonly AgentName[] = [
  'pm',
  'architect',
  'tech-lead',
  'ui-designer',
  'security',
  'qa',
];

/** Verifier weight per agent — used to compute overall_score */
export const AGENT_WEIGHTS: Record<AgentName, number> = {
  pm: 1,
  architect: 1.5,
  'tech-lead': 1.5,
  'ui-designer': 1,
  security: 2,
  qa: 1,
  seo: 1.5,
  growth: 1,
  performance: 1.5,
  a11y: 1.5,
  risk: 2,
  'component-api': 1.5,
};

// ─── Module configuration ───────────────────────────────────

export interface AgentScope {
  /** Glob patterns for files this agent should review */
  globs: string[];
  /** OpenSpec spec paths to include as context */
  specs: string[];
  /** Model to use: 'opus' for critical agents, 'sonnet' for routine */
  model: ModelAlias;
}

export interface ModuleConfig {
  name: string;
  description: string;
  agents: Partial<Record<AgentName, AgentScope>>;
}

// ─── Agent context (assembled by context-builder) ───────────

export interface AgentContext {
  /** Concatenated file contents with separators */
  files: string;
  /** Concatenated spec contents */
  specs: string;
  /** Raw prompt template (markdown) */
  promptTemplate: string;
  /** Resolved model ID */
  model: ModelAlias;
  /** Estimated input token count */
  estimatedTokens: number;
}

// ─── Agent output ───────────────────────────────────────────

export type FindingSeverity = 'critical' | 'warning' | 'info' | 'spec_gap';

export interface AgentFinding {
  id: string;
  severity: FindingSeverity;
  category: string;
  title: string;
  description: string;
  file: string;
  line: number | null;
  recommendation: string;
  checklist_item: string;
}

export interface AgentResult {
  agent: AgentName | string;
  score: number;
  total_items: number;
  passed_items: number;
  findings: AgentFinding[];
  summary: string;
}

// ─── Agent execution result (wraps success/failure) ─────────

export interface AgentSuccess {
  status: 'success';
  result: AgentResult;
  cost: number;
  durationMs: number;
}

export interface AgentSkipped {
  status: 'skipped';
  agent: AgentName;
  reason: string;
  durationMs: number;
}

export type AgentOutcome = AgentSuccess | AgentSkipped;

// ─── Verifier output ────────────────────────────────────────

export interface VerifiedFinding extends AgentFinding {
  verified: boolean;
  verification_note: string;
  merged_with: string[];
}

export interface VerifiedReport {
  findings: VerifiedFinding[];
  overall_score: number;
  agent_scores: Record<string, number>;
  skipped_agents: Array<{ agent: string; reason: string }>;
  summary: string;
}

// ─── Full audit report (with metadata) ──────────────────────

export interface AuditReport {
  module: string;
  timestamp: string;
  gitSha: string;
  durationMs: number;
  costBreakdown: Record<string, number>;
  totalCost: number;
  verified: VerifiedReport;
}

// ─── CLI options ────────────────────────────────────────────

export interface AuditOptions {
  moduleName: string;
  apiKey: string;
  agentFilter?: AgentName;
  estimate: boolean;
  verbose: boolean;
  json: boolean;
  createIssues?: 'all' | 'critical';
  persist?: boolean;
}
