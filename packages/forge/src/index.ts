import { loadConfig, type ForgeConfig } from './config.js';
import { getProjectContext, initProjectContext } from './core/project-context.js';

export type { ForgeConfig } from './config.js';
export { ForgeConfigError, loadConfig } from './config.js';
export { getProjectContext } from './core/project-context.js';
export { LinearClient, type LinearClientConfig, type LinearIssue } from './core/linear-client.js';

/**
 * Initialize Forge:
 *   1. resolve config (explicit → file → env)
 *   2. load project-context markdown into memory
 *   3. return a `Forge` handle
 *
 * Call once at process / worker startup. Safe to call again
 * (swaps the cached context).
 */
export async function initForge(
  options?: Partial<ForgeConfig>,
): Promise<Forge> {
  const config = await loadConfig(options);
  await initProjectContext(config.projectContextPath);
  return new Forge(config);
}

/**
 * Handle returned by `initForge()`. Thin facade over the cached
 * project context + config. Once commands are ported, they'll be
 * exposed here as methods (audit / spec / review / estimate / plan).
 */
export class Forge {
  constructor(public readonly config: ForgeConfig) {}

  /** Loaded project-context markdown string. */
  get projectContext(): string {
    return getProjectContext();
  }

  /** Normalized, uppercase issue prefix (e.g. "AI"). */
  get issuePrefix(): string {
    return this.config.issuePrefix;
  }

  // TODO: после порта команд
  //   async audit(opts: AuditOptions): Promise<AuditResult>
  //   async spec(opts: SpecOptions): Promise<SpecResult>
  //   async review(opts: ReviewOptions): Promise<ReviewResult>
  //   async estimate(opts: EstimateOptions): Promise<EstimateResult>
  //   async plan(opts: PlanOptions): Promise<PlanResult>
}
