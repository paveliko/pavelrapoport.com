import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

let cached: string | null = null;
let cachedFrom: string | null = null;

/**
 * Load the project-context Markdown from disk and cache it in memory.
 * Called once by `initForge()`. Can be called again to switch projects
 * (e.g. in tests).
 */
export async function initProjectContext(path: string): Promise<void> {
  const absolute = resolve(path);
  cached = await readFile(absolute, 'utf-8');
  cachedFrom = absolute;
}

/**
 * Return the cached project-context string.
 * Throws if `initProjectContext()` has not been called yet —
 * this guards against silently using an empty prompt.
 */
export function getProjectContext(): string {
  if (cached === null) {
    throw new Error(
      'Forge: project context is not initialized. ' +
        'Call initForge() (or initProjectContext() directly) before using any command.',
    );
  }
  return cached;
}

/** Path the current context was loaded from, or `null` if uninitialized. */
export function getProjectContextSource(): string | null {
  return cachedFrom;
}

/** Test / hot-reload helper. */
export function resetProjectContext(): void {
  cached = null;
  cachedFrom = null;
}
