// Prompt loading and user message builders for the estimate command.

import { readFile } from 'node:fs/promises';
import { getProjectContext } from '../../core/project-context.js';

// ─── Prompt loading ────────────────────────────────────────

const PROMPT_DIR = new URL('./prompts/', import.meta.url);

export async function loadEstimatePrompt(): Promise<string> {
  const url = new URL('estimator.md', PROMPT_DIR);
  const raw = await readFile(url, 'utf-8');
  return raw.replaceAll('{{PROJECT_CONTEXT}}', getProjectContext());
}

// ─── User prompt builder ──────────────────────────────────

export function buildEstimateUserPrompt(
  title: string,
  description: string,
  specContext?: string,
): string {
  const specBlock = specContext ? `## Relevant specifications\n\n${specContext}\n\n---\n\n` : '';

  return `${specBlock}## Issue: ${title}\n\n${description}`;
}
