import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk, { type ChalkInstance } from 'chalk';
import { estimateCost } from '../../core/anthropic.js';
import type { ModelId } from '../../core/anthropic.js';
import type { SpecCategory, SpecCheckResult, SpecContext, SpecReport } from './types.js';

// ─── Types ──────────────────────────────────────────────────

export interface GenerateSpecReportOptions {
  moduleName: string;
  result: SpecCheckResult;
  cost: number;
  durationMs: number;
  model: string;
  json: boolean;
  verbose: boolean;
  repoRoot: string;
}

// ─── Public API ─────────────────────────────────────────────

export function generateSpecReport(options: GenerateSpecReportOptions): SpecReport {
  const { moduleName, result, cost, durationMs, model, repoRoot } = options;

  const gitSha = getGitSha(repoRoot);
  const timestamp = new Date().toISOString();

  const report: SpecReport = {
    module: moduleName,
    timestamp,
    gitSha,
    durationMs,
    cost,
    model,
    result,
  };

  // Write files
  const specsDir = resolve(repoRoot, '.forge', 'specs');
  mkdirSync(specsDir, { recursive: true });

  const slug = sanitizeFileName(moduleName);
  const fileBase = `${slug}-${timestamp.replace(/[:.]/g, '-')}`;
  const jsonPath = resolve(specsDir, `${fileBase}.json`);
  const mdPath = resolve(specsDir, `${fileBase}.md`);

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, generateMarkdownReport(report));

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTerminalReport(report, jsonPath, mdPath);
  }

  return report;
}

// ─── Estimate printing ──────────────────────────────────────

export function printSpecEstimate(moduleName: string, context: SpecContext, model: ModelId): void {
  const cost = estimateCost(model, context.estimatedTokens * 4);

  console.log(chalk.bold(`\nSpec Check Estimate — ${moduleName}\n`));
  console.log(`  Model:          ${model}`);
  console.log(`  Code files:     ${context.fileCount}`);
  console.log(`  Spec files:     ${context.specPaths.length}`);
  console.log(`  Est. tokens:    ${context.estimatedTokens.toLocaleString()}`);
  console.log(`  Truncated:      ${context.truncated ? 'yes' : 'no'}`);
  console.log(`  Est. cost:      ${chalk.bold(`$${cost.toFixed(3)}`)}`);
  console.log();
}

// ─── Coverage matrix ────────────────────────────────────────

const CATEGORY_ORDER: SpecCategory[] = ['MATCH', 'DRIFT', 'MISSING-CODE', 'MISSING-DOC', 'STALE'];

const CATEGORY_COLORS: Record<SpecCategory, ChalkInstance> = {
  MATCH: chalk.green,
  DRIFT: chalk.yellow,
  'MISSING-CODE': chalk.red,
  'MISSING-DOC': chalk.magenta,
  STALE: chalk.gray,
};

function buildCoverageMatrix(result: SpecCheckResult): Map<SpecCategory, number> {
  const counts = new Map<SpecCategory, number>();
  for (const cat of CATEGORY_ORDER) counts.set(cat, 0);

  for (const req of result.requirements) {
    counts.set(req.category, (counts.get(req.category) ?? 0) + 1);
  }

  return counts;
}

function renderBar(count: number, total: number, width: number): string {
  if (total === 0) return '░'.repeat(width);
  const filled = Math.round((count / total) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ─── Terminal report ────────────────────────────────────────

function printTerminalReport(report: SpecReport, jsonPath: string, mdPath: string): void {
  const { result } = report;
  const { match, total, percentage } = result.coverage;
  const counts = buildCoverageMatrix(result);
  const totalFindings = result.requirements.length;
  const duration = formatDuration(report.durationMs);

  console.log();
  console.log(chalk.bold(`FORGE SPEC CHECK — ${report.module} module`));
  console.log(chalk.dim('═'.repeat(50)));

  // Coverage score
  const coverageColor =
    percentage >= 80 ? chalk.green : percentage >= 60 ? chalk.yellow : chalk.red;
  console.log(
    `Coverage: ${coverageColor(chalk.bold(`${match}/${total} (${percentage.toFixed(1)}%)`))}`,
  );
  console.log(
    `Git: ${chalk.dim(report.gitSha)} | Cost: ${chalk.dim(`$${report.cost.toFixed(3)}`)} | Time: ${chalk.dim(duration)}`,
  );
  console.log();

  // Coverage matrix
  console.log(chalk.bold('Coverage Matrix'));
  console.log(chalk.dim('─'.repeat(50)));

  const barWidth = 18;
  for (const cat of CATEGORY_ORDER) {
    const count = counts.get(cat) ?? 0;
    const pct = totalFindings > 0 ? (count / totalFindings) * 100 : 0;
    const color = CATEGORY_COLORS[cat];
    const bar = renderBar(count, totalFindings, barWidth);
    console.log(
      `  ${color(cat.padEnd(14))} ${String(count).padStart(3)}  ${color(bar)}  ${pct.toFixed(1)}%`,
    );
  }
  console.log();

  // Non-MATCH findings
  const findings = result.requirements.filter((r) => r.category !== 'MATCH');

  if (findings.length > 0) {
    console.log(chalk.bold('Findings'));
    console.log(chalk.dim('─'.repeat(50)));

    for (const cat of CATEGORY_ORDER) {
      if (cat === 'MATCH') continue;
      const catFindings = findings.filter((f) => f.category === cat);
      if (catFindings.length === 0) continue;

      const color = CATEGORY_COLORS[cat];
      console.log(color.bold(`\n${cat} (${catFindings.length})`));

      for (const f of catFindings) {
        console.log(color(`  [${f.id}] ${f.title}`));
        if (f.codeFile) {
          console.log(chalk.dim(`    → ${f.codeFile}${f.codeLine ? `:${f.codeLine}` : ''}`));
        }
        console.log(chalk.dim(`    → ${f.recommendation}`));
      }
    }
    console.log();
  }

  // Summary
  console.log(chalk.dim('─'.repeat(50)));
  console.log(chalk.italic(result.summary));
  console.log();
  console.log(chalk.dim(`JSON report: ${jsonPath}`));
  console.log(chalk.dim(`  MD report: ${mdPath}`));
  console.log();
}

// ─── Markdown report ───────────────────────────────────────

function generateMarkdownReport(report: SpecReport): string {
  const { result } = report;
  const { match, total, percentage } = result.coverage;
  const counts = buildCoverageMatrix(result);
  const duration = formatDuration(report.durationMs);
  const date = report.timestamp.split('T')[0];
  const lines: string[] = [];

  lines.push(`# SPEC CHECK Report: ${report.module}`);
  lines.push(
    `**Date**: ${date} | **Git**: ${report.gitSha} | **Duration**: ${duration} | **Cost**: $${report.cost.toFixed(2)}`,
  );
  lines.push('');

  // Coverage
  lines.push(`## Coverage: ${match}/${total} (${percentage.toFixed(1)}%)`);
  lines.push('');
  lines.push('| Category | Count | Percentage |');
  lines.push('|----------|------:|----------:|');
  for (const cat of CATEGORY_ORDER) {
    const count = counts.get(cat) ?? 0;
    const pct =
      result.requirements.length > 0
        ? ((count / result.requirements.length) * 100).toFixed(1)
        : '0.0';
    lines.push(`| ${cat} | ${count} | ${pct}% |`);
  }
  lines.push('');

  // Findings by category
  for (const cat of CATEGORY_ORDER) {
    if (cat === 'MATCH') continue;
    const catFindings = result.requirements.filter((r) => r.category === cat);
    if (catFindings.length === 0) continue;

    const emoji =
      cat === 'DRIFT' ? '🟡' : cat === 'MISSING-CODE' ? '🔴' : cat === 'MISSING-DOC' ? '📝' : '⚪';

    lines.push(`## ${emoji} ${cat} (${catFindings.length})`);
    lines.push('');

    catFindings.forEach((f, i) => {
      lines.push(`### ${i + 1}. ${f.title}`);
      lines.push(`- **ID**: ${f.id}`);
      lines.push(`- **Spec**: \`${f.specFile}\``);
      if (f.codeFile) {
        lines.push(`- **Code**: \`${f.codeFile}${f.codeLine ? `:${f.codeLine}` : ''}\``);
      }
      lines.push(`- **Details**: ${f.description}`);
      lines.push(`- **Recommendation**: ${f.recommendation}`);
      lines.push('');
    });
  }

  // MATCH summary (collapsed)
  const matches = result.requirements.filter((r) => r.category === 'MATCH');
  if (matches.length > 0) {
    lines.push(`## ✅ MATCH (${matches.length})`);
    lines.push('');
    for (const m of matches) {
      lines.push(`- **${m.id}**: ${m.title}`);
    }
    lines.push('');
  }

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(result.summary);
  lines.push('');

  return lines.join('\n');
}

// ─── Helpers ────────────────────────────────────────────────

function getGitSha(repoRoot: string): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}
