# Design: Tactical UI baseline

Technical approach for applying the Rapoport Studio brand palette to the existing shadcn setup in `@repo/ui` and adding six tactical signature components.

---

## Directory structure

No restructuring. We land on the existing shadcn layout:

```
packages/ui/
├── package.json
├── tsconfig.json
└── src/
    ├── lib/
    │   └── utils.ts                  # cn() — already present
    ├── styles/
    │   └── globals.css                # shadcn tokens + tactical keyframes
    └── components/
        ├── button.tsx                 # (existing shadcn primitives, unchanged)
        ├── …
        ├── tactical-frame.tsx         # NEW
        ├── mono-label.tsx             # NEW
        ├── status-pill.tsx            # NEW
        ├── tech-pill.tsx              # NEW
        ├── divider-technical.tsx      # NEW
        └── meta-bar.tsx               # NEW
```

We keep the existing export map in [`packages/ui/package.json`](../../../packages/ui/package.json):

```json
"exports": {
  "./globals.css": "./src/styles/globals.css",
  "./components/*": "./src/components/*.tsx",
  "./lib/*": "./src/lib/*.ts"
}
```

Consumers import `import { TacticalFrame } from "@repo/ui/components/tactical-frame"` alongside the existing `import { Button } from "@repo/ui/components/button"`.

## Design tokens

All tokens live in [`packages/ui/src/styles/globals.css`](../../../packages/ui/src/styles/globals.css) on the existing shadcn variable names. We do **not** introduce `surface-ivory` / `surface-dark` classes, HSL tuples, or a parallel token namespace.

```css
:root {
  color-scheme: light;
  --radius: 0.125rem;                           /* was 0.625rem */

  --background: oklch(0.988 0.004 85);          /* #FAFAF8 ivory */
  --foreground: oklch(0.203 0.003 285);         /* #1C1C1E ink */
  --primary:    oklch(0.583 0.159 35);          /* #C75B3A terracotta */
  --accent:     oklch(0.588 0.105 250);         /* #4A7FB5 cool blue */
  --muted-foreground: oklch(0.600 0.008 85);    /* #8A8880 */
  --border:     oklch(0.914 0.006 85);          /* #E8E6E0 */
  --ring:       oklch(0.588 0.105 250);         /* focus = cool blue */
  /* …secondary, muted, sidebar-*, chart-*, destructive — see globals.css */
}

.dark {
  color-scheme: dark;
  --background: oklch(0.183 0.004 260);         /* #1A1A1C */
  --foreground: oklch(0.914 0.006 85);          /* warm ink */
  --primary:    oklch(0.684 0.149 35);          /* #E8795A lifted */
  --accent:     oklch(0.687 0.094 245);         /* #6B9FD0 lifted */
  --border:     oklch(1 0 0 / 10%);
  /* … */
}
```

The existing `@theme inline` block binds these to Tailwind utilities (`bg-background`, `text-foreground`, `border-border`, `ring-ring`, etc.) — unchanged. `@custom-variant dark (&:is(.dark *));` stays as-is.

## Tailwind 4 integration

No preset, no new config file. `packages/ui/src/styles/globals.css` already declares `@import "tailwindcss"` and `@source "../../../../apps/*/src/**/*.{ts,tsx}"` so Tailwind scans both apps. Each app imports `@repo/ui/globals.css` through its own `globals.css` (already wired).

## Surface-mode strategy

**Decision:** `.dark` class on the surface root switches the palette. Public surfaces (landing, muse, snapshot) render without `.dark` — warm ivory is the default. The workspace (studio) renders under `.dark` — near-black. Same terracotta, same cool blue, same mono type; only the canvas/ink polarity flips.

- Public: no root class → `:root` tokens
- Workspace: `<html class="dark">` → `.dark` tokens
- No runtime toggle; no `prefers-color-scheme` dependency.

**Alternative considered and rejected:** `surface-ivory` / `surface-dark` classes with an HSL token rewrite. Rejected because the existing shadcn variable names are already the lingua franca for the installed primitives — renaming them would fork every shadcn component file. The values-only override keeps the library ecosystem intact.

## Signature components

Six components. All use [`@repo/ui/lib/utils`](../../../packages/ui/src/lib/utils.ts) `cn`, `class-variance-authority` for variants, `data-slot` attributes, and the existing shadcn utility conventions.

### `TacticalFrame` — `"use client"`

Wrapper with four corner L-brackets. Each corner is an absolutely-positioned `<span>` with two border edges drawn from `--bracket-thickness`, colored via `--bracket-color` (resolved from `tone` — `primary` → `var(--primary)`, `accent` → `var(--accent)`, `muted` → `var(--muted-foreground)`, `default` inherits `currentColor`).

```tsx
type TacticalFrameProps = React.ComponentProps<"div"> & {
  tone?: "default" | "primary" | "accent" | "muted"
  size?: "sm" | "md" | "lg"        // 12 / 16 / 24 px brackets
  label?: React.ReactNode
  meta?: React.ReactNode
  animated?: boolean
  staggerIndex?: number            // 60ms * index → --bracket-delay
  bordered?: boolean               // 1px frame between the brackets
}
```

When `animated`, each corner runs the `tactical-bracket-deploy` keyframe (`560ms cubic-bezier(0.2, 0.7, 0.2, 1)`), starting at the frame's geometric center (`translate(±50%, ±50%) scale(0)`) and settling to the corner position. All four corners deploy simultaneously per frame; frames on the same page stagger via `staggerIndex`.

### `MonoLabel` — server-safe

Uppercase monospace caption with tight letter-spacing. Replaces shadcn silent labels for section headers.

```tsx
type MonoLabelProps = React.ComponentProps<"span"> & {
  size?: "xs" | "sm" | "md" | "lg"
  tone?: "default" | "muted" | "primary" | "accent"
}
```

### `StatusPill` — server-safe

Single-word state readout. Five statuses (`live`, `deploying`, `draft`, `archived`, `error`). 6 px indicator dot. Optional `pulse` via `animate-pulse`. Sharp corners (`rounded-none`).

```tsx
type StatusPillProps = React.ComponentProps<"span"> & {
  status?: "live" | "deploying" | "draft" | "archived" | "error"
  pulse?: boolean
}
```

Color map: `live → --primary` (terracotta), `deploying → --accent` (cool blue), `draft → --muted-foreground`, `archived → --muted-foreground @ 70%`, `error → --destructive`.

### `TechPill` — server-safe

Key/value metadata chip. Dim key on the left, bright value on the right, split by a 1 px vertical rule.

```tsx
type TechPillProps = React.ComponentProps<"span"> & {
  k: React.ReactNode
  v: React.ReactNode
  tone?: "default" | "accent" | "primary" | "muted"
}
```

### `DividerTechnical` — server-safe

1 px rule with optional mono label cut into it.

```tsx
type DividerTechnicalProps = React.ComponentProps<"div"> & {
  label?: React.ReactNode
  meta?: React.ReactNode
  tone?: "default" | "accent" | "primary"
  align?: "start" | "center" | "end"
}
```

Rule color resolves via `color-mix(in oklch, var(--accent) 40%, transparent)` for `accent` / `primary` tones — Tailwind 4 passes the declaration through. Unlabeled dividers should use shadcn `<Separator>`; `DividerTechnical` is for the labeled form.

### `MetaBar` — server-safe

Thin (28 px) mono strip with `left` / `right` slots, vertical `divide-x` between children. Hosts meta labels, file paths, tech pills at the top or bottom of a frame / viewport.

```tsx
type MetaBarProps = React.ComponentProps<"div"> & {
  left?: React.ReactNode
  right?: React.ReactNode
  position?: "top" | "bottom"    // flips the border edge
}
```

## Motion

Two CSS keyframes in `globals.css`, no JS animation library:

```css
@keyframes tactical-bracket-deploy {
  from {
    transform: translate(var(--bracket-from-x, 0), var(--bracket-from-y, 0)) scale(0);
    opacity: 0;
  }
  to {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
}

@keyframes tactical-line-deploy {
  from { transform: scaleX(0); opacity: 0; }
  to   { transform: scaleX(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  [data-tactical-animated] [data-tactical-corner],
  [data-tactical-animated] [data-tactical-line] {
    animation: none !important;
  }
}
```

`tw-animate-css` is already imported; the new keyframes co-exist with its utilities.

## Consumption contract

```tsx
// in app code
import { TacticalFrame } from "@repo/ui/components/tactical-frame"
import { StatusPill }    from "@repo/ui/components/status-pill"
import { Button }        from "@repo/ui/components/button"
import "@repo/ui/globals.css"
```

**Invariant:** components in `packages/ui` never import `next-intl` or any i18n runtime. Strings flow as props from the consuming app.

## Verification approach

No new playground route. Verification is:

1. `pnpm --filter @repo/ui typecheck`, `pnpm typecheck`, `pnpm lint`, `pnpm build` — all clean.
2. `pnpm --filter @repo/studio dev` — visit the shell, confirm terracotta `--primary`, cool-blue `--accent`, and sharp `--radius` (2 px) propagate to the shadcn primitives.
3. Toggle OS "Reduce motion" and confirm `TacticalFrame animated` renders without bracket-deploy animation.

## Open questions

None remaining for this scope. `ScanReveal`, Framer Motion, fonts.css, playground route, and a Tailwind preset were considered and explicitly deferred when the scope was narrowed by the user.
