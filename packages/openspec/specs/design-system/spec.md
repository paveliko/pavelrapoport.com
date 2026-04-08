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
