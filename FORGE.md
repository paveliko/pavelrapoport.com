# pavelrapoport.com — Project context for `@repo/forge`

Studio monorepo for Pavel Rapoport's AI Development Studio. Consumed by the
`@repo/forge` autonomous pipeline (audit / spec / review / estimate) at prompt
build time via `getProjectContext()`.

## Apps

- `apps/web` — public landing site (Next.js 15 App Router, port 3000)
- `apps/studio` — internal dashboard behind auth (Next.js 15 App Router, port 3001)

Both apps deploy to Cloudflare Workers via `@opennextjs/cloudflare`.

## Shared packages

- `@repo/auth` — authentication, role-based access (Supabase Auth)
- `@repo/config` — shared env / service configuration
- `@repo/db` — database layer (Supabase PostgreSQL + typed queries + RLS)
- `@repo/forge` — autonomous pipeline engine (this package's consumer context)
- `@repo/i18n` — internationalization (next-intl)
- `@repo/muse` — creative / design tokens (planned)
- `@repo/ui` — shared UI primitives (shadcn/ui + Tailwind CSS 4)
- `packages/openspec` — specs, conventions, project identity

Planned: `@repo/ai`, `@repo/api`, `@repo/domain-map`.

## Tech stack

- **Frontend:** React 19, Next.js 15 (App Router), TypeScript, Tailwind CSS 4, D3.js, SVG, Canvas, XState
- **Backend:** Supabase (PostgreSQL + Auth + Storage, RLS-driven)
- **Infra:** Turborepo + pnpm 10 workspaces, Cloudflare Workers (`@opennextjs/cloudflare`), Cloudflare KV, Cloudflare DNS
- **AI:** Claude Opus / Sonnet via Anthropic SDK, MCP servers, RAG pipelines
- **Tooling:** Linear (team prefix `AI`), Git, OpenSpec CLI, Husky + commitlint, Vitest

## Locales and routing

Public-facing pages are multilingual across `en` (default), `ru`, and `ro`.
Route structure: `/en/...`, `/ru/...`, `/ro/...`. next-intl resolves locale via
the URL segment; there is no runtime locale negotiation.

## Secrets and environment

Secrets flow through **Infisical**, not `.env` files committed to the repo.
Forge's runtime consumes:
- `ANTHROPIC_API_KEY` — Claude SDK
- `LINEAR_API_KEY`, `LINEAR_TEAM_ID` — Linear integration
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — persistence (Supabase project `mtavnbjdgldttqdpwouo`)
- `FORGE_ORGANIZATION_ID` — tenant scope for persistence tables

### `process.env` vs `getCloudflareContext()`

In Cloudflare Worker runtimes, secrets arrive via `getCloudflareContext().env`,
not `process.env`. Local dev, CI, and Node-based CLI (including `forge`) use
`process.env`. Do NOT write code that hardcodes `process.env` if it could run
inside a worker — route through the appropriate accessor.

## Linear

- Team: **AI Development Studio** (identifier `AI`).
- Issue keys: `AI-<number>` (e.g., `AI-47`). Never mix prefixes across projects.
- `## Relevant specs` section in an issue body is parsed by forge to fetch
  spec context for audit / estimate prompts.

## Domains (OpenSpec)

ai, auth, blog, clients, design-system, domains, finance, forge, infra,
integrations, messages, network, organizations, projects, studio, tasks, web,
whatsapp-agent.

## Architectural invariants

- **CLI → JSON → DB → read-only UI.** The CLI is the source of truth for
  structured operations; the web UI reads, it does not write from scratch.
- **Stateless client.** Server is authoritative. No client-side state
  management frameworks.
- **URL is the state.** No `useState` for UI state — use `searchParams` and
  route segments.
- **Entity-driven.** Design the entity first, then the screens.
- **Minimum code, maximum reuse.** If a library does it, use it. If a function
  exists, reuse it. Do not re-implement.

## Git workflow

- Branches: `feature/<name>`, `fix/<name>`, `chore/<name>`, `hotfix/<name>`.
- Pre-commit hooks run commitlint and lint on staged files (Husky).
- Conventional commits required: `type(domain): description` — types are
  `feat | fix | refactor | style | test | docs | chore | perf | ci`; domain is
  an OpenSpec domain or package name.
