# Proposal: Add tactical UI baseline to `@repo/ui`

**Linear:** _AI-TBD (to be created before apply)_
**Status:** Proposed
**Owner:** Pavel Rapoport

---

## Context

The visual language for `pavelrapoport.com` surfaces — landing, Studio workspace, Muse conversational canvas, and read-only session snapshots — was externally defined through a Claude Design session seeded from the current landing page. The generated system is a coherent **terminal-editorial hybrid** with a tactical-frame layer:

- Serif editorial anchor (headings, body)
- Monospace meta-voice (status lines, labels, tech pills)
- Corner-bracket frames around content blocks
- Thin cool-blue technical dividers
- Warm ivory surface for public-facing screens; dark variant for the internal workspace

Claude Design produced screen-level references for Dashboard, Projects list, Muse canvas, and Snapshot artifact. The system is visually coherent and ready to codify.

**Current state of `packages/ui`:** The package exists but contains no standardized primitive layer and no codified tactical components. Each new screen re-implements frame, status, and meta patterns from scratch.

## Why now

Three forcing functions:

1. **Handoff continuity.** Claude Design can only cleanly hand off to Claude Code if `@repo/ui` exposes matching primitives. Without them, generated screens materialize as ad-hoc JSX that drifts from the design system within one or two iterations.
2. **Cross-surface consistency.** Landing (ivory), Studio (dark), and shareable Snapshots (ivory) must share one vocabulary. A shared `@repo/ui` baseline is the only way to prevent per-app re-skinning.
3. **Canvas is next.** The Canvas module in `muse-studio-spec-v1.1.md` requires tactical entity-nodes. They must be built from the same primitives as everything else — not invented locally inside `features/canvas/`.

## What changes

- `packages/ui` receives a **shadcn/ui baseline** (Radix primitives with Tailwind styling, copied into the package — owned code, not dependency)
- **Design tokens** defined as CSS variables in two surface modes: `surface-ivory` and `surface-dark`
- **Seven signature components** added:
  - `TacticalFrame` — wrapper with four corner brackets, optional deploy-from-center animation
  - `MonoLabel` — uppercase mono with tone variants
  - `StatusPill` — MonoLabel + colored indicator square
  - `TechPill` — rectangular frame for tech-stack pills
  - `DividerTechnical` — thin cool-blue divider with optional inline label
  - `MetaBar` — technical row (status · stage · route · metric)
  - `ScanReveal` — animation wrapper for mount reveals
- `apps/web` and `apps/studio` **wired** to consume `@repo/ui`, each committing to one surface mode at layout level

## What is out of scope

- No changes to `packages/db`, `packages/muse`, `packages/i18n`, `packages/openspec`
- No migration of existing landing page content to the new components — that's a follow-up change once baseline is verified
- No Canvas entity-node implementation — separate change, depends on this
- No Entity View system (`inline/row/card/detail`) from the UI Gatekeeper skill — separate change, reuses this signature layer
- **No runtime theme toggle.** Each surface commits to its mode at build time.

## Reads

Before implementing, review:

- `openspec/specs/design/spec.md` — extend it via this delta
- `muse-studio-spec-v1.1.md` — surface architecture (Canvas / Studio / Pipeline)
- Claude Design reference screens (Dashboard v2, Projects table, Muse canvas, Snapshot) — visual ground truth

## Success criteria

- Both `apps/web` and `apps/studio` build and render using tokens from `@repo/ui`
- A playground route exercises every primitive and signature component in both surface modes without warnings
- A spot-rebuild of one existing landing section using new components is visually indistinguishable from the current production render
- `pnpm check-types` and `pnpm build` pass monorepo-wide
- Next visual change to the system requires editing exactly one file (`globals.css`)
