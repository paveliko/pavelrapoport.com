## Context

[packages/forge/src/config.ts](../../../packages/forge/src/config.ts) currently has a three-stage pipeline:

1. `loadConfigFile()` walks up from `process.cwd()` looking for `forge.config.{mjs,js,json}` and returns the first match as an absolute path (line 70: `resolve(dir, name)`).
2. `readConfigFile(path)` dynamically imports or JSON-parses the file and returns the raw config object verbatim (lines 81–93).
3. `loadConfig()` merges env → file → options (spread precedence), then `validate()` absolutizes `projectContextPath` against `process.cwd()` if the value is relative (lines 131–137).

The config-file path is known only inside `loadConfigFile()` / `readConfigFile()`. By the time we reach `validate()`, we've lost the provenance of each field — we no longer know whether `projectContextPath` came from the file, env, or options. So `validate()` can only make a uniform decision ("absolutize against cwd").

The existing `__dirname` workaround in [forge.config.mjs](../../../forge.config.mjs) produces an absolute path at config-module-evaluation time, sidestepping the loader entirely. It works, but it's 4 lines of boilerplate that every consumer must repeat, and it fails to explain itself — new contributors see it, copy-paste it, and never understand *why*.

## Goals / Non-Goals

**Goals:**

- Relative `projectContextPath` in a config file resolves against the config file's own directory.
- Zero-boilerplate consumer config: `{ projectContextPath: './FORGE.md', issuePrefix: 'AI' }` works from any cwd.
- Keep path-normalization logic co-located with the code that knows the config path (don't smear context across `validate()`).
- Preserve existing behavior for absolute paths, env-sourced paths, and options-sourced paths.

**Non-Goals:**

- Changing how env vars resolve (`FORGE_PROJECT_CONTEXT_PATH=./x.md` stays cwd-relative — the process that sets the env var knows its own cwd).
- Changing how `loadConfig({ projectContextPath: './x.md' })` options resolve (stays cwd-relative — in-process callers know their cwd).
- Adding support for `.ts` config files (explicitly out of scope per existing [Config file discovery requirement](../extract-forge-package/specs/forge/spec.md:118)).
- Tracking provenance of every config field through the merge pipeline (overkill for one field).

## Decisions

### Decision 1: Normalize inside `readConfigFile()`, not `loadConfigFile()` or `validate()`

`readConfigFile(path)` already receives the absolute config path as its sole argument. Adding the normalization step there is a ~4-line change that keeps the contract narrow: "given a config file path, return a config object with file-relative paths resolved."

**Alternatives considered:**

- **Normalize in `loadConfigFile()`**: would require wrapping the `readConfigFile()` result with path context. Slightly more indirection with no readability gain.
- **Carry provenance through the merge and normalize in `validate()`**: requires a new `{ value, sourcePath }` wrapper type for every config field. Massive over-engineering for one field.
- **Do nothing, document the workaround better**: the `__dirname` dance is unidiomatic across the JS config-file ecosystem. Every other config-driven tool (Vite, Next.js, Jest, ESLint, tsconfig, Prettier, PostCSS, Babel) resolves file paths relative to the config file. Matching that convention is the right default.

### Decision 2: Keep `validate()` unchanged

`validate()` will still run `isAbsolute(rawPath) ? rawPath : resolve(rawPath)` ([config.ts:132](../../../packages/forge/src/config.ts:132)). For file-sourced paths this is now a no-op (path arrives pre-absolutized). For env-sourced and options-sourced paths it preserves cwd-relative behavior. No branching, no provenance tracking, no new code paths.

### Decision 3: Apply to both JSON and JS/MJS branches

`readConfigFile()` has two branches: `JSON.parse` for `.json`, dynamic `import` for `.mjs`/`.js`. Normalize on the returned object after both branches converge (single place, no duplication).

### Decision 4: Only rewrite non-empty relative strings

Guard: `typeof projectContextPath === 'string' && projectContextPath.length > 0 && !isAbsolute(projectContextPath)`. Leaves `undefined`, `null`, empty string, and already-absolute paths alone — `validate()` still catches missing/malformed values downstream.

## Risks / Trade-offs

- **[Risk]** Existing consumers who happened to rely on the cwd-relative behavior (unlikely but possible — anyone setting `projectContextPath: './relative/path'` and running from a specific cwd on purpose) will see their path resolve differently. → **Mitigation:** proposal explicitly notes the behavior change; the consumer must adopt this new semantic or switch to an absolute path. The only known in-repo consumer already uses an absolute path (via `__dirname`), so this is a theoretical risk with no known concrete impact.
- **[Risk]** The normalization runs at every `loadConfig()` call, adding one `isAbsolute` + one `resolve` per call. → **Mitigation:** negligible; `loadConfig()` is called at most once per process in all current call sites.
- **[Trade-off]** We intentionally do not normalize env-sourced or options-sourced paths. A future edit that wants uniform normalization will touch `validate()` directly. Acceptable because env and options are caller-scoped inputs with well-defined cwd semantics, whereas the config *file* location is the one thing the caller cannot predict.

## Migration Plan

No migration required. Consumers on absolute paths (or the `__dirname` workaround) are unaffected. Consumers on relative paths in config files gain the new semantic on first `pnpm install` of the new forge version.

Rollback: revert the commit. No data, no persisted state, no external contracts.

## Open Questions

None. The behavior change is scoped, the test fixture pattern already exists ([config.test.ts:11-24](../../../packages/forge/src/__tests__/config.test.ts:11)), and the consumer-side cleanup is mechanical.
