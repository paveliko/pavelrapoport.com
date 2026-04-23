# Design: Tactical UI baseline

Technical approach for adding shadcn-based primitives and tactical signature components to `@repo/ui`.

---

## Directory structure

```
packages/ui/
├── components.json                    # shadcn config (custom path)
├── package.json
├── tsconfig.json
├── tailwind.config.ts                 # preset, extended by both apps
└── src/
    ├── index.ts                       # barrel export
    ├── styles/
    │   ├── globals.css                # tokens + surface modes + base layer
    │   └── fonts.css                  # @font-face declarations
    ├── lib/
    │   └── cn.ts                      # clsx + tailwind-merge utility
    ├── primitives/                    # shadcn-copied, owned
    │   ├── button.tsx
    │   ├── input.tsx
    │   ├── textarea.tsx
    │   ├── label.tsx
    │   ├── dialog.tsx
    │   ├── sheet.tsx
    │   ├── dropdown-menu.tsx
    │   ├── popover.tsx
    │   ├── tooltip.tsx
    │   ├── tabs.tsx
    │   ├── separator.tsx
    │   ├── scroll-area.tsx
    │   ├── command.tsx
    │   └── toast.tsx
    └── tactical/                      # signature layer
        ├── tactical-frame.tsx
        ├── mono-label.tsx
        ├── status-pill.tsx
        ├── tech-pill.tsx
        ├── divider-technical.tsx
        ├── meta-bar.tsx
        └── scan-reveal.tsx
```

## Design tokens

All tokens live in `src/styles/globals.css` as HSL tuples. Values resolve differently depending on which surface class is active on `<body>`.

```css
@layer base {
  :root {
    /* Shared across surfaces */
    --radius-sharp: 0.125rem;
    --radius-soft:  0.375rem;

    --font-serif: 'Source Serif 4', Georgia, serif;
    --font-sans:  'Inter', system-ui, sans-serif;
    --font-mono:  'Geist Mono', ui-monospace, SFMono-Regular, monospace;

    --accent-terracotta: 12 55% 48%;
    --accent-cool-blue:  210 70% 55%;
    --accent-success:    140 45% 45%;
    --accent-muted:      220 8% 50%;

    --duration-fast: 150ms;
    --duration-base: 240ms;
    --duration-slow: 420ms;
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Ivory — landing, canvas, snapshots */
  .surface-ivory {
    --bg:               40 30% 97%;
    --ink:              20 14% 10%;
    --ink-muted:        20 10% 40%;
    --border:           20 10% 85%;
    --border-technical: var(--accent-cool-blue);
    --accent:           var(--accent-terracotta);
  }

  /* Dark — studio workspace */
  .surface-dark {
    --bg:               220 12% 8%;
    --ink:              40 15% 92%;
    --ink-muted:        220 8% 60%;
    --border:           220 10% 20%;
    --border-technical: var(--accent-cool-blue);
    --accent:           var(--accent-terracotta);
  }

  body {
    background: hsl(var(--bg));
    color: hsl(var(--ink));
    font-family: var(--font-serif);
  }
}
```

## Tailwind 4 integration

Tailwind 4 `@theme inline` in `globals.css` binds CSS variables to utility classes:

```css
@theme inline {
  --color-background: hsl(var(--bg));
  --color-foreground: hsl(var(--ink));
  --color-accent:     hsl(var(--accent));
  --color-border:     hsl(var(--border));
  --font-serif:       var(--font-serif);
  --font-mono:        var(--font-mono);
  --radius:           var(--radius-sharp);
}
```

`packages/ui/tailwind.config.ts` is a preset; both apps extend it.

## Surface-mode strategy

**Decision:** static per-app surface mode, applied on `<body>` in the root layout. No runtime toggle.

- `apps/web/app/layout.tsx` → `<body class="surface-ivory">`
- `apps/studio/app/layout.tsx` → `<body class="surface-dark">`
- `apps/web/app/s/[id]/page.tsx` inherits ivory (shareable snapshots stay on public surface)

Components never hardcode a surface. They read `var(--bg)`, `var(--ink)`, `var(--accent)` and adapt to whatever surface is active.

**Alternative considered and rejected:** `data-theme` attribute + runtime toggle. Adds complexity for a decision that is architecturally per-surface — Studio is never going to be ivory, landing is never going to be dark. Runtime toggle is a user-facing feature, not a design-system feature.

## Signature components

### `TacticalFrame`
Wrapper with four corner-bracket SVGs. Corners are thin L-shapes in `--accent` color.

```tsx
type Props = {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';   // default 'md'
  cornerSize?: 'sm' | 'md' | 'lg'; // default 'md' (12px / 16px / 24px)
  animated?: boolean;              // default false
  className?: string;
};
```

When `animated`, corners mount at geometric center with `scale(0) opacity(0)`, spread to their final positions with a 60ms staggered delay and `--ease-out-expo`. Uses Framer Motion. CSS-only fallback under `prefers-reduced-motion: reduce`.

### `MonoLabel`
Uppercase monospace text with letter-spacing.

```tsx
type Props = {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'danger'; // default 'neutral'
  size?: 'xs' | 'sm';  // default 'xs'
  as?: ElementType;    // default 'span'
};
```

### `StatusPill`
MonoLabel with a filled square indicator preceding the text.

```tsx
type Props = {
  status: 'deploying' | 'live' | 'draft' | 'error' | (string & {});
  label?: string;   // defaults to status in uppercase
};
```

Color mapping: `deploying→terracotta`, `live→cool-blue`, `draft→muted`, `error→red`.

### `TechPill`
Rectangular frame with mono text and thin border. Used for tech-stack chips.

```tsx
type Props = {
  children: ReactNode;
  size?: 'sm' | 'md'; // default 'md'
};
```

### `DividerTechnical`
Thin horizontal line in `--border-technical` (cool-blue). Optional inline label.

```tsx
type Props = {
  spacing?: 'md' | 'lg';  // default 'md'
  label?: string;         // inline, MonoLabel styling
};
```

### `MetaBar`
Horizontal row of technical meta-data. Two slots: `left` (primary status) and `right` (supplementary).

```tsx
type Props = {
  left?: ReactNode;
  right?: ReactNode;
};
```

Used for things like `STATUS: DEPLOYING · STAGE: 1/3 · ROUTE: /MUSE/NEW  |  0 tokens`.

### `ScanReveal`
Generic mount-animation wrapper.

```tsx
type Props = {
  children: ReactNode;
  variant: 'corners' | 'stroke' | 'fade';
  delay?: number;      // ms, default 0
  stagger?: number;    // ms between children, default 0
};
```

## Shadcn baseline set (phase 1)

Copy into `src/primitives/`:

| Primitive | Used first in |
|-----------|---------------|
| `button` | every screen |
| `input`, `textarea`, `label` | Muse chat, Project settings |
| `dialog`, `sheet` | Entity detail panel, Change detail |
| `dropdown-menu`, `popover` | top-nav, context menus |
| `tooltip` | iconography |
| `tabs` | Project workspace (Domain / Creative / Specs / Pipeline) |
| `separator`, `scroll-area` | layout |
| `command` | future Muse command palette |
| `toast` | global feedback |

**Not phase 1** (add when first consumer needs them): `accordion`, `calendar`, `carousel`, `chart`, `select` variants beyond dropdown-menu.

## Fonts

Load via `next/font` in each app layout:

```tsx
import { Source_Serif_4 } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';

const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' });
const mono  = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

<body className={`${serif.variable} ${mono.variable} surface-ivory`}>
```

Licenses: Source Serif 4 and Geist Mono are both OFL. Document in `packages/ui/README.md`.

## Framer Motion

Add as peer dependency of `@repo/ui`. Required for `TacticalFrame animated` and `ScanReveal`. Other components have no motion dependency. CSS-only paths cover `prefers-reduced-motion: reduce`.

## Consumption contract

```tsx
// app code
import { TacticalFrame, MonoLabel, StatusPill, Button } from '@repo/ui';
import '@repo/ui/styles/globals.css';
```

**Invariant:** components in `packages/ui` never import `next-intl` or any i18n runtime. Strings flow as props from the consuming app.

## Verification approach

A playground route at `apps/studio/src/app/_playground/page.tsx` renders every primitive and signature component on both surface modes (toggle via query param). Used for visual review and type check. Not exposed in production navigation.

## Open questions

1. `shadcn` CLI inside `packages/ui` vs hand-copy. **Recommendation:** use the CLI with `components.json` pointing at `src/primitives/`. Benefit: easy updates from upstream when worth it.
2. Do we ship a Storybook for `@repo/ui`? **Recommendation:** not in this change. The playground route covers internal verification. Storybook is a separate decision tied to whether we intend to open-source any part of this library.
