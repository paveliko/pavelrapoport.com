## Why

`loadConfig()` currently resolves a relative `projectContextPath` from a config file against `process.cwd()`, not against the config file's own directory. When cwd diverges from the config location — under `pnpm --filter @repo/forge exec …`, CI runners launched from a subdir, editor-integrated shells — the path breaks silently. Every consumer today has to hand-roll `fileURLToPath(import.meta.url)` + `dirname` + `resolve(__dirname, …)` boilerplate just to produce an absolute path. Aligning with the standard config-file UX (Vite, Next.js, Jest, ESLint) removes that boilerplate permanently and unblocks the documented one-liner consumer config shown in [packages/forge/README.md](../../../packages/forge/README.md) and [packages/forge/forge.config.example.mjs](../../../packages/forge/forge.config.example.mjs).

## What Changes

- `loadConfig()` / `readConfigFile()` resolve a **relative** `projectContextPath` read from a config file against the config file's own directory (not `process.cwd()`).
- **Absolute** `projectContextPath` values remain untouched.
- **Env-sourced** relative paths (`FORGE_PROJECT_CONTEXT_PATH`) remain `process.cwd()`-relative — caller owns that cwd context.
- **Options-sourced** relative paths (`loadConfig({ projectContextPath })` argument) remain `process.cwd()`-relative — caller owns that cwd context.
- Consumer `forge.config.mjs` at monorepo root simplifies to `{ projectContextPath: './FORGE.md', issuePrefix: 'AI' }` — `__dirname` workaround deleted.
- Example template and README example comment updated to reflect new resolution semantics.

Not a breaking change for any consumer that currently uses an absolute path. Consumers using the `__dirname` workaround continue to work (absolute path passes through untouched).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `forge`: add a new Requirement under the forge spec — "Relative config-file paths resolve against config file directory" — alongside the existing "Config resolution precedence", "Config file discovery walks up the filesystem tree", and "Config validation rules" requirements.

## Impact

- **Code:** [packages/forge/src/config.ts](../../../packages/forge/src/config.ts) — `readConfigFile()` gains path normalization. `validate()` is unchanged; its existing `isAbsolute` check short-circuits for file-sourced paths.
- **Tests:** [packages/forge/src/__tests__/config.test.ts](../../../packages/forge/src/__tests__/config.test.ts) — add a new test mirroring the existing cwd-manipulation fixture pattern.
- **Docs:** [packages/forge/README.md](../../../packages/forge/README.md), [packages/forge/forge.config.example.mjs](../../../packages/forge/forge.config.example.mjs) — comment updates. README code example already matches the new end-state.
- **Consumer:** [forge.config.mjs](../../../forge.config.mjs) at repo root — simplified from 12 lines to 7.
- **No dependency changes.** `isAbsolute` / `dirname` / `resolve` already imported in [config.ts:3](../../../packages/forge/src/config.ts:3).
- **No runtime impact on absolute-path consumers.** No CI / build / publish impact.
