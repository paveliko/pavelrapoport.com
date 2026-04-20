/**
 * Example forge.config.mjs — copy to the consuming monorepo root as
 * `forge.config.mjs` and customize. The forge loader walks up from
 * process.cwd() until it finds this file.
 *
 * `.ts` is intentionally not supported: Node's native ESM loader cannot
 * execute `.ts` without an external loader (tsx / ts-node). Types are
 * still available via the JSDoc `@type` import below — no TS toolchain
 * required.
 */

/** @type {import('@repo/forge').ForgeConfig} */
const config = {
  /**
   * Markdown file describing the consuming monorepo. Injected into every
   * LLM prompt so the engine "knows" the target project.
   *
   * Typical contents:
   *   - structure of apps/ and packages/
   *   - tech stack (framework, runtime, styling, infra)
   *   - naming conventions (locales, route groups, branded ID prefixes)
   *   - architectural invariants (secrets provider, edge runtime, etc.)
   *
   * Absolute path, or relative to this config file's directory.
   */
  projectContextPath: './FORGE.md',

  /**
   * Linear issue-key prefix, taken from the Linear team identifier.
   * Must be alphanumeric, start with a letter, and contain no dash.
   * The parser regex is built as `/\b${issuePrefix}-\d+\b/i`.
   *
   * Examples: 'AI' (AI Development Studio), 'VVD' (VIVOD), 'MOD' (...).
   */
  issuePrefix: 'AI',
};

export default config;
