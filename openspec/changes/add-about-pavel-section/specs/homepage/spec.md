# homepage/about-section — delta v1

## ADDED Requirements

### Requirement: Section placement
The About section SHALL appear on the homepage with anchor id `#about`.
For v1 it renders as the primary homepage content, replacing the
`<ComingSoon />` placeholder. When the "Blueprint" and "Contact" sections
land in future changes, About SHALL be repositioned to sit between them
without modification to its own implementation.

Top-nav integration is out of scope for this change and is tracked
separately.

#### Scenario: Direct deep-link to #about
- **WHEN** a visitor follows an external link to
  `https://pavelrapoport.com/en#about`
- **THEN** the browser scrolls to the section root (`<section id="about">`)
  and the AboutSection becomes the first visible content under the page chrome.

### Requirement: Three-act structure
The section SHALL render in three sequential blocks:

1. **Origin** — one period (1990), prose + Arkanoid icon
2. **Career** — intro paragraph, followed by a minimal SVG timeline strip,
   followed by a complete text list of all career periods
3. **Pivot** — editorial block describing the 2026 transition and the
   Product Architect positioning

Blocks SHALL render in this order on all viewports. On mobile the layout
stacks vertically; no block is hidden based on viewport size.

#### Scenario: Mobile rendering keeps all three acts
- **GIVEN** a viewport at 360 × 800 px
- **WHEN** the homepage loads
- **THEN** the DOM contains, in order: `[data-slot="origin-act"]`,
  `[data-slot="career-block"]`, `[data-slot="pivot-act"]`, all visible
  in the rendered output (no `hidden` attribute, no `md:hidden` utility).

### Requirement: Origin act content
The Origin act SHALL include:

- Year: 1990
- Location: Pioneer Palace, Chișinău, Moldova SSR
- Artifact: Arkanoid game written in Basic on a ДВК computer
- Achievement: second place, district math olympiad
- Opening line: *"It started in 1990, in the abandoned observatory of
  the Pioneer Palace."*
- Closing line: *"I've been writing code ever since. Thirty-five years."*

An Arkanoid SVG icon SHALL accompany the text. The icon SHALL be a
stylized wireframe, not a screenshot of the historical game.

#### Scenario: Origin headline + body and decorative icon
- **GIVEN** the homepage rendered at `/en`
- **WHEN** a screen reader reads the Origin act linearly
- **THEN** it announces the opening line as a heading, the body
  paragraphs in source order including the closing line, and skips the
  Arkanoid SVG (which is decorative and inherits `aria-hidden`).

### Requirement: Career timeline data source
The Career block SHALL read periods from
`apps/web/src/data/timeline.json`, conforming to schema
`timeline-data/v1`. The SVG strip and the text list SHALL both consume
this single source. If the file is missing or fails schema validation
at module load, the build SHALL fail loudly.

#### Scenario: Schema validation fires at module load
- **GIVEN** a malformed timeline.json (e.g. missing required `start`
  field on a period)
- **WHEN** `apps/web/src/types/timeline.ts` is imported by any RSC
- **THEN** the Zod parse at the bottom of the module throws and the
  Next.js build / RSC render aborts with the schema error in the log.

### Requirement: Career timeline strip rendering
The timeline strip SHALL render as minimal SVG with the following rules:

- A single horizontal axis line, from year 2000 to the current year
- One square per career period, placed at the period's start year
- Non-highlighted squares: 10 × 10 px
- Highlighted squares (type `founder` / `business`, or has `notable[]`):
  14 × 14 px
- The Origin period (1990) SHALL render as a detached square to the far
  left, connected to the main axis by a dotted line
- Year ticks SHALL appear at every 5-year interval (2000, 2005, 2010,
  2015, 2020, 2025)
- The strip SHALL NOT use swim lanes, variable-width bars, overlapping
  rectangles, or decorative gradients
- The strip SHALL NOT animate on load beyond a simple fade-in on
  scroll-into-view

#### Scenario: Strip layout with 16 periods on 2000-to-present axis
- **GIVEN** the canonical 16-period timeline.json (Origin 1990, then
  IDF 2000 through Own Studio 2026)
- **WHEN** the strip renders against an `axisStartYear=2000` /
  `axisEndYear=2026` axis
- **THEN** the SVG contains exactly 16 `<rect>` elements with
  `data-period-id`, the Origin square sits at the detached x≈40
  position joined by a dotted bridge to the main axis at x=100, and
  five-year tick labels appear at 2000 / 2005 / 2010 / 2015 / 2020 / 2025.

### Requirement: Design token usage
The About section SHALL source all colors, typography, spacing, and
border-radius values from `@repo/ui` design tokens. Inline hex codes,
inline rem values for spacing, and font-family overrides are FORBIDDEN
in both the timeline strip and the period list.

If a required token does not exist in `@repo/ui`, it SHALL be added to
`@repo/ui` in a separate minimal commit before the About section
references it.

#### Scenario: No hex codes leak into the components
- **WHEN** `grep -E "#[0-9a-fA-F]{3,6}"` is run against the About
  section source files (`packages/ui/src/components/{timeline-strip,
  period-list-item,arkanoid-icon}.tsx` and
  `apps/web/src/components/about/*.tsx`)
- **THEN** the only matches are inside comments or doc-blocks, never
  inside inline `style={{ ... }}` or `className=""` attributes.

### Requirement: Period-type color mapping
Period squares SHALL use tokens according to role type:

- `formative` → `--color-accent-origin`
- `founder`, `business` → `--color-accent-founder`
- `work` with "Architect" or "Lead" in the role string → `--color-accent-architect`
- `work` (other) → `--color-text-tertiary`
- `military` → `--color-text-quaternary`
- `ongoing: true` → `--color-accent-current` (overrides type color)

The mapping SHALL live in a pure function `getPeriodAccent(period)` in
`apps/web/src/types/timeline.ts` so that the strip and list stay
consistent.

#### Scenario: Mapping covers every type and the ongoing override
- **GIVEN** the helper `getPeriodAccent` exported from
  `apps/web/src/types/timeline.ts`
- **WHEN** called with each canonical period
- **THEN** `formative → accent-origin`,
  `business (LANFUN) → accent-founder`,
  `military (IDF) → text-quaternary`,
  `work + Architect role (Zerto) → accent-architect`,
  `work + plain role (MidiCom) → text-tertiary`,
  `ongoing (Own Studio) → accent-current` regardless of underlying type.
  All branches are covered by `apps/web/src/__tests__/timeline.test.ts`.

### Requirement: Career text list — primary information channel
The Career block SHALL include a complete text list of all 16 periods
from the timeline data. The list is the primary information channel;
the SVG strip is a decorative visual anchor.

Each list item SHALL render:

- Years (formatted `YYYY – YYYY` or `YYYY – present`)
- Organization name
- Role
- City, country (from `location`)
- Tech stack as inline dot-separated text (from `tech[]`)
- Summary paragraph (from `summary`)

Highlighted periods SHALL render with an accent `border-left` in the
matching role-type token color. Non-highlighted periods SHALL use a
neutral `border-left`.

All 16 periods SHALL be visible at all times. There SHALL NOT be
pagination, filtering, "show more" toggles, or hover-only content.

#### Scenario: Full list renders newest-first with no truncation
- **GIVEN** the homepage rendered at `/en`
- **WHEN** the document is queried for `[data-slot="period-list-item"]`
  inside `<ol>`
- **THEN** exactly 16 articles are present, the first article's id is
  `period-16` (Own Studio), the last is `period-01` (Pioneer Palace),
  and no article is hidden behind a `show-more` toggle or a
  `display: none` rule.

### Requirement: Strip–list interaction
Clicking or pressing Enter on a timeline strip square SHALL smooth-scroll
the viewport to the matching period in the list below and set focus on
that list item. The list item SHALL remain highlighted for 1.5 seconds
after the jump for visual confirmation.

#### Scenario: Click on a square, focus moves and 1.5s flash plays
- **GIVEN** the strip rendered with 16 squares
- **WHEN** the user clicks the square with `data-period-id="08"`
  (Soluto)
- **THEN** the URL hash updates to `#period-08` via
  `history.replaceState`, the matching `<article id="period-08">`
  receives focus (`document.activeElement.id === "period-08"`), the
  article gains `data-period-flashing="true"` for the next ≈1.5
  seconds while the `about-period-flash` keyframe runs, and the
  attribute is removed when the flash completes. Pressing Enter on a
  focused square produces the same outcome.

### Requirement: Pivot act content
The Pivot act SHALL include:

- Headline: *"In 2026, I stopped writing code by hand."*
- Body copy covering:
  - End of hand-written code (late 2025 / 2026)
  - Move to professional OpenSpec authoring as primary deliverable
  - Current position: Product Architect
  - Location: Chișinău, working with EU founders
  - The Canvas-for-OpenSpec vision (stated as in-progress, not shipped)

The Pivot act SHALL NOT link to external products that do not yet exist
publicly.

#### Scenario: Pivot delivers the four narrative beats
- **GIVEN** the homepage rendered at `/en`
- **WHEN** a screen reader reads the Pivot act
- **THEN** it announces the headline ("In 2026, I stopped writing code
  by hand.") followed by four paragraphs in order: the spec-as-bottleneck
  realization, the OpenSpec authoring workflow, the in-progress
  Canvas-for-OpenSpec, and the Product Architect / Chișinău /
  EU-founders close. No `<a>` element points at an unreleased product
  inside the Pivot block.

### Requirement: Language support
Narrative copy SHALL be provided in English, Russian, and Romanian
under the `web.home.about.*` namespace in
`packages/i18n/messages/{locale}/web.json`. The translated strings
cover the Origin headline + body, the Career intro, the Pivot headline +
body, the timeline axis label and description, the "present" indicator
for ongoing periods, and the sr-only Career heading.

Timeline metadata — organization names, city names, role titles, tech
stack items, and period summaries — SHALL remain in English across all
locales for v1. Translation of period summaries is out of scope.

#### Scenario: Translated narrative on /ru with English metadata
- **GIVEN** the homepage rendered at `/ru`
- **WHEN** the Origin headline, Career intro and Pivot headline are
  read out
- **THEN** they are in Russian
  ("Всё началось в 1990-м…",
  "Израиль. Двадцать шесть лет…",
  "В 2026-м я перестал писать код руками.")
  while organization names, role titles and tech-stack tokens
  ("Zerto", "Frontend Architect", "React · TypeScript") remain in
  English in the period list.

### Requirement: Component boundary
The About section SHALL keep its reusable primitives (`TimelineStrip`,
`PeriodListItem`, `ArkanoidIcon`) inside `@repo/ui`, accepting strings
as props and never importing `next-intl` directly.

The page-level assembly (`AboutSection`, `OriginAct`, `CareerBlock`,
`PivotAct`) lives in `apps/web/src/components/about/` and handles
translation resolution.

#### Scenario: @repo/ui components stay i18n-blind
- **WHEN** `grep -r "next-intl" packages/ui/src/components/` is run
- **THEN** there are zero matches; every string `TimelineStrip`,
  `PeriodListItem` or `ArkanoidIcon` displays arrived through props.
  Translation resolution lives only in
  `apps/web/src/components/about/*.tsx`, where `useTranslations` is
  called.

### Requirement: Accessibility
- The timeline strip SHALL have `role="img"` and a descriptive `aria-label`
- Each square SHALL contain a `<title>` element announcing role,
  organization, and years
- The period list SHALL be a semantic `<ol>` of `<article>` elements
- Every piece of information shown in the strip SHALL also appear in the
  list (no information is visual-only)
- Keyboard navigation SHALL tab through strip squares in chronological
  order and continue into the list articles in source order
- No information SHALL be conveyed by color alone

#### Scenario: axe-core reports zero violations across all locales
- **GIVEN** the homepage running in development with the dev-only
  `BreakpointIndicator` excluded via `[data-axe-skip="true"]`
- **WHEN** `axe-core` 4.x runs the WCAG 2.0 / 2.1 A and AA tag set on
  `/en`, `/ru`, and `/ro`
- **THEN** every locale reports `violations: 0` and at least 35 passing
  rules. The About section, audited in isolation against `#about`,
  reports 21 passes / 0 violations.

### Requirement: Performance
The About section SHALL not block First Contentful Paint of the
homepage. The timeline JSON SHALL be imported at build time, not
fetched. The section SHALL render fully on the server. Client-side
JavaScript is required ONLY for the strip-to-list scroll interaction.

#### Scenario: Server-rendered HTML contains the full section
- **GIVEN** a production build (`next build`) of `@repo/web`
- **WHEN** the static HTML for `/en` is fetched with JavaScript
  disabled
- **THEN** the response body already contains the Origin headline +
  body, the SVG strip with 16 squares, all 16 list articles, and the
  Pivot headline + body. No timeline.json is fetched at runtime; the
  data is inlined at build time via the static import in
  `apps/web/src/types/timeline.ts`.
