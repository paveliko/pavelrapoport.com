## 1. Loader change

- [x] 1.1 In `packages/forge/src/config.ts`, modify `readConfigFile(path)` so that after the config module is loaded, if the resulting `projectContextPath` is a non-empty relative string, rewrite it to `resolve(dirname(path), rawPath)` before returning. Apply to both the JSON branch and the ESM-import branch.
- [x] 1.2 Verify `validate()` stays unchanged — its existing `isAbsolute` check short-circuits for file-sourced paths now that they arrive pre-absolutized.

## 2. Tests

- [x] 2.1 In `packages/forge/src/__tests__/config.test.ts`, add a test mirroring the existing cwd-manipulation pattern: create a temp dir with `forge.config.mjs` + sibling `context.md`, chdir to a deeper subdirectory of the config root, run `loadConfig()`, assert `projectContextPath` resolves to the config's sibling `context.md` (not the subdirectory's).
- [x] 2.2 Add a test confirming the non-goal: `FORGE_PROJECT_CONTEXT_PATH='./from-env.md'` still resolves against cwd (unless an equivalent test already exists — check first).
- [x] 2.3 Add a test confirming the non-goal: `loadConfig({ projectContextPath: './from-opts.md', issuePrefix: 'AI' })` still resolves against cwd.
- [x] 2.4 Run `pnpm --filter @repo/forge test` and confirm all previous tests still pass (baseline 95 pass + 61 skip) plus the new tests pass.

## 3. Consumer cleanup

- [x] 3.1 Replace `forge.config.mjs` at the repo root with the 7-line form: `{ projectContextPath: './FORGE.md', issuePrefix: 'AI' }`. Drop the `fileURLToPath` / `dirname` / `resolve` imports.

## 4. Docs

- [x] 4.1 In `packages/forge/forge.config.example.mjs`, update the comment at line 25 from `"Absolute path, or relative to process.cwd() at init time."` to `"Absolute path, or relative to this config file's directory."`
- [x] 4.2 Scan `packages/forge/README.md` for any prose that claims relative paths resolve against cwd; update to "relative to the config file's directory". Code example at lines 45-56 already matches the new end-state — leave it unchanged.

## 5. Validation

- [x] 5.1 Run `pnpm --filter @repo/forge typecheck` — green.
- [x] 5.2 Run `pnpm --filter @repo/forge build` — green.
- [x] 5.3 Run `pnpm openspec validate fix-forge-config-path-resolution --strict` — green.
