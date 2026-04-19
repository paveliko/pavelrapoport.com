// Report generation for the forge review command.
// Outputs terminal (chalk), JSON, and Markdown reports.

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { estimateCost, MODELS } from '../../core/anthropic.js';
import type { ReviewReport, ReviewResult } from './types.js';

// ─── Types ──────────────────────────────────────────────────

export interface GenerateReviewReportOptions {
  branch: string;
  base: string;
  gitSha: string;
  result: ReviewResult;
  cost: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  json: boolean;
  verbose: boolean;
  repoRoot: string;
}

// ─── Public API ─────────────────────────────────────────────

export function generateReviewReport(options: GenerateReviewReportOptions): ReviewReport {
  const {
    branch,
    base,
    gitSha,
    result,
    cost,
    model,
    inputTokens,
    outputTokens,
    durationMs,
    repoRoot,
  } = options;

  const timestamp = new Date().toISOString();

  const report: ReviewReport = {
    branch,
    base,
    timestamp,
    gitSha,
    durationMs,
    cost,
    model,
    inputTokens,
    outputTokens,
    result,
  };

  // Write files
  const reviewDir = resolve(repoRoot, '.forge', 'reviews');
  mkdirSync(reviewDir, { recursive: true });
  const slug = sanitizeFileName(branch);
  const ts = timestamp.replace(/[:.]/g, '-');

  const jsonPath = resolve(reviewDir, `${slug}-${ts}.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const mdPath = resolve(reviewDir, `${slug}-${ts}.md`);
  writeFileSync(mdPath, generateMarkdown(report));

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTerminalReport(report, jsonPath, mdPath);
  }

  return report;
}

// ─── Estimate printing ─────────────────────────────────────

export function printEstimate(inputChars: number): void {
  const cost = estimateCost(MODELS.opus, inputChars, 8192);
  const tokens = Math.ceil(inputChars / 4);

  console.log(chalk.bold('\nCost Estimate — Code Review\n'));
  console.log('Model            Est. Tokens   Est. Cost');
  console.log('───────────────  ───────────   ─────────');
  console.log(`${'opus'.padEnd(17)}${String(tokens).padStart(11)}   $${cost.toFixed(3)}`);
  console.log('───────────────  ───────────   ─────────');
  console.log(
    `${'TOTAL'.padEnd(17)}${String(tokens).padStart(11)}   ${chalk.bold(`$${cost.toFixed(3)}`)}`,
  );
  console.log();
}

// ─── Markdown report ────────────────────────────────────────

function generateMarkdown(report: ReviewReport): string {
  const { result } = report;
  const criticals = result.findings.filter((f) => f.severity === 'critical');
  const warnings = result.findings.filter((f) => f.severity === 'warning');
  const infos = result.findings.filter((f) => f.severity === 'info');

  const duration = formatDuration(report.durationMs);
  const date = report.timestamp.split('T')[0];
  const lines: string[] = [];

  // Header
  lines.push(`# Code Review: ${report.branch}`);
  lines.push(
    `**Date**: ${date} | **Base**: ${report.base} | **Git**: ${report.gitSha} | **Duration**: ${duration} | **Cost**: $${report.cost.toFixed(2)}`,
  );
  lines.push('');

  // Diff stats
  lines.push(
    `**Files changed**: ${result.diff_stats.files_changed} | **Additions**: +${result.diff_stats.additions} | **Deletions**: -${result.diff_stats.deletions}`,
  );
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(result.summary);
  lines.push('');

  // Findings by severity
  const renderFindings = (heading: string, emoji: string, findings: typeof result.findings) => {
    if (findings.length === 0) return;
    lines.push(`## ${emoji} ${heading} (${findings.length})`);
    lines.push('');
    findings.forEach((f, i) => {
      lines.push(`### ${i + 1}. ${f.title}`);
      lines.push(`- **File**: \`${f.file}${f.line ? `:${f.line}` : ''}\``);
      lines.push(`- **Category**: ${f.category}`);
      lines.push(`- **Checklist**: ${f.checklist_item}`);
      lines.push(`- **Details**: ${f.description}`);
      lines.push(`- **Recommendation**: ${f.recommendation}`);
      lines.push('');
    });
  };

  renderFindings('Critical Findings', '🔴', criticals);
  renderFindings('Warnings', '🟡', warnings);
  renderFindings('Info', 'ℹ️', infos);

  // Footer
  lines.push('---');
  lines.push(
    `Files reviewed: ${result.files_reviewed.length} | Total findings: ${result.findings.length}`,
  );
  lines.push('');

  return lines.join('\n');
}

// ─── Terminal report ────────────────────────────────────────

function printTerminalReport(report: ReviewReport, jsonPath: string, mdPath: string): void {
  const { result } = report;
  const criticals = result.findings.filter((f) => f.severity === 'critical');
  const warnings = result.findings.filter((f) => f.severity === 'warning');
  const infos = result.findings.filter((f) => f.severity === 'info');

  const duration = formatDuration(report.durationMs);

  // Header
  console.log();
  console.log(chalk.bold(`FORGE CODE REVIEW — ${report.branch}`));
  console.log(chalk.dim('═'.repeat(50)));
  console.log(
    `Base: ${chalk.dim(report.base)} | Git: ${chalk.dim(report.gitSha)} | Cost: ${chalk.dim(`$${report.cost.toFixed(3)}`)} | Time: ${chalk.dim(duration)}`,
  );
  console.log(
    `Files: ${result.diff_stats.files_changed} | ${chalk.green(`+${result.diff_stats.additions}`)} ${chalk.red(`-${result.diff_stats.deletions}`)}`,
  );
  console.log();

  // Findings
  if (criticals.length > 0) {
    console.log(chalk.red.bold(`CRITICAL (${criticals.length})`));
    for (const f of criticals) {
      console.log(chalk.red(`  [${f.id}] ${f.title}`));
      console.log(chalk.dim(`    → ${f.file}${f.line ? `:${f.line}` : ''}`));
      console.log(chalk.dim(`    → ${f.recommendation}`));
    }
    console.log();
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow.bold(`WARNING (${warnings.length})`));
    for (const f of warnings) {
      console.log(chalk.yellow(`  [${f.id}] ${f.title}`));
      console.log(chalk.dim(`    → ${f.file}${f.line ? `:${f.line}` : ''}`));
      console.log(chalk.dim(`    → ${f.recommendation}`));
    }
    console.log();
  }

  if (infos.length > 0) {
    console.log(chalk.blue.bold(`INFO (${infos.length})`));
    for (const f of infos) {
      console.log(chalk.blue(`  [${f.id}] ${f.title}`));
      console.log(chalk.dim(`    → ${f.file}${f.line ? `:${f.line}` : ''}`));
    }
    console.log();
  }

  if (result.findings.length === 0) {
    console.log(chalk.green.bold('No issues found! ✓'));
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

// ─── Helpers ────────────────────────────────────────────────

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
