// Prompt loading for the review command.

import { readFile } from 'node:fs/promises';
import { getProjectContext } from '../../core/project-context.js';

// ─── Prompt loading ────────────────────────────────────────

const PROMPT_DIR = new URL('./prompts/', import.meta.url);

export async function loadReviewPrompt(): Promise<string> {
  const url = new URL('reviewer.md', PROMPT_DIR);
  const raw = await readFile(url, 'utf-8');
  return raw.replaceAll('{{PROJECT_CONTEXT}}', getProjectContext());
}
