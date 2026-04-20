import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Runtime config for Forge. Everything project-specific lives here.
 * Everything else in the package is pure engine.
 */
export interface ForgeConfig {
  /**
   * Path to a Markdown file with the consuming project's context.
   * Injected into every LLM prompt so the engine "knows" the monorepo
   * layout, conventions, stack, naming, etc.
   *
   * Absolute path, or relative. Relative paths from a
   * `forge.config.{mjs,js,json}` resolve against that config file's
   * own directory; relative paths from the `FORGE_PROJECT_CONTEXT_PATH`
   * env var or the `loadConfig(options)` argument resolve against
   * `process.cwd()`.
   */
  projectContextPath: string;

  /**
   * Linear issue-key prefix. Examples: "AI", "VVD", "MOD".
   * Do NOT include the trailing dash — it is appended where needed.
   * Normalized to UPPERCASE by the loader.
   */
  issuePrefix: string;
}

const CONFIG_FILE_NAMES = [
  'forge.config.mjs',
  'forge.config.js',
  'forge.config.json',
] as const;

export class ForgeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForgeConfigError';
  }
}

/**
 * Resolve `ForgeConfig` by precedence (higher wins):
 *   1. explicit options passed to this function
 *   2. forge.config.{mjs,js,json} in cwd or any parent directory
 *   3. env vars: FORGE_PROJECT_CONTEXT_PATH, FORGE_ISSUE_PREFIX
 *
 * Throws `ForgeConfigError` if required fields are missing or invalid.
 */
export async function loadConfig(
  options: Partial<ForgeConfig> = {},
): Promise<ForgeConfig> {
  const fromFile = await loadConfigFile();
  const fromEnv = loadEnvConfig();

  const merged: Partial<ForgeConfig> = {
    ...fromEnv,
    ...fromFile,
    ...options,
  };

  return validate(merged);
}

async function loadConfigFile(): Promise<Partial<ForgeConfig>> {
  let dir = process.cwd();
  const root = resolve('/');

  while (true) {
    for (const name of CONFIG_FILE_NAMES) {
      const candidate = resolve(dir, name);
      if (existsSync(candidate)) {
        return await readConfigFile(candidate);
      }
    }
    const parent = dirname(dir);
    if (parent === dir || dir === root) return {};
    dir = parent;
  }
}

async function readConfigFile(path: string): Promise<Partial<ForgeConfig>> {
  let loaded: Partial<ForgeConfig>;
  if (path.endsWith('.json')) {
    const raw = await readFile(path, 'utf-8');
    loaded = JSON.parse(raw) as Partial<ForgeConfig>;
  } else {
    const url = pathToFileURL(path).href;
    const mod = (await import(url)) as {
      default?: Partial<ForgeConfig>;
    } & Partial<ForgeConfig>;
    loaded = mod.default ?? mod;
  }

  const raw = loaded.projectContextPath;
  if (typeof raw === 'string' && raw.length > 0 && !isAbsolute(raw)) {
    return { ...loaded, projectContextPath: resolve(dirname(path), raw) };
  }
  return loaded;
}

function loadEnvConfig(): Partial<ForgeConfig> {
  const out: Partial<ForgeConfig> = {};
  if (process.env.FORGE_PROJECT_CONTEXT_PATH) {
    out.projectContextPath = process.env.FORGE_PROJECT_CONTEXT_PATH;
  }
  if (process.env.FORGE_ISSUE_PREFIX) {
    out.issuePrefix = process.env.FORGE_ISSUE_PREFIX;
  }
  return out;
}

function validate(input: Partial<ForgeConfig>): ForgeConfig {
  const missing: string[] = [];
  if (!input.projectContextPath) missing.push('projectContextPath');
  if (!input.issuePrefix) missing.push('issuePrefix');

  if (missing.length) {
    throw new ForgeConfigError(
      `Forge config is missing required fields: ${missing.join(', ')}.\n` +
        `Provide them via forge.config.{mjs,js,json}, env vars ` +
        `(FORGE_PROJECT_CONTEXT_PATH, FORGE_ISSUE_PREFIX), or the options argument to initForge().`,
    );
  }

  const prefix = input.issuePrefix!;
  if (prefix.includes('-')) {
    throw new ForgeConfigError(
      `Forge config.issuePrefix must not include a dash. Got "${prefix}".`,
    );
  }
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(prefix)) {
    throw new ForgeConfigError(
      `Forge config.issuePrefix must be alphanumeric, starting with a letter. Got "${prefix}".`,
    );
  }

  const rawPath = input.projectContextPath!;
  const absolutePath = isAbsolute(rawPath) ? rawPath : resolve(rawPath);

  return {
    projectContextPath: absolutePath,
    issuePrefix: prefix.toUpperCase(),
  };
}
