// Types for the forge review command.

// ─── Severity ──────────────────────────────────────────────

export type ReviewFindingSeverity = 'critical' | 'warning' | 'info';

// ─── Findings ──────────────────────────────────────────────

export interface ReviewFinding {
  id: string;
  severity: ReviewFindingSeverity;
  category: string;
  title: string;
  description: string;
  file: string;
  line: number | null;
  recommendation: string;
  checklist_item: string;
}

// ─── Result from Claude ────────────────────────────────────

export interface ReviewResult {
  findings: ReviewFinding[];
  summary: string;
  files_reviewed: string[];
  diff_stats: {
    additions: number;
    deletions: number;
    files_changed: number;
  };
}

// ─── Full report ───────────────────────────────────────────

export interface ReviewReport {
  branch: string;
  base: string;
  timestamp: string;
  gitSha: string;
  durationMs: number;
  cost: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  result: ReviewResult;
}

// ─── Options ───────────────────────────────────────────────

export interface ReviewOptions {
  apiKey: string;
  repoRoot: string;
  sha?: string;
  file?: string;
  strict: false | 'all' | 'critical';
  verbose: boolean;
  json: boolean;
  estimate: boolean;
}
