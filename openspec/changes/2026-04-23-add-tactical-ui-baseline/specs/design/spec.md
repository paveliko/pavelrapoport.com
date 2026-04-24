# Design system — delta

Delta spec for the `design` domain. Merged into `openspec/specs/design/spec.md` on `/opsx:archive`.

---

## ADDED Requirements

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

---

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

---

### Requirement: Token-based styling

Components in `@repo/ui` MUST style themselves using the shadcn token variables (`--background`, `--foreground`, `--primary`, `--accent`, `--border`, `--ring`, etc.) or utilities bound to them. Literal hex, rgb, or hsl values are NOT permitted in component source.

#### Scenario: Component applies a color
- **WHEN** a component sets a color
- **THEN** it SHALL reference a shadcn token (`text-primary`, `bg-background`, `border-accent`, `color:var(--muted-foreground)`) or derive from one via `color-mix(in oklch, var(--accent) 40%, transparent)`
- **AND** literal hex or rgb values are NOT permitted

---

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

---

### Requirement: No i18n in UI package

Components in `@repo/ui` MUST NOT import `next-intl` or any i18n runtime. All user-facing strings flow to components as props from the consuming app.

#### Scenario: Consumer supplies translated string
- **WHEN** an app renders `<StatusPill>{t('status.deploying')}</StatusPill>`
- **THEN** the component receives a resolved string
- **AND** the component renders that string without knowledge of its translation source

---

### Requirement: Motion and accessibility

Animated components SHALL respect `prefers-reduced-motion: reduce` by collapsing to a non-animated render path. Deploy-from-center motion is implemented as CSS keyframes in `packages/ui/src/styles/globals.css` — no JS animation library is used.

#### Scenario: Reduced motion preference
- **WHEN** the user's OS sets `prefers-reduced-motion: reduce`
- **AND** `<TacticalFrame animated />` mounts
- **THEN** every `[data-tactical-corner]` descendant has `animation: none`
- **AND** corners render at their final positions immediately

---

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
