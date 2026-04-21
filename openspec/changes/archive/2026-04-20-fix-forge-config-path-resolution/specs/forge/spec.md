## ADDED Requirements

### Requirement: Relative config-file paths resolve against config file directory

When `loadConfig()` reads a `forge.config.{mjs,js,json}` and the loaded `projectContextPath` is a non-empty **relative** string, the loader SHALL rewrite it to an absolute path resolved against the directory containing the config file (not `process.cwd()`). Absolute `projectContextPath` values SHALL pass through unchanged. This normalization SHALL NOT apply to `projectContextPath` values sourced from the `FORGE_PROJECT_CONTEXT_PATH` environment variable or from the `loadConfig(options)` argument — those retain their existing `process.cwd()`-relative resolution semantics.

#### Scenario: Relative config-file path resolves against config dir, not cwd
- **GIVEN** a config file at `<root>/forge.config.mjs` with `projectContextPath: './FORGE.md'`
- **AND** a file `<root>/FORGE.md` exists
- **AND** `process.cwd()` is `<root>/packages/forge` (a descendant; the relative `./FORGE.md` would point to `<root>/packages/forge/FORGE.md` under the old semantic but SHALL resolve to `<root>/FORGE.md` under this rule)
- **WHEN** `loadConfig()` runs
- **THEN** the resolved `projectContextPath` SHALL equal `<root>/FORGE.md`
- **AND** the resolved path SHALL NOT equal `<root>/packages/forge/FORGE.md`

#### Scenario: Absolute config-file path is preserved verbatim
- **GIVEN** a config file at `<root>/forge.config.mjs` with `projectContextPath: '/tmp/fixtures/ctx.md'`
- **WHEN** `loadConfig()` runs
- **THEN** the resolved `projectContextPath` SHALL equal `/tmp/fixtures/ctx.md`
- **AND** the resolution SHALL NOT depend on the config file's directory or `process.cwd()`

#### Scenario: Env-sourced relative path retains cwd-relative semantics
- **GIVEN** no `forge.config.*` file exists in the cwd or any ancestor
- **AND** env var `FORGE_PROJECT_CONTEXT_PATH='./from-env.md'` is set
- **AND** `process.cwd()` is `<some-dir>`
- **WHEN** `loadConfig()` runs
- **THEN** the resolved `projectContextPath` SHALL equal `<some-dir>/from-env.md`

#### Scenario: Options-sourced relative path retains cwd-relative semantics
- **GIVEN** no `forge.config.*` file exists and no relevant env var is set
- **AND** `process.cwd()` is `<some-dir>`
- **WHEN** `loadConfig({ projectContextPath: './from-opts.md', issuePrefix: 'AI' })` runs
- **THEN** the resolved `projectContextPath` SHALL equal `<some-dir>/from-opts.md`
