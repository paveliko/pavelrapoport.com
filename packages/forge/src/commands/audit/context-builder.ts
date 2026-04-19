import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { glob } from 'glob';
import type { AgentContext, AgentName, ModuleConfig } from './types.js';
import { escapeNextjsBrackets, filePriority } from './utils.js';

// ─── Constants ────��─────────────────────────────────────────

/** Max input tokens budget per agent (200K window minus output reservation) */
const TOKEN_BUDGET = 190_000;

/**
 * Chars-per-token ratio for TypeScript/TSX code on Claude's tokenizer.
 * Empirically measured at ~1.7-2.0 for this codebase. We use a conservative
 * value so the char budget never exceeds the token budget.
 */
const CHARS_PER_TOKEN = 1.8;

/** Max character budget derived from token budget */
const CHAR_BUDGET = TOKEN_BUDGET * CHARS_PER_TOKEN;

// ─── Public API ────────────────────────────��────────────────

/**
 * Build context for each agent in the module.
 * Reads files, loads specs, applies token budget truncation.
 */
export async function buildAgentContexts(
  module: ModuleConfig,
  agentNames: AgentName[],
  repoRoot: string,
): Promise<Record<string, AgentContext>> {
  const contexts: Record<string, AgentContext> = {};

  for (const name of agentNames) {
    const scope = module.agents[name];
    if (!scope) {
      throw new Error(`Agent "${name}" is not configured in module "${module.name}"`);
    }

    // Load prompt template
    const promptTemplate = await loadPromptTemplate(name);

    // Load specs (never truncated)
    const specs = await readSpecs(scope.specs, repoRoot);

    // Load code files (token-budget truncated)
    const specChars = specs.length;
    const promptChars = promptTemplate.length;
    const codeCharBudget = CHAR_BUDGET - specChars - promptChars;
    const files = await readCodeFiles(scope.globs, repoRoot, codeCharBudget, name);

    const totalChars = promptChars + specChars + files.content.length;

    contexts[name] = {
      files: files.content,
      specs,
      promptTemplate,
      model: scope.model,
      estimatedTokens: Math.ceil(totalChars / CHARS_PER_TOKEN),
    };
  }

  return contexts;
}

// ─── Prompt loading ──────────────────────────��──────────────

const PROMPT_DIR = new URL('./prompts/', import.meta.url);

async function loadPromptTemplate(agentName: AgentName): Promise<string> {
  const promptPath = new URL(`${agentName}.md`, PROMPT_DIR);
  return readFile(promptPath, 'utf-8');
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

// ─── Code file loading (with budget) ────────────────────────

interface CodeFilesResult {
  content: string;
  fileCount: number;
  truncated: boolean;
}

async function readCodeFiles(
  globs: string[],
  repoRoot: string,
  charBudget: number,
  agentName: AgentName,
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

  // Sort: priority depends on agent role (e.g. PM needs routes first)
  const sorted = [...allPaths].sort((a, b) => {
    return filePriority(a, agentName) - filePriority(b, agentName);
  });

  // Read files within budget
  const sections: string[] = [];
  let usedChars = 0;
  let truncated = false;

  for (const filePath of sorted) {
    const fullPath = resolve(repoRoot, filePath);
    try {
      const content = await readFile(fullPath, 'utf-8');
      const section = `--- FILE: ${filePath} ---\n${content}`;

      if (usedChars + section.length > charBudget) {
        truncated = true;
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
    truncated,
  };
}
