# Tasks: Tactical UI baseline

Implementation checklist. Narrowed to the shipped scope: brand values on existing shadcn tokens + six signature components. No new dependencies, no app-layout wiring, no playground.

---

## Phase 1 — Tokens (3 tasks)

- [ ] **1.** In `packages/ui/src/styles/globals.css`, swap the `:root` oklch values to the Rapoport Studio light palette (ivory background, ink foreground, terracotta primary, cool-blue accent, matching secondary/muted/border/ring/chart/sidebar tokens). Add `color-scheme: light` to `:root`.
- [ ] **2.** Change `--radius` from `0.625rem` to `0.125rem`. Swap `.dark` block to the Rapoport dark palette (`#1A1A1C` bg, lifted `#E8795A` primary, lifted `#6B9FD0` accent, warm `#E8E6E0` foreground). Add `color-scheme: dark` to `.dark`.
- [ ] **3.** Append `@keyframes tactical-bracket-deploy`, `@keyframes tactical-line-deploy`, and a `@media (prefers-reduced-motion: reduce)` guard that disables animations on `[data-tactical-animated] [data-tactical-corner]` / `[data-tactical-line]`. Leave `@theme inline`, `@custom-variant dark`, and `@layer base` untouched.

## Phase 2 — Signature components (6 tasks)

- [ ] **4.** `packages/ui/src/components/tactical-frame.tsx` — `"use client"`. Four `TacticalCorner` spans drawn via absolute position + `border-[t|r|b|l]-width` from `--bracket-thickness`. Variants: `tone` (default/primary/accent/muted), `size` (sm/md/lg). Props: `label`, `meta`, `animated`, `staggerIndex`, `bordered`. Animation: `tactical-bracket-deploy 560ms cubic-bezier(0.2,0.7,0.2,1) both` with `--bracket-delay: <staggerIndex * 60>ms`.
- [ ] **5.** `packages/ui/src/components/mono-label.tsx` — server-safe. `cva` with `size` (xs/sm/md/lg) and `tone` (default/muted/primary/accent). `font-mono uppercase tabular-nums tracking-[0.14em]`.
- [ ] **6.** `packages/ui/src/components/status-pill.tsx` — server-safe. Statuses: `live`, `deploying`, `draft`, `archived`, `error`. 6 px indicator dot via `--dot` custom property. Optional `pulse`.
- [ ] **7.** `packages/ui/src/components/tech-pill.tsx` — server-safe. `k` / `v` props rendered as a key/value pair with a 1 px vertical split rule. `tone` (default/accent/primary/muted).
- [ ] **8.** `packages/ui/src/components/divider-technical.tsx` — server-safe. 1 px rule with optional `label` and `meta`. `tone` (default/accent/primary — rule color via `color-mix(in oklch, var(--accent) 40%, transparent)`), `align` (start/center/end).
- [ ] **9.** `packages/ui/src/components/meta-bar.tsx` — server-safe. Thin (`h-7`) mono strip with `left` / `right` slots, vertical `divide-x`. `position` (top/bottom) flips the border edge.

All six use `@repo/ui/lib/utils` `cn`, `class-variance-authority` for variants, and `data-slot` attributes matching file name (e.g. `data-slot="tactical-frame"`). Only `tactical-frame.tsx` carries `"use client"`.

## Phase 3 — Verification (3 tasks)

- [ ] **10.** `pnpm --filter @repo/ui typecheck` — clean.
- [ ] **11.** `pnpm typecheck`, `pnpm lint`, `pnpm build` across the monorepo — clean. `@repo/web` must build unchanged (layers its own `--color-*` tokens on top of shadcn). `@repo/studio` picks up the new palette via its existing `@repo/ui/globals.css` import.
- [ ] **12.** Visual smoke: spin up `pnpm --filter @repo/studio dev`, confirm shadcn primitives now use terracotta (`--primary`) and cool blue (`--accent`) and that `--radius-sm`/`--radius-md`/`--radius-lg` render sharp (≤ 2 px). Toggle the OS "Reduce motion" setting and confirm bracket-deploy is suppressed.

---

## Out of scope (follow-up changes)

- Migrate existing landing page content to new components — separate change once baseline is verified
- Canvas entity-node implementation — separate change, depends on this
- Entity View system (`inline / row / card / detail` per UI Gatekeeper skill) — separate change, reuses signature layer
- Removing the redundant `--color-canvas` / `--color-ink` / etc. block in `apps/web/src/app/globals.css` — deferred; it now carries the same values as the shadcn tokens but stays on its own namespace
- `ScanReveal`, Framer Motion, `tailwind.config.ts` preset, `fonts.css`, playground route — dropped when the scope was narrowed
- Storybook — separate decision tied to open-source intent

## Verification gates

All must pass before `/opsx:archive`:

```bash
pnpm typecheck
pnpm lint
pnpm build
openspec validate --all --strict
```
