#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { initForge, type Forge } from './index.js';
import type { AuditOptions } from './commands/audit/types.js';
import type { SpecOptions } from './commands/spec/types.js';
import type { EstimateOptions } from './commands/estimate/types.js';
import type { ReviewOptions } from './commands/review/types.js';

// ─── Arg parsing ────────────────────────────────────────────

const args = process.argv.slice(2).filter((a) => a !== '--');
const command = args[0];

if (!command || args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

if (!['audit', 'spec', 'review', 'estimate'].includes(command)) {
  printUsage();
  process.exit(1);
}

// ─── Resolve repo root ─────────────────────────────────────

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

const repoRoot = findRepoRoot(process.cwd());

// ─── Forge initialization ──────────────────────────────────
// Must complete before any command dispatch — prompt builders call
// getProjectContext() and will throw if the context is not loaded.

const forge: Forge = await initForge();

// ─── Command dispatch ──────────────────────────────────────

if (command === 'audit') {
  await handleAudit();
} else if (command === 'spec') {
  await handleSpec();
} else if (command === 'review') {
  await handleReview();
} else if (command === 'estimate') {
  await handleEstimate();
}

// ─── Audit command ─────────────────────────────────────────

async function handleAudit(): Promise<void> {
  const { runAudit } = await import('./commands/audit/orchestrator.js');
  const { listModules, getModule } = await import('./commands/audit/modules.js');
  const { AGENT_NAMES } = await import('./commands/audit/types.js');
  type AgentName = (typeof AGENT_NAMES)[number];

  const moduleName = args[1];
  if (!moduleName) {
    console.error(`Usage: forge audit <module>\nModules: ${listModules().join(', ')}`);
    process.exit(1);
  }

  const agentFlag = getFlag(args, '--agent');
  const estimate = args.includes('--estimate');
  const verbose = args.includes('--verbose');
  const json = args.includes('--json');
  const persist = args.includes('--persist');
  const createIssuesValue = getFlag(args, '--create-issues');
  const createIssues: 'all' | 'critical' | undefined =
    createIssuesValue === 'critical'
      ? 'critical'
      : createIssuesValue !== undefined || args.includes('--create-issues')
        ? 'all'
        : undefined;

  if (!getModule(moduleName)) {
    console.error(`Unknown module: "${moduleName}". Available: ${listModules().join(', ')}`);
    process.exit(1);
  }

  if (agentFlag && !AGENT_NAMES.includes(agentFlag as AgentName)) {
    console.error(`Unknown agent: "${agentFlag}". Available: ${AGENT_NAMES.join(', ')}`);
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !estimate) {
    console.error('ANTHROPIC_API_KEY environment variable is required.');
    console.error('Run: pnpm secrets:pull');
    process.exit(1);
  }

  const linearApiKey = process.env.LINEAR_API_KEY;
  const linearTeamId = process.env.LINEAR_TEAM_ID;
  if (createIssues) {
    if (!linearApiKey) {
      console.error('LINEAR_API_KEY environment variable is required for --create-issues.');
      process.exit(1);
    }
    if (!linearTeamId) {
      console.error('LINEAR_TEAM_ID environment variable is required for --create-issues.');
      process.exit(1);
    }
  }

  const options: AuditOptions = {
    moduleName,
    apiKey: apiKey ?? '',
    agentFilter: agentFlag as AgentName | undefined,
    estimate,
    verbose,
    json,
    createIssues,
    persist,
  };

  const report = await runAudit(options, repoRoot);

  if (report && createIssues) {
    try {
      const { createLinearIssuesFromAudit } =
        await import('./commands/audit/linear-integration.js');
      await createLinearIssuesFromAudit(report, {
        linearApiKey: linearApiKey!,
        linearTeamId: linearTeamId!,
        filter: createIssues,
        verbose,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\nWarning: Linear issue creation failed: ${msg}`);
    }
  }

  if (report && persist) {
    try {
      const { persistAuditResult } = await import('./core/persist.js');
      const dbResult = await persistAuditResult(report);
      if (dbResult) {
        console.log(`\n✅ Persisted to DB: ${dbResult.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\nWarning: DB persist failed: ${msg}`);
    }
  }
}

// ─── Spec command ──────────────────────────────────────────

async function handleSpec(): Promise<void> {
  const { runSpecCheck } = await import('./commands/spec/checker.js');
  const { listModules, getModule } = await import('./commands/audit/modules.js');

  const isAll = args.includes('--all');
  const moduleName = args[1] && !args[1].startsWith('--') ? args[1] : '';

  if (!isAll && !moduleName) {
    console.error('Usage: forge spec <module> [options]');
    console.error('       forge spec --all [options]');
    console.error(`Modules: ${listModules().join(', ')}`);
    process.exit(1);
  }

  if (moduleName && !getModule(moduleName)) {
    console.error(`Unknown module: "${moduleName}". Available: ${listModules().join(', ')}`);
    process.exit(1);
  }

  const estimate = args.includes('--estimate');
  const verbose = args.includes('--verbose');
  const json = args.includes('--json');
  const fix = args.includes('--fix');
  const sonnet = args.includes('--sonnet');
  const persist = args.includes('--persist');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !estimate) {
    console.error('ANTHROPIC_API_KEY environment variable is required.');
    console.error('Run: pnpm secrets:pull');
    process.exit(1);
  }

  const options: SpecOptions = {
    moduleName,
    apiKey: apiKey ?? '',
    all: isAll,
    fix,
    estimate,
    verbose,
    json,
    sonnet,
    persist,
  };

  await runSpecCheck(options, repoRoot);
}

// ─── Review command ────────────────────────────────────────

async function handleReview(): Promise<void> {
  const { runReview } = await import('./commands/review/reviewer.js');

  const sha = getFlag(args, '--sha');
  const file = getFlag(args, '--file');
  const strictFlag = getFlag(args, '--strict');
  const strict: false | 'all' | 'critical' =
    strictFlag === 'critical' ? 'critical' : args.includes('--strict') ? 'all' : false;
  const verbose = args.includes('--verbose');
  const json = args.includes('--json');
  const estimate = args.includes('--estimate');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !estimate) {
    console.error('ANTHROPIC_API_KEY environment variable is required.');
    console.error('Run: pnpm secrets:pull');
    process.exit(1);
  }

  const options: ReviewOptions = {
    apiKey: apiKey ?? '',
    repoRoot,
    sha,
    file,
    strict,
    verbose,
    json,
    estimate,
  };

  await runReview(options);
}

// ─── Estimate command ─────────────────────────────────────

async function handleEstimate(): Promise<void> {
  const { runEstimate } = await import('./commands/estimate/estimator.js');

  const issueKeys = args.slice(1).filter((a) => !a.startsWith('--'));
  if (issueKeys.length === 0) {
    console.error('Usage: forge estimate <issue-key> [issue-key...]');
    console.error('Example: forge estimate ABC-123 ABC-124');
    process.exit(1);
  }

  const verbose = args.includes('--verbose');
  const json = args.includes('--json');
  const persist = args.includes('--persist');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is required.');
    console.error('Run: pnpm secrets:pull');
    process.exit(1);
  }

  const linearApiKey = process.env.LINEAR_API_KEY;
  if (!linearApiKey) {
    console.error('LINEAR_API_KEY environment variable is required.');
    process.exit(1);
  }

  const options: EstimateOptions = {
    issueKeys,
    apiKey,
    linearApiKey,
    issuePrefix: forge.issuePrefix,
    repoRoot,
    verbose,
    json,
    persist,
  };

  await runEstimate(options);
}

// ─── Helpers ────────────────────────────────────────────────

function getFlag(argv: string[], flag: string): string | undefined {
  const prefix = `${flag}=`;
  const entry = argv.find((a) => a.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : undefined;
}

function printUsage(): void {
  console.log(`
FORGE CLI

Usage:
  forge audit <module> [options]
  forge spec <module> [options]
  forge spec --all [options]
  forge review [options]
  forge estimate <issue-key> [issue-key...] [options]

Audit Options:
  --agent=<name>           Run single agent
  --estimate               Print cost estimate without running
  --verbose                Show detailed output
  --json                   Output JSON to stdout
  --persist                Save results to Supabase (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
  --create-issues          Create Linear issues from findings
  --create-issues=critical Only create issues for critical findings

Spec Options:
  --all                    Check all modules
  --fix                    Generate OpenSpec proposals for undocumented code
  --estimate               Print cost estimate without running
  --sonnet                 Use Sonnet instead of Opus (cheaper)
  --persist                Save results to Supabase (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
  --verbose                Show detailed output
  --json                   Output JSON to stdout

Review Options:
  --sha=<hash>             Review a specific commit
  --file=<path>            Review changes in a single file
  --strict                 Exit 1 on warnings or criticals
  --strict=critical        Exit 1 on criticals only
  --estimate               Print cost estimate without running
  --verbose                Show detailed output
  --json                   Output JSON to stdout

Estimate Options:
  --verbose                Show detailed output
  --json                   Output JSON to stdout
  --persist                Save results to Supabase (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)

Examples:
  forge audit worker
  forge audit worker --agent=security
  forge spec worker
  forge spec --all
  forge spec worker --fix
  forge spec worker --estimate
  forge review
  forge review --file=src/app/page.tsx
  forge review --strict=critical
  forge estimate ABC-123
  forge estimate ABC-123 ABC-124
  forge estimate ABC-123 --json
`);
}
