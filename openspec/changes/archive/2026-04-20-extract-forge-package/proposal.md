## Why

The studio owns a working autonomous CLI pipeline — `audit` / `spec` / `review` / `estimate` — that contains zero VIVOD business logic. It is a generic Linear + Anthropic orchestrator glued to a hardcoded `VVD-` prefix and an inline `PROJECT_CONTEXT` string. pavelrapoport.com needs the same pipeline (to run against `AI-*` issues like AI-47 itself), and every future studio monorepo will need it too. Forking per project is unsustainable. Extract the engine into a reusable `@repo/forge` package, consumed from VIVOD via workspace link once the DI persistence refactor lands. Business goal: operational efficiency — one engine, N consumers, zero per-project forks.

## What Changes

- Port VIVOD `packages/forge-cli/src/` tree into the pre-scaffolded `packages/forge/src/` (Phase 0 public contract is frozen and not re-negotiated).
- Replace every `PROJECT_CONTEXT` template-literal usage with a `getProjectContext()` call inside the builder function body (worker-safe, no fs at module load).
- Replace every `VVD-` literal with composition via `config.issuePrefix` + `parseIssueKey` / `formatIssueKey`.
- Strip VIVOD workspace deps (`@vivod/db`, `@vivod/domain`); inline narrow local types.
- Rename package `@rapoport-studio/forge` → `@repo/forge` in `packages/forge/package.json`, `packages/forge/README.md`, and `forge.config.example.mjs`.
- Add consumer wiring on pavelrapoport.com: `forge.config.mjs` + `FORGE.md` at monorepo root; `pnpm forge` script.

## Capabilities

### New Capabilities
- `forge`: project-agnostic autonomous CLI pipeline (audit / spec / review / estimate) bound at init time to a project-context markdown path and a Linear issue-key prefix. Consumers inject configuration via `forge.config.{mjs,js,json}` or env vars; engine contains no consumer-specific logic.

### Modified Capabilities

None — this change introduces a new domain only.

## Impact

- `packages/forge/src/**` — populated from VIVOD source (`commands/`, `core/`, `cli.ts`, `__tests__/`, `worker-prompts.ts`).
- `packages/forge/package.json` — add runtime deps `@supabase/supabase-js`, `chalk`, `glob`; strip any `@vivod/*`; rename to `@repo/forge`.
- `packages/openspec/config.yaml` — add `forge` to the domains list.
- `packages/openspec/specs/forge/spec.md` — new domain spec (stub in this change; filled by archive).
- `forge.config.mjs` at monorepo root — binds forge to `issuePrefix: 'AI'` and `projectContextPath: './FORGE.md'`.
- `FORGE.md` at monorepo root — project-context markdown describing apps, packages, stack (Next.js 15, React 19, Tailwind 4, CF Workers via `@opennextjs/cloudflare`), locales `en|ru|ro`, Infisical secrets rule, and Linear `AI-` prefix.
- Root `package.json` — add `forge` script.
- No DB migrations. No UI changes.
- **Known deviation (documented, deferred):** `core/persist.ts` writes directly to Supabase tables `forge_audits` / `forge_specs` / `forge_estimates` / `forge_events`. This direct coupling is tracked in spec Requirement 6 and will be replaced by a DI adapter in a future change `refactor-forge-persist` — that refactor blocks the second consumer (VIVOD switching onto the shared package), not this one.

## Non-Goals

- Refactoring `persist.ts` to a DI adapter.
- Migrating VIVOD onto the shared package.
- Adding a `plan` CLI command (plan lives in a separate worker; forge only supplies prompt builders via `worker-prompts.ts`).
- Renaming ported files to match the Linear issue text (e.g., `anthropic.ts` stays `anthropic.ts`, not `anthropic-client.ts`).
- Rewriting prompt corpus and `MODULE_REGISTRY` to remove VIVOD-specific architectural rules (tracked as `refactor-forge-prompt-customization`; blocks second consumer alongside `refactor-forge-persist`).
