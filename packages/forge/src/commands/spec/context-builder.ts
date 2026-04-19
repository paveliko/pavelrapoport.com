import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { glob } from 'glob';
import type { ModuleConfig } from '../audit/types.js';
import type { SpecContext } from './types.js';

// ─── Constants ──────────────────────────────────────────────

/** Max tokens budget per spec check */
const TOKEN_BUDGET = 150_000;

/** Rough chars-per-token ratio */
const CHARS_PER_TOKEN = 4;

/** Max character budget derived from token budget */
const CHAR_BUDGET = TOKEN_BUDGET * CHARS_PER_TOKEN;

// ─── Public API ─────────────────────────────────────────────

/**
 * Build a unified context for the spec check by unioning all agent
 * globs and spec paths from the module config.
 */
export async function buildSpecContext(
  module: ModuleConfig,
  repoRoot: string,
): Promise<SpecContext> {
  // Union all globs and spec paths across every agent in the module
  const allGlobs = new Set<string>();
  const allSpecPaths = new Set<string>();

  for (const scope of Object.values(module.agents)) {
    if (!scope) continue;
    for (const g of scope.globs) allGlobs.add(g);
    for (const s of scope.specs) allSpecPaths.add(s);
  }

  // Load specs (never truncated)
  const specs = await readSpecs([...allSpecPaths], repoRoot);

  // Calculate remaining char budget for code files
  const codeCharBudget = CHAR_BUDGET - specs.length;

  // Load code files within budget
  const codeResult = await readCodeFiles([...allGlobs], repoRoot, codeCharBudget);

  if (codeResult.truncated) {
    console.error(
      `  Warning: Context truncated — ${codeResult.skippedCount} files skipped (token budget exceeded)`,
    );
  }

  const totalChars = specs.length + codeResult.content.length;

  return {
    files: codeResult.content,
    specs,
    fileCount: codeResult.fileCount,
    specPaths: [...allSpecPaths],
    estimatedTokens: Math.ceil(totalChars / CHARS_PER_TOKEN),
    truncated: codeResult.truncated,
  };
}

// ─── Spec loading (never truncated) ─────────────────────────

async function readSpecs(specPaths: string[], repoRoot: string): Promise<string> {
  const sections: string[] = [];

  for (const specPath of specPaths) {
    const fullPath = resolve(repoRoot, specPath);
    try {
      const content = await readFile(fullPath, 'utf-8');
      sections.push(`--- SPEC: ${specPath} ---\n${content}`);
    } catch {
      sections.push(`--- SPEC: ${specPath} --- [FILE NOT FOUND]`);
    }
  }

  return sections.join('\n\n');
}

// ─── Glob helpers ──────────────────────────────────────────

/** Escape Next.js dynamic segments so glob treats brackets literally. */
function escapeNextjsBrackets(pattern: string): string {
  return pattern.replace(/\[([a-zA-Z]\w*)\]/g, '\\[$1\\]');
}

// ─── Code file loading (with budget) ────────────────────────

interface CodeFilesResult {
  content: string;
  fileCount: number;
  truncated: boolean;
  skippedCount: number;
}

async function readCodeFiles(
  globs: string[],
  repoRoot: string,
  charBudget: number,
): Promise<CodeFilesResult> {
  // Resolve all globs to file paths
  const allPaths = new Set<string>();
  for (const pattern of globs) {
    const matches = await glob(escapeNextjsBrackets(pattern), {
      cwd: repoRoot,
      absolute: false,
      nodir: true,
    });
    for (const m of matches) allPaths.add(m);
  }

  // Sort by priority (lower = higher priority)
  const sorted = [...allPaths].sort((a, b) => filePriority(a) - filePriority(b));

  // Read files within budget
  const sections: string[] = [];
  let usedChars = 0;
  let skippedCount = 0;

  for (const filePath of sorted) {
    const fullPath = resolve(repoRoot, filePath);
    try {
      const content = await readFile(fullPath, 'utf-8');
      const section = `--- FILE: ${filePath} ---\n${content}`;

      if (usedChars + section.length > charBudget) {
        skippedCount = sorted.length - sections.length;
        break;
      }

      sections.push(section);
      usedChars += section.length;
    } catch {
      // Skip unreadable files
    }
  }

  return {
    content: sections.join('\n\n'),
    fileCount: sections.length,
    truncated: skippedCount > 0,
    skippedCount,
  };
}

// ─── File priority (lower = higher priority) ────────────────

function filePriority(path: string): number {
  if (path.includes('/actions/')) return 0;
  if (path.includes('/domain/')) return 1;
  if (path.includes('/queries/')) return 2;
  if (path.includes('/migrations/')) return 3;
  if (/(?:page|layout|loading|error|not-found)\.tsx$/.test(path)) return 4;
  return 5;
}
