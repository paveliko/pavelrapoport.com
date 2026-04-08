@AGENTS.md

# pavelrapoport.com

Turborepo monorepo for Pavel Rapoport's AI Development Studio — personal site, internal studio, and shared packages.

## Project structure

```
apps/
  web/       → public site (Next.js 16, port 3000)
  studio/    → internal dashboard (Next.js 16, port 3001)
packages/
  openspec/  → specs, conventions, project identity
  db/        → database layer
  i18n/      → internationalization
  ui/        → shared UI components
docs/        → PRD, brand voice, career analysis
```

Package manager: **pnpm 10** with workspace protocol.

## Commands

```bash
pnpm dev                        # run all apps
pnpm build                      # build all
pnpm lint                       # lint all
pnpm typecheck                  # type-check all
pnpm --filter @repo/web dev     # run web only
pnpm --filter @repo/studio dev  # run studio only
```

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Turbo for task orchestration
- Husky + commitlint for commit enforcement

**IMPORTANT:** Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code. This version has breaking changes from what you know.

## Commit format

Conventional Commits enforced via commitlint + husky pre-commit hook.

```
type(domain): description

Types: feat | fix | refactor | style | test | docs | chore | perf | ci
Domain: openspec domain or package name (auth, web, ui, openspec, etc.)
```

Examples:
```
feat(web): add bilingual blog routing
fix(db): correct RLS policy for viewer role
chore(ui): update shadcn components
docs(openspec): add partnership lifecycle spec
```

## OpenSpec

All project specs, conventions, and identity live in `packages/openspec/`.

- `config.yaml` — project context, domains, design principles, rules
- `conventions.md` — full coding conventions, git workflow, code philosophy
- `project.md` — project identity and positioning
- `specs/` — domain-specific specifications

**Read `packages/openspec/conventions.md` before writing code.** It is the source of truth for how code is written in this project.

## Code principles

These are distilled from conventions — read the full document for details.

1. **Minimum code, maximum reuse.** If a library does it, use it. If a function exists, reuse it.
2. **Stateless client.** Server is the source of truth. No client-side state management.
3. **URL is the state.** No `useState` for UI state — use `searchParams` and route segments.
4. **Entity-driven.** Design the entity first, then the screens.
5. **CLI-first.** CLI → JSON → Database → Web UI (read-only).

## Rules for agents

- **Read before you write.** Read `packages/openspec/conventions.md` and the relevant Next.js doc before writing code.
- **Don't duplicate conventions.** If it's in `conventions.md`, reference it — don't restate it.
- **Branch from dev.** Use `feature/<name>`, `fix/<name>`, or `chore/<name>`.
- **PR target is dev**, not main. Flow: feature → dev → staging → main.
- **Pre-commit hooks run:** commitlint on commit message + `pnpm lint` on staged files.
- **Bilingual routing.** Public-facing pages support `/en` (default) and `/ru`.
- **One spec per domain.** Use Given/When/Then format. Include role context (public/client/admin).
