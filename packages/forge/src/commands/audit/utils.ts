import type {
  AgentContext,
  AgentName,
  AgentResult,
  VerifiedFinding,
  VerifiedReport,
} from './types.js';

// ─── File name helpers ─────────────────────────────────────

export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

// ─── JSON parsing ──────────────────────────────────────────

export function parseJsonResponse(text: string): AgentResult {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned) as AgentResult;
}

export function parseVerifierResponse(text: string): VerifiedReport {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned) as VerifiedReport;
}

// ─── Agent batching ────────────────────────────────────────

export function groupAgentsByModel(
  agentNames: AgentName[],
  contexts: Record<string, AgentContext>,
): Map<string, AgentName[]> {
  const groups = new Map<string, AgentName[]>();
  for (const name of agentNames) {
    const model = contexts[name]!.model;
    if (!groups.has(model)) groups.set(model, []);
    groups.get(model)!.push(name);
  }
  return groups;
}

// ─── Glob helpers ──────────────────────────────────────────

/** Escape Next.js dynamic segments so glob treats brackets literally. */
export function escapeNextjsBrackets(pattern: string): string {
  return pattern.replace(/\[([a-zA-Z]\w*)\]/g, '\\[$1\\]');
}

// ─── File priority (lower = higher priority) ────────────────

const ROUTE_FILE_RE = /(?:page|layout|loading|error|not-found)\.tsx$/;

/** Agents that need route files at high priority */
const ROUTE_HIGH: ReadonlySet<AgentName> = new Set(['pm', 'qa', 'seo', 'growth']);
/** Agents that need route files at medium priority */
const ROUTE_MED: ReadonlySet<AgentName> = new Set([
  'architect',
  'tech-lead',
  'ui-designer',
  'performance',
  'a11y',
  'risk',
  'component-api',
]);
/** Agents that need component files at highest priority */
const COMPONENT_HIGH: ReadonlySet<AgentName> = new Set(['component-api']);

export function filePriority(path: string, agent: AgentName): number {
  // Component-focused agents: composed/primitives are highest priority
  if (COMPONENT_HIGH.has(agent)) {
    if (path.includes('/composed/') || path.includes('/primitives/')) return 0;
    if (path.includes('/index.ts')) return 1; // barrel exports
    if (path.includes('/hooks/')) return 2;
    if (path.includes('/lib/')) return 3;
    return 4;
  }

  const isRoute = ROUTE_FILE_RE.test(path);

  if (isRoute) {
    if (ROUTE_HIGH.has(agent)) return 1;
    if (ROUTE_MED.has(agent)) return 3;
    return 6; // security — route shells are low value
  }

  if (path.includes('/actions/')) return 0;
  if (path.includes('/migrations/')) return 1;
  if (path.includes('/queries/')) return 2;
  if (path.includes('/domain/')) return 3;
  if (path.includes('/auth/')) return 4;
  if (path.includes('.test.') || path.includes('.spec.')) return 5;
  if (path.includes('/composed/') || path.includes('/primitives/')) return 7;
  return 8;
}

// ─── Linear issue body formatters ─────────────────────────

export function formatCriticalBody(finding: VerifiedFinding, module: string, date: string): string {
  const lines = [
    `**Source**: AUDIT Engine (\`${module}\`, ${date}). Finding: \`${finding.id}\`.`,
    '',
    `**Category**: ${finding.category}`,
    `**File**: \`${finding.file}${finding.line ? `:${finding.line}` : ''}\``,
    '',
    '## Details',
    finding.description,
    '',
    '## Recommendation',
    finding.recommendation,
  ];

  if (finding.verification_note) {
    lines.push('', '## Verification', finding.verification_note);
  }

  return lines.join('\n');
}

export function formatSummaryBody(
  findings: VerifiedFinding[],
  module: string,
  date: string,
  label: string,
): string {
  const heading = label === 'tech-debt' ? 'Warnings' : 'Spec Gaps';
  const lines = [
    `**Source**: AUDIT Engine (\`${module}\`, ${date}).`,
    '',
    `## ${heading} (${findings.length})`,
    '',
  ];

  findings.forEach((f, i) => {
    lines.push(`### ${i + 1}. ${f.title}`);
    lines.push(`- **File**: \`${f.file}${f.line ? `:${f.line}` : ''}\``);
    lines.push(`- ${f.description}`);
    lines.push(`- **Fix**: ${f.recommendation}`);
    lines.push('');
  });

  return lines.join('\n');
}
