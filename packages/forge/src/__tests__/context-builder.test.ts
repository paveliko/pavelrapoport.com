import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildAgentContexts } from '../commands/audit/context-builder.js';
import { getModule } from '../commands/audit/modules.js';
import { escapeNextjsBrackets, filePriority } from '../commands/audit/utils.js';
import type { AgentName } from '../commands/audit/types.js';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..');

// Context-building against real disk is skipped while MODULE_REGISTRY and
// expected file paths (e.g., worker/marketing modules, _helpers.ts) are
// VIVOD-specific. Tracked by spec Requirement 9; re-enabled after
// `refactor-forge-prompt-customization` lands consumer-owned module registry.
// The pure-utility tests at the bottom of this file stay active.
describe.skip('Context Builder (VIVOD-specific, deferred)', () => {
  it('builds context for all agents in worker module', async () => {
    const mod = getModule('worker')!;
    const agentNames = Object.keys(mod.agents) as AgentName[];
    const contexts = await buildAgentContexts(mod, agentNames, REPO_ROOT);

    for (const name of agentNames) {
      const ctx = contexts[name]!;
      const scope = mod.agents[name]!;
      expect(ctx).toBeDefined();
      expect(ctx.promptTemplate.length).toBeGreaterThan(100);
      // Only assert specs > 0 for agents that have spec paths configured
      if (scope.specs.length > 0) {
        expect(ctx.specs.length).toBeGreaterThan(0);
      }
      expect(ctx.files.length).toBeGreaterThan(0);
      expect(ctx.estimatedTokens).toBeGreaterThan(0);
      expect(['opus', 'sonnet']).toContain(ctx.model);
    }
  });

  it('builds context for a single agent', async () => {
    const mod = getModule('worker')!;
    const contexts = await buildAgentContexts(mod, ['security'], REPO_ROOT);

    expect(contexts['security']).toBeDefined();
    expect(contexts['security']!.files).toContain('_helpers.ts');
    expect(contexts['security']!.specs).toContain('SPEC:');
  });

  it('includes spec content that is never empty', async () => {
    const mod = getModule('worker')!;
    const contexts = await buildAgentContexts(mod, ['pm'], REPO_ROOT);

    const specContent = contexts['pm']!.specs;
    expect(specContent).toContain('--- SPEC:');
    expect(specContent).not.toContain('[FILE NOT FOUND]');
  });

  it('files section uses separator format', async () => {
    const mod = getModule('worker')!;
    const contexts = await buildAgentContexts(mod, ['architect'], REPO_ROOT);

    expect(contexts['architect']!.files).toContain('--- FILE:');
  });

  it('builds context for marketing module with empty specs', async () => {
    const mod = getModule('marketing')!;
    const agentNames = Object.keys(mod.agents) as AgentName[];
    const contexts = await buildAgentContexts(mod, agentNames, REPO_ROOT);

    for (const name of agentNames) {
      const ctx = contexts[name]!;
      expect(ctx).toBeDefined();
      expect(ctx.promptTemplate.length).toBeGreaterThan(100);
      expect(ctx.estimatedTokens).toBeGreaterThan(0);
      // Every agent must receive code files (ABC-156)
      expect(ctx.files.length, `agent "${name}" should receive code files`).toBeGreaterThan(0);
      expect(ctx.files).toContain('--- FILE:');
    }
  });
});

describe('Context Builder utilities', () => {
  it('escapeNextjsBrackets escapes [locale] in glob patterns', () => {
    expect(escapeNextjsBrackets('[locale]')).toBe('\\[locale\\]');
    expect(escapeNextjsBrackets('apps/[locale]/(platform)/page.tsx')).toBe(
      'apps/\\[locale\\]/(platform)/page.tsx',
    );
  });

  it('filePriority gives component-api highest priority for composed/primitives', () => {
    expect(filePriority('packages/ui/src/composed/Card.tsx', 'component-api')).toBe(0);
    expect(filePriority('packages/ui/src/primitives/Badge.tsx', 'component-api')).toBe(0);
    expect(filePriority('packages/ui/src/index.ts', 'component-api')).toBe(1);
    expect(filePriority('packages/ui/src/hooks/useTheme.ts', 'component-api')).toBe(2);
  });

  it('filePriority differentiates route priority across agent roles', () => {
    const routeFile = 'apps/web/src/app/worker/tasks/page.tsx';
    // pm (ROUTE_HIGH) → 1
    expect(filePriority(routeFile, 'pm')).toBe(1);
    // architect (ROUTE_MED) → 3
    expect(filePriority(routeFile, 'architect')).toBe(3);
    // security (neither) → 6
    expect(filePriority(routeFile, 'security')).toBe(6);
  });
});
