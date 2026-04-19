import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getProjectContext,
  initProjectContext,
  resetProjectContext,
} from '../core/project-context.js';

describe('project-context lifecycle', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(resolve(tmpdir(), 'forge-ctx-test-'));
    resetProjectContext();
  });

  afterEach(async () => {
    resetProjectContext();
    await rm(tmp, { recursive: true, force: true });
  });

  it('getProjectContext() throws before initProjectContext is called', () => {
    expect(() => getProjectContext()).toThrow(/not initialized/);
  });

  it('re-initialization swaps the cached context', async () => {
    const a = resolve(tmp, 'a.md');
    const b = resolve(tmp, 'b.md');
    await writeFile(a, 'A');
    await writeFile(b, 'B');

    await initProjectContext(a);
    expect(getProjectContext()).toBe('A');

    await initProjectContext(b);
    expect(getProjectContext()).toBe('B');
  });
});
