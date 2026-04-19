// ─── Finding categories ─────────────────────────────────────

export type SpecCategory = 'MATCH' | 'DRIFT' | 'MISSING-DOC' | 'MISSING-CODE' | 'STALE';

// ─── Requirement-level finding ──────────────────────────────

export interface SpecRequirement {
  id: string;
  title: string;
  specFile: string;
  category: SpecCategory;
  description: string;
  codeFile?: string;
  codeLine?: number;
  recommendation: string;
}

// ─── Claude's response shape ────────────────────────────────

export interface SpecCheckResult {
  requirements: SpecRequirement[];
  coverage: { match: number; total: number; percentage: number };
  summary: string;
}

// ─── Full report with metadata ──────────────────────────────

export interface SpecReport {
  module: string;
  timestamp: string;
  gitSha: string;
  durationMs: number;
  cost: number;
  model: string;
  result: SpecCheckResult;
}

// ─── Context assembled for a single spec check ─────────────

export interface SpecContext {
  /** Concatenated file contents with separators */
  files: string;
  /** Concatenated spec contents */
  specs: string;
  /** Number of code files included */
  fileCount: number;
  /** Spec file paths that were loaded */
  specPaths: string[];
  /** Estimated input token count */
  estimatedTokens: number;
  /** Whether code files were truncated due to token budget */
  truncated: boolean;
}

// ─── CLI options ────────────────────────────────────────────

export interface SpecOptions {
  moduleName: string;
  apiKey: string;
  all: boolean;
  fix: boolean;
  estimate: boolean;
  verbose: boolean;
  json: boolean;
  /** Use Sonnet instead of Opus for cost savings */
  sonnet: boolean;
  /** Persist results to Supabase forge_specs table */
  persist: boolean;
}
