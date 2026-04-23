# Tasks: Tactical UI baseline

Implementation checklist. Each task targets ≤30 min. Check off as completed.

---

## Phase 1 — Setup (5 tasks)

- [ ] **1.** Initialize shadcn in `packages/ui` with `components.json` targeting `src/primitives/`
- [ ] **2.** Install peer dependencies: `clsx`, `tailwind-merge`, `framer-motion`, `lucide-react`
- [ ] **3.** Create `src/lib/cn.ts` (clsx + tailwind-merge helper)
- [ ] **4.** Create `src/styles/globals.css` with shared tokens, `surface-ivory`, `surface-dark`, and `@theme inline` block
- [ ] **5.** Create `src/styles/fonts.css` and wire `Source Serif 4` + `Geist Mono` via `next/font` in both app layouts

## Phase 2 — Primitive layer (3 tasks)

- [ ] **6.** Add shadcn baseline set: `button`, `input`, `textarea`, `label`, `dialog`, `sheet`, `dropdown-menu`, `popover`, `tooltip`, `tabs`, `separator`, `scroll-area`, `command`, `toast`
- [ ] **7.** Verify each primitive uses tokens only (no hardcoded colors, no literal hex/rgb). Patch any that don't.
- [ ] **8.** Export all primitives from `src/index.ts` barrel

## Phase 3 — Signature components (7 tasks)

- [ ] **9.** Implement `TacticalFrame` with four SVG corner brackets and `animated` deploy-from-center (Framer Motion + reduced-motion fallback)
- [ ] **10.** Implement `MonoLabel` with `tone` (neutral/accent/success/danger) and `size` (xs/sm) variants
- [ ] **11.** Implement `StatusPill` with color-mapped indicator square (deploying/live/draft/error + custom)
- [ ] **12.** Implement `TechPill` in two sizes
- [ ] **13.** Implement `DividerTechnical` with optional inline label
- [ ] **14.** Implement `MetaBar` with `left` / `right` slots
- [ ] **15.** Implement `ScanReveal` with `corners` / `stroke` / `fade` variants, `delay` and `stagger` props

## Phase 4 — Wiring (4 tasks)

- [ ] **16.** Add `@repo/ui` to workspace deps in `apps/web/package.json` and `apps/studio/package.json`
- [ ] **17.** `apps/web/app/layout.tsx`: set `surface-ivory` on body, import `@repo/ui/styles/globals.css`
- [ ] **18.** `apps/studio/app/layout.tsx`: set `surface-dark` on body, import same stylesheet
- [ ] **19.** Configure `packages/ui/tailwind.config.ts` as a preset; extend from both `apps/web` and `apps/studio` tailwind configs

## Phase 5 — Playground & verification (4 tasks)

- [ ] **20.** Create `apps/studio/src/app/_playground/page.tsx` rendering every primitive and signature component; surface-mode toggle via `?surface=ivory|dark`
- [ ] **21.** Run `pnpm check-types` — must be clean across the monorepo
- [ ] **22.** Run `pnpm build` — both apps must build without warnings
- [ ] **23.** Spot-rebuild: re-implement the current landing page "Project assembling" card using `TacticalFrame`, `MonoLabel`, `TechPill`, `DividerTechnical` — visually verify against existing production screenshot (parity test)

## Phase 6 — Documentation & archive (2 tasks)

- [ ] **24.** Write `packages/ui/README.md`: component index, surface-mode guidance, token reference, font licensing
- [ ] **25.** Run `/opsx:apply` to merge delta spec into `openspec/specs/design/spec.md`; then `/opsx:archive` after verification gates pass

---

## Out of scope (follow-up changes)

- **Migrate existing landing page content** to new components — separate change once baseline is verified
- **Canvas entity-node** implementation — separate change, depends on this
- **Entity View system** (`inline / row / card / detail` per UI Gatekeeper skill) — separate change, reuses signature layer
- **Storybook** — separate decision tied to open-source intent

## Verification gates

All must pass before `/opsx:archive`:

```bash
pnpm check-types
pnpm build
openspec validate --all --strict
```

Plus visual parity of the landing spot-rebuild against the production screenshot (manual review).
