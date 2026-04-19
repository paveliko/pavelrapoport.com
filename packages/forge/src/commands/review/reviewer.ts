// Main reviewer orchestrator: git diff → context → Claude → report.

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { callClaude, computeCost, MODELS } from '../../core/anthropic.js';
import { loadReviewPrompt } from './prompt-loader.js';
import { generateReviewReport, printEstimate } from './report.js';
import type { ReviewOptions, ReviewReport, ReviewResult } from './types.js';

// ─── Constants ─────────────────────────────────────────────

const MODEL = MODELS.opus;
const MAX_OUTPUT_TOKENS = 8192;
const TOKEN_BUDGET = 150_000;
const CHARS_PER_TOKEN = 4;
const CHAR_BUDGET = TOKEN_BUDGET * CHARS_PER_TOKEN;

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.webp',
  '.avif',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.mp4',
  '.mp3',
  '.wav',
  '.ogg',
  '.lock',
]);

// ─── Public API ────────────────────────────────────────────

export async function runReview(options: ReviewOptions): Promise<ReviewReport | null> {
  const startTime = Date.now();

  // Resolve base branch
  const base = resolveBaseBranch(options.repoRoot);
  const branch = getCurrentBranch(options.repoRoot);
  const gitSha = getGitSha(options.repoRoot);

  if (options.verbose) {
    console.log(chalk.dim(`Branch: ${branch}`));
    console.log(chalk.dim(`Base: ${base}`));
    console.log(chalk.dim(`SHA: ${gitSha}`));
  }

  // Get changed files
  const changedFiles = getChangedFiles(options.repoRoot, options, base);
  if (changedFiles.length === 0) {
    if (!options.json) console.log(chalk.yellow('No changes to review.'));
    return null;
  }

  if (!options.json)
    console.log(chalk.bold(`\nReviewing ${changedFiles.length} changed file(s)…\n`));
  if (options.verbose) {
    for (const f of changedFiles) console.log(chalk.dim(`  ${f}`));
    console.log();
  }

  // Build diff + surrounding context
  const diffContent = getDiffContent(options.repoRoot, options, base);
  const surroundingContext = buildSurroundingContext(options.repoRoot, changedFiles, diffContent);

  // Progressive token budgeting
  const userMessage = buildUserMessage(diffContent, surroundingContext, options.repoRoot, base);

  if (options.estimate) {
    printEstimate(userMessage.length);
    return null;
  }

  // Load prompt
  const systemPrompt = await loadReviewPrompt();

  if (options.verbose) {
    const estimatedTokens = Math.ceil((systemPrompt.length + userMessage.length) / CHARS_PER_TOKEN);
    console.log(chalk.dim(`Estimated input tokens: ~${estimatedTokens.toLocaleString()}`));
    console.log(chalk.dim(`Calling Claude (${MODEL})…\n`));
  }

  // Call Claude
  const response = await callClaudeWithJsonRetry(options.apiKey, systemPrompt, userMessage);
  const durationMs = Date.now() - startTime;

  // Parse result
  const text = response.content[0]?.text ?? '';
  const result = parseReviewResult(text);
  const cost = computeCost(
    response.model,
    response.usage.input_tokens,
    response.usage.output_tokens,
  );

  // Generate report
  const report = generateReviewReport({
    branch,
    base,
    gitSha,
    result,
    cost,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    durationMs,
    json: options.json,
    verbose: options.verbose,
    repoRoot: options.repoRoot,
  });

  // Strict mode exit code
  if (options.strict) {
    const hasCriticals = result.findings.some((f) => f.severity === 'critical');
    const hasWarnings = result.findings.some((f) => f.severity === 'warning');

    if (options.strict === 'critical' && hasCriticals) {
      process.exit(1);
    }
    if (options.strict === 'all' && (hasCriticals || hasWarnings)) {
      process.exit(1);
    }
  }

  return report;
}

// ─── Git operations ────────────────────────────────────────

function resolveBaseBranch(repoRoot: string): string {
  // Try main, then master
  for (const branch of ['main', 'master']) {
    try {
      execSync(`git rev-parse --verify ${branch}`, { cwd: repoRoot, stdio: 'pipe' });
      return branch;
    } catch {
      // try next
    }
  }
  throw new Error('Could not find main or master branch.');
}

function getCurrentBranch(repoRoot: string): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getGitSha(repoRoot: string): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getMergeBase(repoRoot: string, base: string): string {
  try {
    return execSync(`git merge-base ${base} HEAD`, { cwd: repoRoot, encoding: 'utf-8' }).trim();
  } catch {
    return base;
  }
}

function getChangedFiles(repoRoot: string, options: ReviewOptions, base: string): string[] {
  let cmd: string;

  if (options.sha) {
    cmd = `git diff-tree --no-commit-id --name-only -r ${options.sha}`;
  } else if (options.file) {
    // Validate the file appears in the diff
    const mergeBase = getMergeBase(repoRoot, base);
    const allChanged = execSync(`git diff ${mergeBase} --name-only`, {
      cwd: repoRoot,
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (!allChanged.includes(options.file)) {
      console.error(chalk.red(`File "${options.file}" is not in the diff against ${base}.`));
      process.exit(1);
    }
    return [options.file];
  } else {
    const mergeBase = getMergeBase(repoRoot, base);
    cmd = `git diff ${mergeBase} --name-only`;
  }

  const output = execSync(cmd, { cwd: repoRoot, encoding: 'utf-8' }).trim();
  if (!output) return [];

  return output
    .split('\n')
    .filter(Boolean)
    .filter((f) => {
      const ext = f.slice(f.lastIndexOf('.'));
      return !BINARY_EXTENSIONS.has(ext);
    });
}

function getDiffContent(repoRoot: string, options: ReviewOptions, base: string): string {
  let cmd: string;

  if (options.sha) {
    cmd = `git diff ${options.sha}^..${options.sha}`;
  } else if (options.file) {
    const mergeBase = getMergeBase(repoRoot, base);
    cmd = `git diff ${mergeBase} -- ${options.file}`;
  } else {
    const mergeBase = getMergeBase(repoRoot, base);
    cmd = `git diff ${mergeBase}`;
  }

  return execSync(cmd, { cwd: repoRoot, encoding: 'utf-8' });
}

function _getDiffStats(
  repoRoot: string,
  options: ReviewOptions,
  base: string,
): { additions: number; deletions: number; files_changed: number } {
  let cmd: string;

  if (options.sha) {
    cmd = `git diff ${options.sha}^..${options.sha} --shortstat`;
  } else if (options.file) {
    const mergeBase = getMergeBase(repoRoot, base);
    cmd = `git diff ${mergeBase} -- ${options.file} --shortstat`;
  } else {
    const mergeBase = getMergeBase(repoRoot, base);
    cmd = `git diff ${mergeBase} --shortstat`;
  }

  const output = execSync(cmd, { cwd: repoRoot, encoding: 'utf-8' }).trim();
  if (!output) return { additions: 0, deletions: 0, files_changed: 0 };

  const filesMatch = output.match(/(\d+) files? changed/);
  const insertionsMatch = output.match(/(\d+) insertions?/);
  const deletionsMatch = output.match(/(\d+) deletions?/);

  return {
    files_changed: filesMatch ? parseInt(filesMatch[1]!, 10) : 0,
    additions: insertionsMatch ? parseInt(insertionsMatch[1]!, 10) : 0,
    deletions: deletionsMatch ? parseInt(deletionsMatch[1]!, 10) : 0,
  };
}

// ─── Context building ──────────────────────────────────────

function buildSurroundingContext(
  repoRoot: string,
  changedFiles: string[],
  diffContent: string,
  surroundingLines = 50,
): string {
  const sections: string[] = [];

  for (const file of changedFiles) {
    const filePath = resolve(repoRoot, file);
    let fileContent: string;
    try {
      fileContent = readFileSync(filePath, 'utf-8');
    } catch {
      // File may have been deleted
      continue;
    }

    const lines = fileContent.split('\n');
    const changedLineNumbers = extractChangedLineNumbers(diffContent, file);
    if (changedLineNumbers.length === 0) continue;

    // Collect ranges around changed lines
    const ranges = mergeRanges(
      changedLineNumbers.map((ln) => ({
        start: Math.max(0, ln - surroundingLines),
        end: Math.min(lines.length, ln + surroundingLines),
      })),
    );

    const contextLines: string[] = [`### ${file}`];
    for (const range of ranges) {
      contextLines.push(`// Lines ${range.start + 1}-${range.end}`);
      for (let i = range.start; i < range.end; i++) {
        contextLines.push(`${i + 1}: ${lines[i]}`);
      }
      contextLines.push('');
    }

    sections.push(contextLines.join('\n'));
  }

  return sections.join('\n\n');
}

function extractChangedLineNumbers(diffContent: string, file: string): number[] {
  const lineNumbers: number[] = [];
  const lines = diffContent.split('\n');

  // Find the diff section for this file
  let inFile = false;
  let currentLine = 0;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      inFile = line.includes(`b/${file}`);
      continue;
    }

    if (!inFile) continue;

    // Parse hunk header: @@ -oldStart,oldCount +newStart,newCount @@
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentLine = parseInt(hunkMatch[1]!, 10) - 1;
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentLine++;
      lineNumbers.push(currentLine);
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // Deleted line — don't increment currentLine
    } else {
      currentLine++;
    }
  }

  return lineNumbers;
}

function mergeRanges(
  ranges: Array<{ start: number; end: number }>,
): Array<{ start: number; end: number }> {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

// ─── User message assembly ─────────────────────────────────

function buildUserMessage(
  diffContent: string,
  surroundingContext: string,
  _repoRoot: string,
  _base: string,
): string {
  const fullMessage = `## Diff

\`\`\`diff
${diffContent}
\`\`\`

## File Context (surrounding lines for each changed file)

${surroundingContext}`;

  // Progressive token budgeting
  if (fullMessage.length <= CHAR_BUDGET) {
    return fullMessage;
  }

  // Try reducing surrounding context
  console.error(chalk.yellow('Large diff detected — reducing surrounding context…'));

  // Just use the diff without surrounding context if it's too large
  const diffOnly = `## Diff

\`\`\`diff
${diffContent}
\`\`\`

(Surrounding file context omitted due to diff size.)`;

  if (diffOnly.length <= CHAR_BUDGET) {
    return diffOnly;
  }

  // Truncate the diff itself as last resort
  console.error(chalk.yellow('Very large diff — truncating. Consider using --file to scope.'));
  const truncatedDiff = diffContent.slice(0, CHAR_BUDGET - 500);
  return `## Diff

\`\`\`diff
${truncatedDiff}
\`\`\`

[TRUNCATED — diff exceeds token budget. Use --file=<path> to review specific files.]`;
}

// ─── Claude call with JSON retry ───────────────────────────

async function callClaudeWithJsonRetry(apiKey: string, systemPrompt: string, userMessage: string) {
  const response = await callClaude(apiKey, {
    model: MODEL,
    system: systemPrompt,
    userMessage,
    maxTokens: MAX_OUTPUT_TOKENS,
  });

  // Try parsing, retry if invalid JSON
  const text = response.content[0]?.text ?? '';
  try {
    JSON.parse(text);
    return response;
  } catch {
    console.error(chalk.dim('Retrying with explicit JSON instruction…'));
    return callClaude(apiKey, {
      model: MODEL,
      system: systemPrompt,
      userMessage: `${userMessage}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY raw JSON, no markdown code fences, no explanatory text.`,
      maxTokens: MAX_OUTPUT_TOKENS,
    });
  }
}

function parseReviewResult(text: string): ReviewResult {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```json?\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim();

  try {
    return JSON.parse(cleaned) as ReviewResult;
  } catch {
    console.error(chalk.red('Failed to parse Claude response as JSON.'));
    console.error(chalk.dim(text.slice(0, 500)));
    // Return empty result rather than crashing
    return {
      findings: [],
      summary: 'Failed to parse review output.',
      files_reviewed: [],
      diff_stats: { additions: 0, deletions: 0, files_changed: 0 },
    };
  }
}
