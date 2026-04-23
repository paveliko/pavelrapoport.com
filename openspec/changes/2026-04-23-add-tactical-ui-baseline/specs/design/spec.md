# Design system — delta

Delta spec for the `design` domain. Merged into `openspec/specs/design/spec.md` on `/opsx:archive`.

---

## ADDED Requirements

### Requirement: Surface modes

The design system SHALL provide two surface modes, `surface-ivory` and `surface-dark`, applied as a class on the root document `<body>`. Apps select a mode statically at layout level; no runtime toggle is exposed to end-users.

#### Scenario: App selects ivory surface
- **WHEN** `apps/web` renders its root layout
- **THEN** `<body>` carries the `surface-ivory` class
- **AND** all design tokens resolve to ivory values (`--bg`, `--ink`, `--ink-muted`, `--border`)

#### Scenario: App selects dark surface
- **WHEN** `apps/studio` renders its root layout
- **THEN** `<body>` carries the `surface-dark` class
- **AND** all design tokens resolve to dark values

#### Scenario: Shareable snapshot inherits public surface
- **WHEN** a user navigates to `/s/[id]` (a shareable canvas snapshot) in `apps/web`
- **THEN** the snapshot renders under `surface-ivory`
- **AND** the snapshot must be visually indistinguishable from the landing page in surface treatment

---

### Requirement: Token-based styling

The design system SHALL define all colors, radii, typography, spacing primitives, and motion values as CSS variables in `@repo/ui/styles/globals.css`. Component styles MUST NOT reference hardcoded colors, font stacks, or easing values.

#### Scenario: Component applies color
- **WHEN** a component needs a background color
- **THEN** it SHALL use `hsl(var(--bg))`, `hsl(var(--accent))`, or a Tailwind utility bound to a token
- **AND** literal hex or rgb values are NOT permitted

#### Scenario: Component applies motion
- **WHEN** a component uses a transition
- **THEN** duration SHALL reference `var(--duration-fast | base | slow)`
- **AND** easing SHALL reference `var(--ease-out-expo)` or a named token

---

### Requirement: Signature component set

The library SHALL expose the following signature components from `@repo/ui`: `TacticalFrame`, `MonoLabel`, `StatusPill`, `TechPill`, `DividerTechnical`, `MetaBar`, `ScanReveal`.

#### Scenario: TacticalFrame renders four corners
- **WHEN** `<TacticalFrame>` mounts
- **THEN** four corner-bracket SVGs are positioned at the four corners of the frame's bounding box
- **AND** corner color resolves from `--accent`

#### Scenario: TacticalFrame animates
- **WHEN** `<TacticalFrame animated>` mounts
- **THEN** the four corners start at the geometric center with `scale(0) opacity(0)`
- **AND** animate to final positions with 60ms staggered delay per corner
- **AND** use `var(--ease-out-expo)` easing

#### Scenario: StatusPill reflects state
- **WHEN** `<StatusPill status="deploying" />` renders
- **THEN** the component displays an accent-terracotta square indicator followed by an uppercase mono label `DEPLOYING`

#### Scenario: StatusPill accepts custom label
- **WHEN** `<StatusPill status="live" label="ON AIR" />` renders
- **THEN** the indicator uses the `live` color mapping (cool-blue)
- **AND** the label displays `ON AIR` instead of `LIVE`

---

### Requirement: Primitive baseline

The library SHALL expose shadcn-derived primitives covering these patterns: `button`, `input`, `textarea`, `label`, `dialog`, `sheet`, `dropdown-menu`, `popover`, `tooltip`, `tabs`, `separator`, `scroll-area`, `command`, `toast`. All primitives MUST render correctly in both surface modes without per-surface overrides.

#### Scenario: Primitive respects surface
- **WHEN** `<Button>` renders under `surface-ivory`
- **THEN** foreground and background resolve to ivory-mode tokens
- **AND** the same `<Button>` under `surface-dark` resolves to dark-mode tokens with no component-level code change

---

### Requirement: No i18n in UI package

Components in `@repo/ui` MUST NOT import `next-intl` or any i18n runtime. All user-facing strings flow to components as props from the consuming app.

#### Scenario: Consumer supplies translated string
- **WHEN** an app renders `<StatusPill label={t('status.deploying')} />`
- **THEN** the component receives a resolved string
- **AND** the component renders that string without knowledge of its translation source

---

### Requirement: Motion and accessibility

Animated components SHALL respect `prefers-reduced-motion: reduce` by collapsing to a non-animated render path.

#### Scenario: Reduced motion preference
- **WHEN** the user's OS sets `prefers-reduced-motion: reduce`
- **AND** `<TacticalFrame animated>` mounts
- **THEN** corners render at their final positions immediately with no animation

#### Scenario: ScanReveal under reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is active
- **AND** `<ScanReveal variant="stroke">` mounts
- **THEN** children render in their final visual state with no stroke animation

---

### Requirement: Component contract

Each component in `@repo/ui` MUST be a typed React server-compatible component by default. Components that require client-side interactivity or Framer Motion SHALL mark themselves with `'use client'` at the file top.

#### Scenario: Server-safe primitive
- **WHEN** `<MonoLabel>` is rendered inside a Server Component
- **THEN** no hydration boundary is introduced
- **AND** the component works identically in RSC and Client Component contexts

#### Scenario: Client-only component
- **WHEN** `<TacticalFrame animated>` is rendered
- **THEN** the component file begins with `'use client'`
- **AND** the parent may be a Server Component — the `'use client'` boundary is introduced at `TacticalFrame`, not at the call site
