## Context

Phase 0 scaffold at `packages/forge/` is already in place with the frozen public contract: `Forge` class, `initForge()` (async), `loadConfig()`, `getProjectContext()` (sync), `LinearClient` stub, `ForgeConfig`, `ForgeConfigError`. This change populates the body around that contract by porting VIVOD's `packages/forge-cli/src/` tree. Reconciliation burden concentrates in three places: project-context (VIVOD inline const → scaffold file-backed + lazy cache), Linear client shape (VIVOD functional module → scaffold class with `this.config.issuePrefix`), and the `VVD-` hardcode (literal → composition via `parseIssueKey` / `formatIssueKey`).

Source of truth for the port: `/Users/pavelrapoport/Documents/GitHub/vivod/packages/forge-cli/src/`. The consumer (pavelrapoport.com) will provide `forge.config.mjs` + `FORGE.md` at the monorepo root.

## Goals / Non-Goals

**Goals:**
- Behavior parity with VIVOD forge-cli for all four commands (`audit`, `spec`, `review`, `estimate`) post-port.
- Zero `vivod`, `@vivod`, or `VVD-` identifiers anywhere under `packages/forge/src/` after port.
- `pnpm forge audit AI-47` runs end-to-end against a real Linear issue in pavelrapoport.com.
- Phase 0 public surface remains unchanged — port extends the barrel, never contracts it.

**Non-Goals:**
- Refactoring `core/persist.ts` to a dependency-injected persistence adapter. Tracked separately as `refactor-forge-persist`; blocks second consumer.
- Migrating VIVOD onto the shared package.
- Adding a `plan` CLI command. Plan prompts ship as `worker-prompts.ts` builders only.
- Renaming ported files to match the Linear issue text (`anthropic.ts` stays).
- Introducing a test runner that the scaffold doesn't already have; port VIVOD's vitest setup as-is.

## Decisions

**1. Config resolution precedence: explicit > file > env.**
Spread order in `loadConfig` is `{...env, ...file, ...options}`. Rationale: explicit options come from consumer code that already committed to a value; env vars are deploy-environment overrides; file is the repo default. Alternative considered (env > file > explicit) was rejected — it would let a stray shell export silently override what the code does.

**2. `initForge` is async; `getProjectContext` is sync.**
The one-time async init reads `FORGE.md` once and caches it; every downstream prompt builder calls the sync getter. Rationale: prompt-building runs in tight loops and inside worker code paths where making every builder async would force `await` propagation through the entire command tree. Getter throws if called pre-init — the enforced contract. Alternative (sync init with `readFileSync`) was rejected because it blocks the event loop at import time and breaks Cloudflare Workers.

**3. `LinearClient` becomes a class, absorbing VIVOD's functional helpers.**
VIVOD exposes `fetchLinearIssue(apiKey, key)` / `createLinearComment(apiKey, issueId, body)` as free functions with `VVD-` hardcoded in docstrings. The Phase 0 scaffold already committed to a class that holds config so `this.config.issuePrefix` is available. Port migrates the two functions to methods on that class. No functional fallback export — consumers go through `Forge` or construct `LinearClient` directly.

**4. `VVD-` is removed by composition, not string replace.**
Every current usage is either a compose (`VVD-${n}` → `formatIssueKey(n)`) or a match (regex → `parseIssueKey(text)`). These helpers already exist in the scaffold stub and close over `config.issuePrefix`. Alternative (regex global-replace `VVD-` → `${prefix}-`) was rejected — it would reintroduce the same hardcode, just spelled differently.

**5. `PROJECT_CONTEXT` resolved at prompt-build time, not at module load.**
Forge is expected to run inside Cloudflare Workers. File I/O at module top-level breaks worker deploys. Every current `PROJECT_CONTEXT` template-literal use gets pushed into its surrounding function body as `const ctx = getProjectContext()`. Alternative (keep a top-level const, hydrate from `initForge`) was rejected — it would require a side-effecting import order that is fragile to refactor.

**6. `persist.ts` Supabase leak accepted, documented, deferred.**
Porting verbatim keeps behavior parity and the change shippable. The direct coupling is spelled out as spec Requirement 6. DI refactor is tracked as `refactor-forge-persist` and must land before a second consumer (VIVOD switching onto this package) adopts forge. Alternative (do the DI refactor in this change) was rejected as out-of-scope per the Linear issue and would multiply change size.

**7. VIVOD workspace deps do not come along.**
`@vivod/db` and `@vivod/domain` provide narrow types (Supabase client factory, branded IDs). These get inlined under `packages/forge/src/types/` as minimal local shapes. Runtime deps that ARE generic — `@supabase/supabase-js`, `chalk`, `glob` — get added to `packages/forge/package.json` normally.

**8. Barrel extends, never contracts.**
Phase 0 exports (`initForge`, `Forge`, `loadConfig`, `ForgeConfig`, `ForgeConfigError`, `getProjectContext`) remain exactly as-is. Port adds `LinearClient`, `parseIssueKey`, `formatIssueKey`, plus worker-prompt helpers. No Phase 0 export is renamed or removed.

## Risks / Trade-offs

- **[Hidden `VVD-` survives the grep]** → Mitigation: grep sanity is a hard gate (task 3.4) on `vivod`, `@vivod`, and `VVD-`. Test fixture strings and help-text examples are the usual hiding places and are called out explicitly in the port hit list.
- **[File-system access at worker runtime]** → Mitigation: `initProjectContext` is the only fs touch point; it's called once from CLI entry or worker warmup. Prompt builders are pure. Spec Requirement 7 enforces no fs at module load.
- **[Supabase write leak in `persist.ts`]** → Accepted. Spec Requirement 6 documents the deviation and names the tracker (`refactor-forge-persist`). Blocks second consumer, not this change.
- **[VIVOD and forge drift during port]** → Mitigation: port against a recorded VIVOD commit SHA (task 1.3); freeze `packages/forge-cli/` in VIVOD during the port window (no parallel edits).
- **[Prompt template files (`*.md`) still carry `VVD-` examples]** → Mitigation: tokenize as `{{ISSUE_PREFIX}}` and interpolate at prompt-build time, same mechanism as `{{PROJECT_CONTEXT}}`.

## Migration Plan

No runtime migration — this is a code port inside a single monorepo. Rollback path: revert the feature branch. The only persisted state touched is via the un-refactored `persist.ts`; Supabase schema is unchanged.

## Open Questions

- Does `@opennextjs/cloudflare` impose additional constraints on the ported `chalk` / `glob` deps when forge is eventually invoked inside a worker? Deferred until the first worker-bound consumer actually runs forge at runtime — for now forge is CLI-only.
