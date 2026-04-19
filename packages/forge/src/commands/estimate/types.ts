// Type definitions for the forge estimate command.

export interface EstimateOptions {
  /** One or more Linear issue keys, e.g. ["ABC-123", "ABC-124"] */
  issueKeys: string[];
  /** Anthropic API key */
  apiKey: string;
  /** Linear API key */
  linearApiKey: string;
  /** Linear issue-key prefix (e.g. "AI"). From ForgeConfig.issuePrefix. */
  issuePrefix: string;
  /** Absolute path to monorepo root */
  repoRoot: string;
  /** Show detailed output */
  verbose?: boolean;
  /** Output JSON to stdout */
  json?: boolean;
  /** Persist results to Supabase */
  persist?: boolean;
}

export type Complexity = 'Low' | 'Medium' | 'High' | 'Very High';
export type Risk = 'Low' | 'Medium' | 'High';
export type Confidence = 'Low' | 'Medium' | 'High';

export interface Estimation {
  issueKey: string;
  title: string;
  complexity: Complexity;
  complexityReason: string;
  risk: Risk;
  riskReason: string;
  storyPoints: number;
  hoursMin: number;
  hoursMax: number;
  dependencies: string[];
  filesNew: number;
  filesModified: number;
  confidence: Confidence;
  confidenceReason: string;
}

export interface EstimateResult {
  estimations: Estimation[];
  totalCostUsd: number;
  totalDurationMs: number;
}
