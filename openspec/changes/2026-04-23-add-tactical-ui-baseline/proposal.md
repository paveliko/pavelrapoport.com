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

Claude Design produced screen-level references for Dashboard, Projects list, Muse canvas, and Snapshot artifact, plus a ready-to-paste implementation targeting the existing shadcn setup in `packages/ui`. The system is visually coherent and codified.

**Current state of `packages/ui`:** The package is already installed with the shadcn baseline (≈20 primitives, `cn` helper, `cva`, `tw-animate-css`, `lucide-react`, React 19, Tailwind 4, `@custom-variant dark (&:is(.dark *))` wiring). `globals.css` still carries shadcn's neutral grey tokens. No tactical signature components exist yet.

## Why now

Three forcing functions:

1. **Handoff continuity.** Claude Design can only cleanly hand off to Claude Code if `@repo/ui` exposes matching primitives. Without them, generated screens materialize as ad-hoc JSX that drifts from the design system within one or two iterations.
2. **Cross-surface consistency.** Landing (ivory), Studio (dark), and shareable Snapshots (ivory) must share one vocabulary. A shared `@repo/ui` baseline is the only way to prevent per-app re-skinning.
3. **Canvas is next.** The Canvas module in `muse-studio-spec-v1.1.md` requires tactical entity-nodes. They must be built from the same primitives as everything else — not invented locally inside `features/canvas/`.

## What changes

- **Brand palette onto the existing shadcn tokens.** `packages/ui/src/styles/globals.css` keeps its current structure — `@theme inline`, `:root` / `.dark`, variable names — and swaps the oklch values to the Rapoport Studio palette: warm ivory background, near-black ink, terracotta primary (`#C75B3A`), cool-blue accent (`#4A7FB5`), with a matching lifted-for-dark variant (`#E8795A` / `#6B9FD0`). `--radius` drops from `0.625rem` to `0.125rem` for the sharp-corner tactical feel.
- **Six tactical signature components** added to `packages/ui/src/components/`:
  - `TacticalFrame` — wrapper with four corner brackets; optional deploy-from-center animation on mount, per-card `staggerIndex`
  - `MonoLabel` — uppercase mono caption with `tone` / `size` variants
  - `StatusPill` — single-word state readout with indicator dot and optional pulse
  - `TechPill` — key/value metadata chip with a split rule
  - `DividerTechnical` — 1 px rule with optional mono label cut into it
  - `MetaBar` — thin mono strip (top/bottom) with `left` / `right` slots
- **Motion via CSS keyframes.** Two keyframes (`tactical-bracket-deploy`, `tactical-line-deploy`) land in `globals.css`, guarded by `prefers-reduced-motion`. No JS-driven animation library is added.
- **No runtime theme toggle.** Light is the public surface; `.dark` on the surface root switches to the workspace palette. A surface commits to its mode at the consuming app/layout level.

## What is out of scope

- No changes to `packages/db`, `packages/muse`, `packages/i18n`, `packages/openspec`
- No migration of existing landing page content to the new components — that's a follow-up change
- No Canvas entity-node implementation — separate change, depends on this
- No Entity View system (`inline/row/card/detail`) from the UI Gatekeeper skill — separate change, reuses this signature layer
- No `surface-ivory` / `surface-dark` classes, HSL token rewrite, or `@theme inline` rename — we keep the shadcn variable names and the `:root` / `.dark` split
- No `ScanReveal` primitive, no Framer Motion dependency — deploy-from-center is pure CSS keyframes
- No new shadcn primitive re-installation, no `tailwind.config.ts` preset, no `packages/ui/src/styles/fonts.css` wiring — fonts remain wired per-app as they are today
- No playground route in `apps/studio` and no rewiring of `apps/web` / `apps/studio` layouts

## Reads

Before implementing, review:

- `openspec/specs/design/spec.md` — extend it via this delta
- `muse-studio-spec-v1.1.md` — surface architecture (Canvas / Studio / Pipeline)
- Claude Design handoff bundle — `README.md`, `SKILL.md`, `colors_and_type.css`, and `packages/ui/` subtree — visual and implementation ground truth

## Success criteria

- `packages/ui/src/styles/globals.css` compiles with the brand oklch palette and `--radius: 0.125rem`; variable names and structure are unchanged
- Six tactical components type-check and are importable from `@repo/ui/components/*` using the existing export map
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass monorepo-wide
- `apps/studio` (which already imports `@repo/ui/globals.css`) picks up the new palette; `apps/web` (which layers its own `--color-*` tokens on top) is visually unchanged
- Corner-bracket deploy animation runs on mount and is suppressed under `prefers-reduced-motion: reduce`
