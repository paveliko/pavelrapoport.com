import chalk from 'chalk';
import type { AuditReport } from './types.js';
import { formatCriticalBody, formatSummaryBody } from './utils.js';

// ─── Constants ─────────────────────────────────────────────

const LINEAR_API_URL = 'https://api.linear.app/graphql';

const LABEL_DEFS: Record<string, { color: string; description: string }> = {
  audit: { color: '#E5484D', description: 'FORGE audit finding' },
  'tech-debt': { color: '#F59E0B', description: 'Technical debt from audit' },
  'spec-gap': { color: '#7C3AED', description: 'Spec gap from audit' },
};

// ─── GraphQL helper ────────────────────────────────────────

async function linearGql<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Linear API error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors?.length) {
    throw new Error(`Linear GraphQL error: ${json.errors[0]!.message}`);
  }

  return json.data!;
}

// ─── Label resolution ──────────────────────────────────────

async function ensureLabels(apiKey: string, teamId: string): Promise<Map<string, string>> {
  const data = await linearGql<{
    team: { labels: { nodes: Array<{ id: string; name: string }> } };
  }>(
    apiKey,
    `query($teamId: String!) {
      team(id: $teamId) {
        labels { nodes { id name } }
      }
    }`,
    { teamId },
  );

  const existing = new Map<string, string>();
  for (const label of data.team.labels.nodes) {
    existing.set(label.name.toLowerCase(), label.id);
  }

  const result = new Map<string, string>();

  for (const [name, def] of Object.entries(LABEL_DEFS)) {
    const found = existing.get(name);
    if (found) {
      result.set(name, found);
      continue;
    }

    // Create missing label
    const created = await linearGql<{
      issueLabelCreate: { success: boolean; issueLabel: { id: string } };
    }>(
      apiKey,
      `mutation($input: IssueLabelCreateInput!) {
        issueLabelCreate(input: $input) {
          success
          issueLabel { id }
        }
      }`,
      { input: { name, color: def.color, description: def.description, teamId } },
    );

    result.set(name, created.issueLabelCreate.issueLabel.id);
  }

  return result;
}

// ─── Duplicate detection ───────────────────────────────────

async function findExistingIssueTitles(apiKey: string, teamId: string): Promise<Set<string>> {
  const titles = new Set<string>();
  let cursor: string | undefined;

  // Paginate through all matching issues
  while (true) {
    const data = await linearGql<{
      team: {
        issues: {
          nodes: Array<{ title: string }>;
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      };
    }>(
      apiKey,
      `query($teamId: String!, $after: String) {
        team(id: $teamId) {
          issues(
            filter: {
              title: { containsIgnoreCase: "[Audit]" }
              state: { type: { in: ["backlog", "unstarted"] } }
            }
            first: 250
            after: $after
          ) {
            nodes { title }
            pageInfo { hasNextPage endCursor }
          }
        }
      }`,
      { teamId, after: cursor ?? null },
    );

    for (const issue of data.team.issues.nodes) {
      titles.add(issue.title);
    }

    if (!data.team.issues.pageInfo.hasNextPage) break;
    cursor = data.team.issues.pageInfo.endCursor ?? undefined;
  }

  return titles;
}

// ─── Issue creation ────────────────────────────────────────

interface CreateIssueInput {
  title: string;
  description: string;
  teamId: string;
  priority: number;
  labelIds: string[];
}

async function createIssue(
  apiKey: string,
  input: CreateIssueInput,
): Promise<{ identifier: string; url: string }> {
  const data = await linearGql<{
    issueCreate: { success: boolean; issue: { identifier: string; url: string } };
  }>(
    apiKey,
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { identifier url }
      }
    }`,
    {
      input: {
        title: input.title,
        description: input.description,
        teamId: input.teamId,
        priority: input.priority,
        labelIds: input.labelIds,
      },
    },
  );

  if (!data.issueCreate.success) {
    throw new Error('Linear issue creation failed');
  }

  return data.issueCreate.issue;
}

// ─── Public API ────────────────────────────────────────────

export interface CreateIssuesOptions {
  linearApiKey: string;
  linearTeamId: string;
  filter: 'all' | 'critical';
  verbose: boolean;
}

export async function createLinearIssuesFromAudit(
  report: AuditReport,
  opts: CreateIssuesOptions,
): Promise<void> {
  const { linearApiKey, linearTeamId, filter, verbose } = opts;
  const date = report.timestamp.split('T')[0]!;

  // Categorize verified findings
  const verified = report.verified.findings.filter((f) => f.verified);
  const criticals = verified.filter((f) => f.severity === 'critical');
  const warnings = verified.filter((f) => f.severity === 'warning');
  const specGaps = verified.filter((f) => f.severity === 'spec_gap');

  const planned: Array<{ title: string; build: () => CreateIssueInput }> = [];

  console.log(chalk.bold('\nLinear issue creation'));
  console.log(chalk.dim('─'.repeat(40)));

  // Resolve labels
  if (verbose) console.log('  Resolving labels...');
  const labelMap = await ensureLabels(linearApiKey, linearTeamId);

  // Fetch existing titles for dedup
  if (verbose) console.log('  Checking for duplicates...');
  const existingTitles = await findExistingIssueTitles(linearApiKey, linearTeamId);

  // Plan critical issues (1 per finding)
  for (const finding of criticals) {
    const title = `[Audit] ${finding.title}`;
    planned.push({
      title,
      build: () => ({
        title,
        description: formatCriticalBody(finding, report.module, date),
        teamId: linearTeamId,
        priority: 1, // Urgent
        labelIds: [labelMap.get('audit')!],
      }),
    });
  }

  // Plan warning summary (1 per module)
  if (filter === 'all' && warnings.length > 0) {
    const title = `[Audit] Tech debt: ${report.module} module (${warnings.length} warnings)`;
    planned.push({
      title,
      build: () => ({
        title,
        description: formatSummaryBody(warnings, report.module, date, 'tech-debt'),
        teamId: linearTeamId,
        priority: 4, // Low
        labelIds: [labelMap.get('tech-debt')!],
      }),
    });
  }

  // Plan spec gap summary (1 per module)
  if (filter === 'all' && specGaps.length > 0) {
    const title = `[Audit] Spec gaps: ${report.module} module (${specGaps.length} gaps)`;
    planned.push({
      title,
      build: () => ({
        title,
        description: formatSummaryBody(specGaps, report.module, date, 'spec-gap'),
        teamId: linearTeamId,
        priority: 4, // Low
        labelIds: [labelMap.get('spec-gap')!],
      }),
    });
  }

  if (planned.length === 0) {
    console.log('  No issues to create.');
    return;
  }

  // Create issues sequentially, skipping duplicates
  let created = 0;
  let skipped = 0;

  for (const item of planned) {
    if (existingTitles.has(item.title)) {
      if (verbose) console.log(chalk.dim(`  ⏭ ${item.title} — skipped (duplicate)`));
      skipped++;
      continue;
    }

    try {
      const issue = await createIssue(linearApiKey, item.build());
      console.log(chalk.green(`  ✓ ${issue.identifier} — ${item.title}`));
      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`  ✗ ${item.title} — ${msg}`));
    }
  }

  // Summary
  console.log();
  console.log(
    chalk.bold(`Created ${created} issue(s)`) +
      (skipped > 0 ? chalk.dim(`, skipped ${skipped} duplicate(s)`) : ''),
  );
  console.log();
}
