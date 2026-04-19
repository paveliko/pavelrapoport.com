import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initForge } from '../index.js';
import { resetProjectContext } from '../core/project-context.js';

describe('initForge() round-trip', () => {
  let tmp: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    tmp = await mkdtemp(resolve(tmpdir(), 'forge-init-test-'));
    resetProjectContext();
    delete process.env.FORGE_PROJECT_CONTEXT_PATH;
    delete process.env.FORGE_ISSUE_PREFIX;
  });

  afterEach(async () => {
    resetProjectContext();
    process.env = { ...originalEnv };
    await rm(tmp, { recursive: true, force: true });
  });

  it('forge.projectContext equals contents of the FORGE.md file', async () => {
    const path = resolve(tmp, 'FORGE.md');
    const body = '# FORGE\n\nproject context body\n';
    await writeFile(path, body);

    const forge = await initForge({ projectContextPath: path, issuePrefix: 'AI' });

    expect(forge.projectContext).toBe(body);
    expect(forge.issuePrefix).toBe('AI');
    expect(forge.config.projectContextPath).toBe(path);
  });

  it('normalizes lowercase prefix at init time', async () => {
    const path = resolve(tmp, 'FORGE.md');
    await writeFile(path, 'context');

    const forge = await initForge({ projectContextPath: path, issuePrefix: 'ai' });

    expect(forge.issuePrefix).toBe('AI');
  });
});
