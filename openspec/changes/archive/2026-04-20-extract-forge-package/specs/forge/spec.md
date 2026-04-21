## ADDED Requirements

### Requirement: Config resolution precedence

Forge SHALL resolve configuration in the order: explicit `initForge()` options > `forge.config.{mjs,js,json}` walked up from `process.cwd()` > environment variables `FORGE_PROJECT_CONTEXT_PATH` and `FORGE_ISSUE_PREFIX`. If no layer supplies a required field, Forge SHALL throw `ForgeConfigError`.

#### Scenario: Explicit options win over config file
- **GIVEN** a `forge.config.mjs` exists with `issuePrefix: 'VVD'`
- **WHEN** the consumer calls `initForge({ issuePrefix: 'AI', projectContextPath: './FORGE.md' })`
- **THEN** `forge.config.issuePrefix` SHALL equal `'AI'`

#### Scenario: File wins over environment
- **GIVEN** env var `FORGE_ISSUE_PREFIX=VVD`
- **AND** a `forge.config.mjs` with `issuePrefix: 'AI'`
- **WHEN** the consumer calls `initForge()` with no options
- **THEN** `forge.config.issuePrefix` SHALL equal `'AI'`

### Requirement: Config validation rules

Forge SHALL reject an `issuePrefix` that contains a dash, starts with a non-letter, or contains non-alphanumeric characters. It SHALL normalize the accepted value to uppercase. The validating regex is `/^[A-Za-z][A-Za-z0-9]*$/`.

#### Scenario: Dash in prefix is rejected
- **WHEN** `loadConfig({ issuePrefix: 'VVD-', projectContextPath: '/tmp/x.md' })` is called
- **THEN** the call SHALL throw `ForgeConfigError`
- **AND** the error message SHALL reference the prefix validation rule

#### Scenario: Lowercase prefix normalizes to uppercase
- **WHEN** `loadConfig({ issuePrefix: 'ai', projectContextPath: '/tmp/x.md' })` is called
- **THEN** the resolved config SHALL report `issuePrefix === 'AI'`

### Requirement: Project-context lifecycle

Forge SHALL require `initProjectContext(path)` to complete before any call to `getProjectContext()`. `initForge()` SHALL perform this initialization. A subsequent `initProjectContext(newPath)` SHALL swap the cached context atomically.

#### Scenario: Access before init throws
- **GIVEN** neither `initForge` nor `initProjectContext` has been called in this process
- **WHEN** a caller invokes `getProjectContext()`
- **THEN** the call SHALL throw an error indicating the context is uninitialized

#### Scenario: Re-initialization swaps cached context
- **GIVEN** `initProjectContext('/a.md')` has completed with contents `"A"`
- **WHEN** `initProjectContext('/b.md')` completes with contents `"B"`
- **THEN** the next `getProjectContext()` call SHALL return `"B"`

### Requirement: Linear issue key format

Issue keys SHALL be composed as `${issuePrefix}-${number}`. `LinearClient.parseIssueKey(text)` SHALL match case-insensitively but only for the configured prefix; other prefixes SHALL return `null`. `LinearClient.formatIssueKey(n)` SHALL return the canonical uppercase form.

#### Scenario: Parse matches configured prefix only
- **GIVEN** `forge.config.issuePrefix === 'AI'`
- **WHEN** `client.parseIssueKey('Working on ai-47 right now')` runs
- **THEN** it SHALL return the string `'AI-47'`
- **AND** `client.parseIssueKey('VVD-47')` SHALL return `null`

#### Scenario: Format produces canonical form
- **GIVEN** `forge.config.issuePrefix === 'AI'`
- **WHEN** `client.formatIssueKey(47)` runs
- **THEN** it SHALL return the string `'AI-47'`

### Requirement: Commands exposed

The Forge CLI SHALL expose exactly four commands: `audit`, `spec`, `review`, `estimate`. Each SHALL accept at minimum a Linear issue key argument. A `plan` command SHALL NOT be exposed; plan prompts are available via `worker-prompts.ts` builders for embedding in worker runtimes.

#### Scenario: Audit accepts an issue key
- **GIVEN** Forge is initialized with `issuePrefix: 'AI'`
- **WHEN** an operator runs `pnpm forge audit AI-47`
- **THEN** the audit command SHALL dispatch with issue key `AI-47`

#### Scenario: Plan command is absent
- **WHEN** an operator runs `pnpm forge plan AI-47`
- **THEN** the CLI SHALL report the command as unknown and exit non-zero

### Requirement: Persistence surface (documented leak)

Forge SHALL persist command results to Supabase tables `forge_audits`, `forge_specs`, `forge_estimates`, and `forge_events` via a Supabase client configured from environment variables `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`, with `organization_id` scoping via `FORGE_ORGANIZATION_ID`. This direct coupling SHALL be replaced by a dependency-injected persistence adapter in a future change tracked as `refactor-forge-persist`; until that refactor lands, any second consumer inherits the same Supabase tables.

#### Scenario: Audit result is persisted
- **GIVEN** Forge is initialized and Supabase env vars are set
- **WHEN** an `audit AI-47` run completes with `--persist`
- **THEN** a row SHALL be inserted into `forge_audits` with the issue key and result payload

#### Scenario: Persistence failure surfaces to CLI
- **GIVEN** `SUPABASE_SERVICE_ROLE_KEY` is invalid
- **WHEN** an audit run attempts to persist
- **THEN** the CLI SHALL exit with a non-zero status and surface the Supabase error message

### Requirement: Worker-safe prompt building

Prompt-builder modules under `packages/forge/src/` SHALL NOT perform file-system I/O at module load time. Project context SHALL be read via `getProjectContext()` called from within builder function bodies so modules remain safe to import in Cloudflare Worker runtimes.

#### Scenario: No top-level fs in worker-prompts
- **WHEN** `worker-prompts.ts` is imported inside a Cloudflare Worker bundle
- **THEN** no `fs.readFile`, `readFileSync`, `require`, or dynamic `import('fs')` call SHALL execute at module-evaluation time

#### Scenario: Builders resolve project context lazily
- **GIVEN** `initProjectContext` has been called with a valid path
- **WHEN** any prompt builder is invoked
- **THEN** the builder SHALL call `getProjectContext()` inside its own body and interpolate the returned string into the prompt

### Requirement: Prompt neutrality (documented leak)

The engine's prompt corpus (audit-agent prompts under `commands/audit/prompts/`, spec-checker prompt, reviewer prompt, `commands/spec/fix.ts` system message, and the `MODULE_REGISTRY` in `commands/audit/modules.ts`) currently embeds VIVOD-specific architectural rules (e.g., "DB calls go through `@vivod/db`", "branded IDs from `@vivod/domain`", module entries like `'UI Library (@vivod/ui)'`). This content SHALL be replaced by a consumer-supplied prompt-override mechanism plus a consumer-owned module registry in a future change tracked as `refactor-forge-prompt-customization`; until that refactor lands, any non-VIVOD consumer receives audit findings biased by VIVOD conventions, and a second consumer cannot run audit meaningfully without the override.

#### Scenario: Audit on a non-VIVOD consumer surfaces VIVOD-biased findings
- **GIVEN** Forge is initialized for pavelrapoport.com (no `@vivod/db` in its dependency graph)
- **WHEN** an operator runs `pnpm forge audit <module>` against any module
- **THEN** the architect / tech-lead agents MAY produce findings that cite `@vivod/db`, `@vivod/domain`, or `@vivod/ui` as required architectural patterns
- **AND** those findings SHALL be treated as false positives until the override mechanism lands

#### Scenario: Module registry is not populated for the consumer
- **GIVEN** Forge is initialized for pavelrapoport.com
- **WHEN** an operator runs `pnpm forge audit --help` and inspects the available module names
- **THEN** the listed modules SHALL be the VIVOD module set (facade-engine, worker-app, etc.), not pavelrapoport.com modules
- **AND** running `forge audit <vivod-module>` against this repo SHALL fail with a file-glob mismatch

### Requirement: Config file discovery walks up the filesystem tree

`loadConfig()` SHALL search for `forge.config.mjs`, `forge.config.js`, and `forge.config.json` starting at `process.cwd()` and walking up to the filesystem root, stopping at the first match. Only the matched file SHALL be loaded; configs at deeper ancestors SHALL be ignored. `.ts` is intentionally excluded — Node's native ESM loader cannot execute `.ts` without an external loader.

#### Scenario: Monorepo-root config found from a sub-package cwd
- **GIVEN** `/repo/forge.config.mjs` exists
- **AND** `process.cwd()` is `/repo/packages/forge`
- **WHEN** `loadConfig()` runs
- **THEN** it SHALL load `/repo/forge.config.mjs` and not search any ancestor above `/repo`
