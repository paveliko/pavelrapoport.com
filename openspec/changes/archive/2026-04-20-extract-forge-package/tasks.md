## 1. Spec bootstrap

- [x] 1.1 Add `forge` to the domains list in `packages/openspec/config.yaml` with a one-line description.
- [x] 1.2 Create `packages/openspec/specs/forge/spec.md` stub with the Purpose / Requirements / Entities / Dependencies headers; body filled by `/opsx:archive`.
- [x] 1.3 Record the exact VIVOD `packages/forge-cli/` source SHA in the planned commit-message body so the port is reproducible. [VIVOD HEAD: `3f678eb88a7fc3ae97bfeae082f0b807e96a4734`; last forge-cli commit: `0607570 fix(forge-cli): fix chars-per-token ratio to prevent context overflow`]

## 2. Port source tree into scaffold

- [x] 2.1 Copy `commands/`, `core/`, `cli.ts`, and `__tests__/` from VIVOD `packages/forge-cli/src/` into `packages/forge/src/`.
- [x] 2.2 Overwrite the scaffold's `src/worker-prompts.ts` with the VIVOD version.
- [x] 2.3 Keep the scaffold's `src/core/linear-client.ts` class shape; migrate VIVOD's `fetchLinearIssue` and `createLinearComment` functions into methods on that class.
- [x] 2.4 Do NOT modify `src/index.ts`, `src/config.ts`, or `src/core/project-context.ts` — these are the Phase 0 contract.

## 3. Remove VIVOD-specific hardcodes

- [x] 3.1 Delete `export const PROJECT_CONTEXT = ...` and replace every template-literal reference with a `getProjectContext()` call inside the surrounding function body.
- [x] 3.2 Replace every `VVD-` literal via `formatIssueKey(n)` (compose) or `parseIssueKey(text)` (match). Hit list: `cli.ts` help text, `core/linear-client.ts` comments, `commands/estimate/types.ts:4`, `commands/estimate/prompts/estimator.md` lines 38/55, `__tests__/linear-integration.test.ts` lines 97/118/139/216/236, `__tests__/context-builder.test.ts:66`.
- [x] 3.3 Remove `@vivod/db` and `@vivod/domain` from `packages/forge/package.json` and inline the narrowest needed types under `packages/forge/src/types/`. [scaffold package.json had no @vivod deps; no inline types needed for the ported code]
- [x] 3.4 Hard gate (code-level only) — `grep -rn "VVD-" packages/forge/src/` MUST return empty before proceeding. Prompt-content VIVOD references (audit-agent prompts, spec-checker, reviewer, `fix.ts`, `MODULE_REGISTRY`) are tracked separately as `refactor-forge-prompt-customization` and blocked on the second consumer (see spec Requirement 9).

## 4. Barrels, runtime deps, and namespace rename

- [x] 4.1 Rename the package from `@rapoport-studio/forge` to `@repo/forge` in `packages/forge/package.json`, `packages/forge/README.md`, and `forge.config.example.mjs` (both the import and the doc comment).
- [x] 4.2 Extend `src/index.ts` and `src/core/index.ts` to export `LinearClient`, `parseIssueKey`, `formatIssueKey`, and the ported worker-prompt helpers; do not rename or remove any Phase 0 export. [parseIssueKey/formatIssueKey are LinearClient methods, exposed via LinearClient export; worker-prompts exposed via `./worker-prompts` subpath from package.json exports map]
- [x] 4.3 Add runtime deps `@supabase/supabase-js`, `chalk`, and `glob` to `packages/forge/package.json`. Also added `vitest` devDep and `test` script.
- [x] 4.4 Run `pnpm install` from the monorepo root and confirm the lockfile updates without churn.

## 5. CLI entry verification

- [x] 5.1 Confirm `cli.ts` awaits `initForge()` before dispatching any command (otherwise first prompt build crashes). [added `const forge: Forge = await initForge()` before dispatch block; `forge.issuePrefix` now threaded into `EstimateOptions`]
- [x] 5.2 Confirm no command body reads `process.env.FORGE_*` directly; all configuration flows through the `Forge` handle. [only `FORGE_*` reads are `FORGE_PROJECT_CONTEXT_PATH`/`FORGE_ISSUE_PREFIX` inside `config.ts` (that's the handle's init path), and `FORGE_ORGANIZATION_ID` inside `core/persist.ts` + `commands/estimate/persist-estimate.ts` — part of the documented persist leak (spec Requirement 6)]
- [x] 5.3 Confirm secret env vars (`ANTHROPIC_API_KEY`, `LINEAR_API_KEY`, `LINEAR_TEAM_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FORGE_ORGANIZATION_ID`) are read at their usage sites, not cached on the `Forge` instance.

## 6. Tests

- [x] 6.1 `config.test.ts` — precedence: explicit options win over file; file wins over env.
- [x] 6.2 `config.test.ts` — validation rejects prefix with dash, non-alpha leading char, empty string; normalizes lowercase to uppercase; throws `ForgeConfigError` listing all missing fields when nothing is provided.
- [x] 6.3 `project-context.test.ts` — `getProjectContext()` throws before `initProjectContext` is called.
- [x] 6.4 `project-context.test.ts` — re-initialization swaps the cached context.
- [x] 6.5 `linear-client.test.ts` — matrix `{AI, VVD, MOD} × {match, no-match, lowercase}` for `parseIssueKey`.
- [x] 6.6 `linear-client.test.ts` — `formatIssueKey(n)` returns canonical uppercase `${prefix}-${n}`.
- [x] 6.7 Integration (`init-forge.test.ts`) — `initForge({...})` round-trip: `forge.projectContext === <FORGE.md contents>`.
- [x] 6.8 Ported `linear-integration.test.ts` fixtures use a neutral prefix `ABC-` (regression guard against re-hardcoding VVD). Note: 61 test cases in `modules.test.ts` (per-module on-disk checks) and `context-builder.test.ts` (VIVOD module context building) are `describe.skip`'d — deferred to `refactor-forge-prompt-customization` per spec Requirement 9.

## 7. Consumer wiring (pavelrapoport.com as first consumer)

- [x] 7.1 Create `forge.config.mjs` at the monorepo root with `{ issuePrefix: 'AI', projectContextPath: './FORGE.md' }`, typed via JSDoc `@type {import('@repo/forge').ForgeConfig}` (no TS; Node ESM loader cannot run `.ts` directly).
- [x] 7.2 Create `FORGE.md` at the monorepo root; seed from `packages/openspec/config.yaml` context block and `conventions.md`. Cover apps (`apps/web`, `apps/studio`), packages, stack (Next.js 15, React 19, Tailwind 4, Cloudflare Workers via `@opennextjs/cloudflare`), locales `en|ru|ro`, Infisical secrets rule, `getCloudflareContext()` vs `process.env`, Linear `AI-` prefix, and Supabase project `mtavnbjdgldttqdpwouo`.
- [x] 7.3 Add a `forge` script to the root `package.json` that delegates to `pnpm --filter @repo/forge exec forge`.

## 8. Monorepo validation

- [x] 8.1 `pnpm typecheck` MUST pass across the whole monorepo. [8/8 packages green via `pnpm turbo typecheck --filter='*'`]
- [x] 8.2 `pnpm build` MUST pass across the whole monorepo. [3/3 packages with build scripts green: @repo/forge, @repo/web, @repo/studio]
- [x] 8.3 `pnpm --filter @repo/forge test` MUST pass with all 8 cases from section 6 green. [12 test files passed; 95 tests green, 61 skipped per spec Requirement 9 (prompt/registry deferral)]
- [ ] 8.4 Smoke test — run `pnpm forge audit AI-47` against the real Linear issue and capture the output in the PR description. **Deferred to user (paid Anthropic API call); run manually before archive.**
