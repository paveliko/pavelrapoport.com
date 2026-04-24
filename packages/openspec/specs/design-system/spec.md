# Design System — Visual Foundation

> Everything from the system. Nothing invented in components.

---

## Color Palette

Single source of truth: `apps/web/src/app/globals.css` (CSS custom properties).

All colors are semantic — named by purpose, not by hue.

### Core Colors

| Token              | Light         | Dark          | Purpose                              |
| ------------------ | ------------- | ------------- | ------------------------------------ |
| `--color-canvas`   | `#FAFAF8`     | `#1A1A1C`     | Page background                      |
| `--color-ink`      | `#1C1C1E`     | `#E8E6E0`     | Primary text                         |
| `--color-ink-light`| `#3D3D3A`     | `#B4B2A9`     | Secondary text                       |
| `--color-muted`    | `#8A8880`     | `#888780`     | Tertiary text, captions              |
| `--color-subtle`   | `#F0EDE6`     | `#252524`     | Subtle backgrounds, hover states     |
| `--color-grid`     | `#E8E6E0`     | `#2C2C2A`     | Borders, dividers, structural lines  |
| `--color-code-bg`  | `#F5F3EE`     | `#232322`     | Code block backgrounds               |

### Brand Colors

| Token                    | Light         | Dark          | Purpose                        |
| ------------------------ | ------------- | ------------- | ------------------------------ |
| `--color-blueprint`      | `#4A7FB5`     | `#6B9FD0`     | Links, primary actions         |
| `--color-blueprint-light`| `#6B9FD0`     | `#85B7EB`     | Hover states, secondary links  |
| `--color-accent`         | `#C75B3A`     | `#E8795A`     | CTAs, highlights, alerts       |
| `--color-accent-light`   | `#E8795A`     | `#F0997B`     | Hover states for accent        |

### Grid Background Colors

Derived from `--color-ink` via `color-mix()` — automatically adapts to light/dark mode.

| Token               | Mix                   | Purpose                          |
| -------------------- | --------------------- | -------------------------------- |
| `--grid-line-micro` | ink 5% + transparent  | 4px micro grid (barely visible)  |
| `--grid-line-base`  | ink 12% + transparent | 16px base grid (visible on attention) |
| `--grid-line-major` | ink 25% + transparent | 64px major grid (structural)     |

### Rules

1. **No hardcoded colors in components.** Always use CSS custom properties.
2. **No `rgba()` with magic numbers.** Use `color-mix()` from existing tokens.
3. **Semantic names only.** `--color-blueprint`, not `--color-blue`.
4. **One source of truth.** All values defined in `globals.css`. Tailwind reads them via `@theme inline`.

---

## Grid System

Graph paper aesthetic — тетрадка в клетку.

See also: `identity.md` > Philosophy > Pixel Perfect Grid

### Background Grid (production — brand element)

Three density levels, all centered (`background-position: center center`).
When resizing, center holds, edges clip.

| Level | Step | Purpose                                | Visibility        |
| ----- | ---- | -------------------------------------- | ------------------ |
| Micro | 4px  | Base spacing token. Everything is ×4.  | Barely visible     |
| Base  | 16px | Component rhythm. Buttons, inputs, padding. | Visible on attention |
| Major | 64px | Layout sections. Visual skeleton.      | Structural         |

Implementation: 6-layer CSS `background-image` on `body` in `globals.css`.

### Layout Rules

```
Spacing scale (4px base unit):
  Tailwind spacing classes ARE the grid tokens.
  0.5 = 2px, 1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px,
  5 = 20px, 6 = 24px, 8 = 32px, 10 = 40px, 12 = 48px

  Use ONLY these values. No arbitrary spacing (p-[13px]).
  If the design needs 13px — snap to 12 or 16.

Default gaps and padding:
  - gap-4 (16px) as default grid gap
  - p-4 / p-6 as default container padding
  - Components align to 4px increments — always
```

### Component Grid Rules

1. **Layout starts from the grid.** Define the grid first, then fill cells with components.
2. **Components fill cells.** A component never defines its own outer spacing — the grid does.
3. **No CSS in components.** Components use design system tokens via Tailwind classes. No inline styles, no `style={}`, no custom CSS classes inside component files.
4. **Building blocks only.** Every visual element is assembled from @repo/ui primitives. No one — human or AI — invents new visual patterns. If a pattern doesn't exist in the system, it gets added to @repo/ui first.
5. **Items inside grid follow grid rules.** Children inherit the grid's rhythm. Nested grids use the same 4px base unit.

### Dev Tools (development only)

| Tool                 | Trigger      | Purpose                              |
| -------------------- | ------------ | ------------------------------------ |
| 12-column overlay    | `Ctrl+G`     | Check component alignment to columns |
| Breakpoint indicators| Always on    | Show Tailwind breakpoint boundaries  |

---

## Typography

| Token         | Font             | Purpose           |
| ------------- | ---------------- | ----------------- |
| `--font-sans` | Inter            | UI, navigation    |
| `--font-serif`| Lora             | Body text, prose  |
| `--font-mono` | JetBrains Mono   | Code, data, grid labels |

---

## Design System Usage Rules

```
Rule: No CSS inside components.

Components are building blocks assembled from the design system.
All styling comes from:
  1. Tailwind utility classes (which map to design tokens)
  2. CSS custom properties (defined in globals.css)
  3. Component variants (defined in @repo/ui)

What this means in practice:
  ✅ <Button variant="primary" size="lg" />
  ✅ <div className="grid grid-cols-3 gap-4 p-6">
  ✅ <span className="text-muted font-mono text-sm">

  ❌ <div style={{ color: '#4A7FB5' }}>
  ❌ <div className="custom-card-wrapper">  // no custom CSS classes
  ❌ Writing .css files for individual components

Exception: globals.css for base-level styles and token definitions.
Exception: Animation keyframes when Tailwind's built-in animations are insufficient.
```

---

## Tactical UI baseline (applied 2026-04-24 from change `2026-04-23-add-tactical-ui-baseline`)

> This section formalizes the `@repo/ui` token layer landed in [PR #45](https://github.com/pavelrapoport/pavelrapoport.com/pull/45).
> The `--color-*` namespace above remains the source of truth for `apps/web`; the shadcn tokens below are the source of truth for `@repo/ui` and `apps/studio`. The two namespaces currently carry equivalent hues under different names — terracotta is `--color-accent` in the `apps/web` namespace and `--primary` in the shadcn namespace; cool blue is `--color-blueprint` and `--accent` respectively. A future change will remove the `--color-*` block in `apps/web/src/app/globals.css` once the migration is complete.

### Requirement: Surface polarity via `.dark` class

The design system SHALL express the two surface polarities (public ivory / internal dark) as a class toggle on the surface root: `:root` tokens render the light variant; adding `.dark` to a surface root switches every token to the dark variant. No runtime user-facing theme toggle is exposed; no `prefers-color-scheme` media query drives the polarity.

#### Scenario: Public app uses the light polarity
- **WHEN** `apps/web` renders its root layout
- **THEN** no `dark` class is applied to `<html>` or `<body>`
- **AND** all tokens resolve to the `:root` light variant (warm ivory background, near-black ink)

#### Scenario: Workspace app uses the dark polarity
- **WHEN** `apps/studio` renders its root layout
- **THEN** `<html>` carries the `dark` class
- **AND** all tokens resolve to the `.dark` variant (near-black background with cool undertone, warm ink)

#### Scenario: Shareable snapshot inherits the public polarity
- **WHEN** a user navigates to a shareable canvas snapshot in `apps/web`
- **THEN** the snapshot renders under `:root` (no `.dark` class)
- **AND** the snapshot is visually indistinguishable from the landing page in surface treatment

### Requirement: Brand palette on shadcn tokens

The design system SHALL express the brand palette (warm ivory background, near-black ink, terracotta primary, cool-blue accent) as oklch values on the existing shadcn variable names in `packages/ui/src/styles/globals.css`. Variable names, the `@theme inline` block, and the `:root` / `.dark` structure MUST NOT be renamed or restructured. `--radius` SHALL be `0.125rem` for the sharp-corner tactical feel.

#### Scenario: Primary token resolves to terracotta under light
- **WHEN** a component reads `var(--primary)` while no `.dark` class is active on any ancestor
- **THEN** the value resolves to `oklch(0.583 0.159 35)` (approximately `#C75B3A`)

#### Scenario: Primary token lifts under dark
- **WHEN** a component reads `var(--primary)` under a `.dark` root
- **THEN** the value resolves to `oklch(0.684 0.149 35)` (approximately `#E8795A`)

#### Scenario: Accent token resolves to cool blue
- **WHEN** a component reads `var(--accent)` under `:root`
- **THEN** the value resolves to `oklch(0.588 0.105 250)` (approximately `#4A7FB5`)
- **AND** under `.dark` the value resolves to `oklch(0.687 0.094 245)` (approximately `#6B9FD0`)

#### Scenario: Radius is sharp
- **WHEN** any component renders with a default shadcn radius utility (`rounded`, `rounded-md`, `rounded-lg`)
- **THEN** the resolved radius is ≤ 2 px (`--radius: 0.125rem`)

### Requirement: Token-based styling

Components in `@repo/ui` MUST style themselves using the shadcn token variables (`--background`, `--foreground`, `--primary`, `--accent`, `--border`, `--ring`, etc.) or utilities bound to them. Literal hex, rgb, or hsl values are NOT permitted in component source.

#### Scenario: Component applies a color
- **WHEN** a component sets a color
- **THEN** it SHALL reference a shadcn token (`text-primary`, `bg-background`, `border-accent`, `color:var(--muted-foreground)`) or derive from one via `color-mix(in oklch, var(--accent) 40%, transparent)`
- **AND** literal hex or rgb values are NOT permitted

### Requirement: Signature component set

The library SHALL expose six signature components from `@repo/ui/components/*`: `TacticalFrame`, `MonoLabel`, `StatusPill`, `TechPill`, `DividerTechnical`, `MetaBar`.

#### Scenario: TacticalFrame renders four corners
- **WHEN** `<TacticalFrame>` mounts
- **THEN** four L-bracket spans are positioned at the four corners of the frame body
- **AND** bracket color resolves from `--bracket-color` (set by `tone`: `primary` → `var(--primary)`, `accent` → `var(--accent)`, `muted` → `var(--muted-foreground)`, `default` inherits `currentColor`)

#### Scenario: TacticalFrame deploys from center
- **WHEN** `<TacticalFrame animated />` mounts without a reduced-motion preference
- **THEN** each corner starts at the frame's geometric center with `scale(0) opacity(0)`
- **AND** animates to its final corner position in 560 ms with `cubic-bezier(0.2, 0.7, 0.2, 1)`
- **AND** the four corners of the same frame animate simultaneously

#### Scenario: Multiple frames stagger
- **WHEN** several `<TacticalFrame animated />` components render together with incrementing `staggerIndex`
- **THEN** the nth frame's deploy animation begins `60 ms * staggerIndex` after the first

#### Scenario: StatusPill reflects state
- **WHEN** `<StatusPill status="live" />` renders
- **THEN** the component displays a 6 px terracotta indicator dot followed by its children in uppercase mono text
- **AND** the border color resolves to `var(--primary)`

#### Scenario: StatusPill pulses when requested
- **WHEN** `<StatusPill status="deploying" pulse />` renders
- **THEN** the indicator dot carries the `animate-pulse` utility
- **AND** the dot color resolves to `var(--accent)`

### Requirement: No i18n in UI package

Components in `@repo/ui` MUST NOT import `next-intl` or any i18n runtime. All user-facing strings flow to components as props from the consuming app.

#### Scenario: Consumer supplies translated string
- **WHEN** an app renders `<StatusPill>{t('status.deploying')}</StatusPill>`
- **THEN** the component receives a resolved string
- **AND** the component renders that string without knowledge of its translation source

### Requirement: Motion and accessibility

Animated components SHALL respect `prefers-reduced-motion: reduce` by collapsing to a non-animated render path. Deploy-from-center motion is implemented as CSS keyframes in `packages/ui/src/styles/globals.css` — no JS animation library is used.

#### Scenario: Reduced motion preference
- **WHEN** the user's OS sets `prefers-reduced-motion: reduce`
- **AND** `<TacticalFrame animated />` mounts
- **THEN** every `[data-tactical-corner]` descendant has `animation: none`
- **AND** corners render at their final positions immediately

### Requirement: Component contract

Each component in `@repo/ui` MUST be a typed React server-compatible component by default. Components that require client-side state or inline CSS custom properties SHALL mark themselves with `"use client"` at the file top.

#### Scenario: Server-safe primitive
- **WHEN** `<MonoLabel>` is rendered inside a Server Component
- **THEN** no hydration boundary is introduced
- **AND** the component works identically in RSC and Client Component contexts

#### Scenario: Client-only component
- **WHEN** `<TacticalFrame animated />` is rendered
- **THEN** the component file begins with `"use client"`
- **AND** the parent may be a Server Component — the `"use client"` boundary is introduced at `TacticalFrame`, not at the call site
