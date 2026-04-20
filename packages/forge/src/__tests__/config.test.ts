import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ForgeConfigError, loadConfig } from '../config.js';

describe('loadConfig', () => {
  let tmp: string;
  let originalCwd: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    tmp = await realpath(await mkdtemp(resolve(tmpdir(), 'forge-config-test-')));
    await mkdir(resolve(tmp, 'packages/forge'), { recursive: true });
    originalCwd = process.cwd();
    process.chdir(tmp);
    delete process.env.FORGE_PROJECT_CONTEXT_PATH;
    delete process.env.FORGE_ISSUE_PREFIX;
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    await rm(tmp, { recursive: true, force: true });
  });

  describe('precedence', () => {
    it('explicit options win over config file and env', async () => {
      await writeFile(
        resolve(tmp, 'forge.config.json'),
        JSON.stringify({ projectContextPath: '/file.md', issuePrefix: 'FILE' }),
      );
      process.env.FORGE_ISSUE_PREFIX = 'ENV';

      const cfg = await loadConfig({
        projectContextPath: '/explicit.md',
        issuePrefix: 'EXP',
      });

      expect(cfg.issuePrefix).toBe('EXP');
      expect(cfg.projectContextPath).toBe('/explicit.md');
    });

    it('config file wins over env', async () => {
      await writeFile(
        resolve(tmp, 'forge.config.json'),
        JSON.stringify({ projectContextPath: '/file.md', issuePrefix: 'FILE' }),
      );
      process.env.FORGE_ISSUE_PREFIX = 'ENV';
      process.env.FORGE_PROJECT_CONTEXT_PATH = '/env.md';

      const cfg = await loadConfig();

      expect(cfg.issuePrefix).toBe('FILE');
      expect(cfg.projectContextPath).toBe('/file.md');
    });

    it('env is used when no file and no explicit options', async () => {
      process.env.FORGE_PROJECT_CONTEXT_PATH = '/env.md';
      process.env.FORGE_ISSUE_PREFIX = 'ENV';

      const cfg = await loadConfig();

      expect(cfg.issuePrefix).toBe('ENV');
      expect(cfg.projectContextPath).toBe('/env.md');
    });

    it('finds forge.config.json by walking up from a sub-package cwd', async () => {
      await writeFile(
        resolve(tmp, 'forge.config.json'),
        JSON.stringify({ projectContextPath: '/root.md', issuePrefix: 'ROOT' }),
      );
      process.chdir(resolve(tmp, 'packages/forge'));

      const cfg = await loadConfig();

      expect(cfg.issuePrefix).toBe('ROOT');
      expect(cfg.projectContextPath).toBe('/root.md');
    });
  });

  describe('validation', () => {
    it('throws ForgeConfigError listing all missing fields when nothing is provided', async () => {
      await expect(loadConfig()).rejects.toThrow(ForgeConfigError);
      await expect(loadConfig()).rejects.toThrow(/projectContextPath.*issuePrefix/s);
    });

    it('rejects issuePrefix containing a dash', async () => {
      await expect(
        loadConfig({ projectContextPath: '/x.md', issuePrefix: 'VVD-' }),
      ).rejects.toThrow(/must not include a dash/);
    });

    it('rejects issuePrefix starting with a digit', async () => {
      await expect(
        loadConfig({ projectContextPath: '/x.md', issuePrefix: '1AI' }),
      ).rejects.toThrow(/alphanumeric, starting with a letter/);
    });

    it('rejects empty issuePrefix', async () => {
      await expect(
        loadConfig({ projectContextPath: '/x.md', issuePrefix: '' }),
      ).rejects.toThrow(ForgeConfigError);
    });

    it('rejects non-alphanumeric characters', async () => {
      await expect(
        loadConfig({ projectContextPath: '/x.md', issuePrefix: 'AI_X' }),
      ).rejects.toThrow(/alphanumeric/);
    });

    it('normalizes lowercase prefix to uppercase', async () => {
      const cfg = await loadConfig({ projectContextPath: '/x.md', issuePrefix: 'ai' });
      expect(cfg.issuePrefix).toBe('AI');
    });

    it('normalizes mixed-case prefix to uppercase', async () => {
      const cfg = await loadConfig({ projectContextPath: '/x.md', issuePrefix: 'aI' });
      expect(cfg.issuePrefix).toBe('AI');
    });
  });

  describe('projectContextPath resolution', () => {
    it('file-sourced relative path resolves against config dir, not cwd', async () => {
      await writeFile(
        resolve(tmp, 'forge.config.mjs'),
        `export default { projectContextPath: './context.md', issuePrefix: 'AI' };\n`,
      );
      await writeFile(resolve(tmp, 'context.md'), '# ctx\n');
      process.chdir(resolve(tmp, 'packages/forge'));

      const cfg = await loadConfig();

      expect(cfg.projectContextPath).toBe(resolve(tmp, 'context.md'));
      expect(cfg.projectContextPath).not.toBe(
        resolve(tmp, 'packages/forge/context.md'),
      );
    });

    it('file-sourced absolute path passes through unchanged', async () => {
      await writeFile(
        resolve(tmp, 'forge.config.json'),
        JSON.stringify({
          projectContextPath: '/tmp/forge-fixture-ctx.md',
          issuePrefix: 'AI',
        }),
      );
      process.chdir(resolve(tmp, 'packages/forge'));

      const cfg = await loadConfig();

      expect(cfg.projectContextPath).toBe('/tmp/forge-fixture-ctx.md');
    });

    it('env-sourced relative path stays cwd-relative', async () => {
      process.chdir(resolve(tmp, 'packages/forge'));
      process.env.FORGE_PROJECT_CONTEXT_PATH = './from-env.md';
      process.env.FORGE_ISSUE_PREFIX = 'AI';

      const cfg = await loadConfig();

      expect(cfg.projectContextPath).toBe(
        resolve(tmp, 'packages/forge/from-env.md'),
      );
    });

    it('options-sourced relative path stays cwd-relative', async () => {
      const cfg = await loadConfig({
        projectContextPath: './from-opts.md',
        issuePrefix: 'AI',
      });

      expect(cfg.projectContextPath).toBe(resolve(tmp, 'from-opts.md'));
    });
  });
});
