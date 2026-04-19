import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { estimateCost, MODELS } from '../../core/anthropic.js';
import type { AgentContext, AgentName, AuditReport, VerifiedReport } from './types.js';
import { formatDuration, sanitizeFileName } from './utils.js';

// ─── Types ──────────────────────────────────────────────────

export interface GenerateReportOptions {
  moduleName: string;
  verified: VerifiedReport;
  costBreakdown: Record<string, number>;
  totalCost: number;
  durationMs: number;
  json: boolean;
  verbose: boolean;
  repoRoot: string;
}

// ─── Public API ─────────────────────────────────────────────

export function generateReport(options: GenerateReportOptions): AuditReport {
  const { moduleName, verified, costBreakdown, totalCost, durationMs, repoRoot } = options;

  const gitSha = getGitSha(repoRoot);
  const timestamp = new Date().toISOString();

  const report: AuditReport = {
    module: moduleName,
    timestamp,
    gitSha,
    durationMs,
    costBreakdown,
    totalCost,
    verified,
  };

  // Write JSON file
  const auditDir = resolve(repoRoot, '.forge', 'audits');
  mkdirSync(auditDir, { recursive: true });
  const slug = sanitizeFileName(moduleName);
  const fileName = `${slug}-${timestamp.replace(/[:.]/g, '-')}.json`;
  const filePath = resolve(auditDir, fileName);
  writeFileSync(filePath, JSON.stringify(report, null, 2));

  // Write Markdown file
  const mdFileName = `${slug}-${timestamp.replace(/[:.]/g, '-')}.md`;
  const mdFilePath = resolve(auditDir, mdFileName);
  writeFileSync(mdFilePath, generateMarkdownReport(report));

  if (options.json) {
    // JSON mode: print to stdout
    console.log(JSON.stringify(report, null, 2));
  } else {
    // Terminal mode: colored output
    printTerminalReport(report, filePath, mdFilePath);
  }

  return report;
}

// ─── Estimate printing ──────────────────────────────────────

export function printEstimate(
  moduleName: string,
  agentNames: AgentName[],
  contexts: Record<string, AgentContext>,
): void {
  console.log(chalk.bold(`\nCost Estimate — ${moduleName} module\n`));
  console.log('Agent            Model    Est. Tokens   Est. Cost');
  console.log('───────────────  ───────  ───────────   ─────────');

  let totalTokens = 0;
  let totalCost = 0;

  for (const name of agentNames) {
    const ctx = contexts[name]!;
    const modelId = MODELS[ctx.model];
    const cost = estimateCost(modelId, ctx.estimatedTokens * 4);
    totalTokens += ctx.estimatedTokens;
    totalCost += cost;

    console.log(
      `${name.padEnd(17)}${ctx.model.padEnd(9)}${String(ctx.estimatedTokens).padStart(11)}   $${cost.toFixed(3)}`,
    );
  }

  // Add verifier estimate
  const verifierInputChars = totalTokens * 0.1 * 4; // ~10% of total as findings summary
  const verifierCost = estimateCost(MODELS.opus, verifierInputChars);
  totalCost += verifierCost;

  console.log(
    `${'verifier'.padEnd(17)}${'opus'.padEnd(9)}${String(Math.ceil(verifierInputChars / 4)).padStart(11)}   $${verifierCost.toFixed(3)}`,
  );

  console.log('───────────────  ───────  ───────────   ─────────');
  console.log(
    `${'TOTAL'.padEnd(17)}${''.padEnd(9)}${String(totalTokens + Math.ceil(verifierInputChars / 4)).padStart(11)}   ${chalk.bold(`$${totalCost.toFixed(3)}`)}`,
  );
  console.log();
}

// ─── Markdown report ───────────────────────────────────────

function generateMarkdownReport(report: AuditReport): string {
  const { verified } = report;
  const verifiedFindings = verified.findings.filter((f) => f.verified);
  const criticals = verifiedFindings.filter((f) => f.severity === 'critical');
  const warnings = verifiedFindings.filter((f) => f.severity === 'warning');
  const specGaps = verifiedFindings.filter((f) => f.severity === 'spec_gap');
  const infos = verifiedFindings.filter((f) => f.severity === 'info');
  const falsePositives = verified.findings.filter((f) => !f.verified);

  const duration = formatDuration(report.durationMs);
  const date = report.timestamp.split('T')[0];
  const lines: string[] = [];

  // Header
  lines.push(`# AUDIT Report: ${report.module}`);
  lines.push(
    `**Date**: ${date} | **Git**: ${report.gitSha} | **Duration**: ${duration} | **Cost**: $${report.totalCost.toFixed(2)}`,
  );
  lines.push('');

  // Scores table
  lines.push('## Scores');
  lines.push('');
  lines.push('| Agent | Score | Status |');
  lines.push('|-------|-------|--------|');
  for (const [agent, score] of Object.entries(verified.agent_scores)) {
    const emoji = score >= 7 ? '🟢' : score >= 4 ? '🟡' : '🔴';
    lines.push(`| ${agent} | ${score.toFixed(1)}/10 | ${emoji} |`);
  }
  for (const skipped of verified.skipped_agents) {
    lines.push(`| ${skipped.agent} | — | ⏭️ ${skipped.reason} |`);
  }
  lines.push(`| **Overall** | **${verified.overall_score.toFixed(1)}/10** | |`);
  lines.push('');

  // Findings by severity
  const renderFindings = (heading: string, emoji: string, findings: typeof verifiedFindings) => {
    if (findings.length === 0) return;
    lines.push(`## ${emoji} ${heading} (${findings.length})`);
    lines.push('');
    findings.forEach((f, i) => {
      lines.push(`### ${i + 1}. ${f.title}`);
      lines.push(`- **ID**: ${f.id}`);
      lines.push(`- **Category**: ${f.category}`);
      lines.push(`- **File**: \`${f.file}${f.line ? `:${f.line}` : ''}\``);
      lines.push(`- **Checklist**: ${f.checklist_item}`);
      lines.push(`- **Details**: ${f.description}`);
      lines.push(`- **Recommendation**: ${f.recommendation}`);
      if (f.verification_note) {
        lines.push(`- **Verification**: ${f.verification_note}`);
      }
      lines.push('');
    });
  };

  renderFindings('Critical Findings', '🔴', criticals);
  renderFindings('Warnings', '🟡', warnings);
  renderFindings('Spec Gaps', '📝', specGaps);
  renderFindings('Info', '🟢', infos);

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(verified.summary);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push(
    `Verified findings: ${verifiedFindings.length} | False positives filtered: ${falsePositives.length}`,
  );
  lines.push('');

  return lines.join('\n');
}

// ─── Terminal report ────────────────────────────────────────

function printTerminalReport(report: AuditReport, filePath: string, mdFilePath: string): void {
  const { verified } = report;
  const verifiedFindings = verified.findings.filter((f) => f.verified);
  const criticals = verifiedFindings.filter((f) => f.severity === 'critical');
  const warnings = verifiedFindings.filter((f) => f.severity === 'warning');
  const infos = verifiedFindings.filter((f) => f.severity === 'info');
  const specGaps = verifiedFindings.filter((f) => f.severity === 'spec_gap');
  const falsePositives = verified.findings.filter((f) => !f.verified);

  const duration = formatDuration(report.durationMs);

  // Header
  console.log();
  console.log(chalk.bold(`FORGE AUDIT REPORT — ${report.module} module`));
  console.log(chalk.dim('═'.repeat(50)));

  // Score
  const scoreColor =
    verified.overall_score >= 7
      ? chalk.green
      : verified.overall_score >= 4
        ? chalk.yellow
        : chalk.red;
  console.log(
    `Overall Score: ${scoreColor(chalk.bold(`${verified.overall_score.toFixed(1)}/10`))}`,
  );
  console.log(
    `Git: ${chalk.dim(report.gitSha)} | Cost: ${chalk.dim(`$${report.totalCost.toFixed(3)}`)} | Time: ${chalk.dim(duration)}`,
  );
  console.log();

  // Per-agent scores
  console.log(chalk.bold('Agent Scores'));
  console.log(chalk.dim('─'.repeat(40)));
  for (const [agent, score] of Object.entries(verified.agent_scores)) {
    const agentColor = score >= 7 ? chalk.green : score >= 4 ? chalk.yellow : chalk.red;
    console.log(`  ${agent.padEnd(15)} ${agentColor(`${score.toFixed(1)}/10`)}`);
  }
  for (const skipped of verified.skipped_agents) {
    console.log(
      `  ${skipped.agent.padEnd(15)} ${chalk.gray('SKIPPED')} — ${chalk.dim(skipped.reason)}`,
    );
  }
  console.log();

  // Findings by severity
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

  if (specGaps.length > 0) {
    console.log(chalk.magenta.bold(`SPEC GAP (${specGaps.length})`));
    for (const f of specGaps) {
      console.log(chalk.magenta(`  [${f.id}] ${f.title}`));
      console.log(chalk.dim(`    → ${f.file}`));
      console.log(chalk.dim(`    → ${f.recommendation}`));
    }
    console.log();
  }

  if (infos.length > 0) {
    console.log(chalk.blue.bold(`INFO (${infos.length})`));
    for (const f of infos) {
      console.log(chalk.blue(`  [${f.id}] ${f.title}`));
      console.log(chalk.dim(`    → ${f.file}`));
    }
    console.log();
  }

  // Summary
  console.log(chalk.dim('─'.repeat(50)));
  console.log(
    `Verified: ${verifiedFindings.length} | False positives filtered: ${falsePositives.length}`,
  );
  console.log();
  console.log(chalk.italic(verified.summary));
  console.log();
  console.log(chalk.dim(`JSON report: ${filePath}`));
  console.log(chalk.dim(`  MD report: ${mdFilePath}`));
  console.log();
}

// ─── Helpers ────────────────────────────────────────────────

function getGitSha(repoRoot: string): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}
