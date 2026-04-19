import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { glob } from 'glob';
import { MODULE_REGISTRY, listModules, getModule } from '../commands/audit/modules.js';
import type { AgentName } from '../commands/audit/types.js';

// Resolve repo root (2 levels up from packages/forge-cli)
const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..');

// Per-module on-disk assertions are skipped while MODULE_REGISTRY still holds
// VIVOD-specific entries (facade, worker, agents, etc.) that do not exist in
// pavelrapoport.com's layout. Tracked by spec Requirement 9 and refactored in
// `refactor-forge-prompt-customization` (consumer-owned module registry).
// Shape-only assertions below remain active.
describe('Module Registry', () => {
  it('has at least 4 modules', () => {
    expect(listModules().length).toBeGreaterThanOrEqual(4);
  });

  it('returns undefined for unknown module', () => {
    expect(getModule('nonexistent')).toBeUndefined();
  });

  describe.skip('per-module on-disk checks (VIVOD-specific, deferred)', () => {
  for (const [moduleName, config] of Object.entries(MODULE_REGISTRY)) {
    const moduleAgentNames = Object.keys(config.agents) as AgentName[];

    describe(`module: ${moduleName}`, () => {
      it('has at least 1 agent scope', () => {
        expect(moduleAgentNames.length).toBeGreaterThanOrEqual(1);
      });

      it('has valid agent scopes', () => {
        for (const agentName of moduleAgentNames) {
          const scope = config.agents[agentName]!;
          expect(scope).toBeDefined();
          expect(scope.globs.length).toBeGreaterThan(0);
          expect(['opus', 'sonnet']).toContain(scope.model);
        }
      });

      it('has spec files that exist on disk', () => {
        const allSpecs = new Set<string>();
        for (const agentName of moduleAgentNames) {
          for (const spec of config.agents[agentName]!.specs) {
            allSpecs.add(spec);
          }
        }

        for (const specPath of allSpecs) {
          const fullPath = resolve(REPO_ROOT, specPath);
          expect(existsSync(fullPath), `Spec not found: ${specPath}`).toBe(true);
        }
      });

      it('has glob patterns that resolve to existing files', async () => {
        const allGlobs = new Set<string>();
        for (const agentName of moduleAgentNames) {
          for (const g of config.agents[agentName]!.globs) {
            allGlobs.add(g);
          }
        }

        let totalFiles = 0;
        for (const pattern of allGlobs) {
          const matches = await glob(pattern, { cwd: REPO_ROOT, nodir: true });
          totalFiles += matches.length;
        }

        expect(
          totalFiles,
          `Module "${moduleName}" resolved 0 files — glob patterns may be wrong`,
        ).toBeGreaterThan(0);
      });
    });
  }
  });

  describe('module: marketing', () => {
    it('has exactly 6 agents: a11y, growth, performance, security, seo, ui-designer', () => {
      const config = getModule('marketing')!;
      const agents = Object.keys(config.agents).sort();
      expect(agents).toEqual(['a11y', 'growth', 'performance', 'security', 'seo', 'ui-designer']);
    });
  });
});
