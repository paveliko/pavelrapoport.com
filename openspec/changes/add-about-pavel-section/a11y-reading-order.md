# A11y reading order — manual VoiceOver / NVDA pass

§8.5 of the change. axe-core green is necessary but not sufficient —
a screen-reader pass confirms the narrative is coherent for non-visual
users. This document captures the expected reading order so the
manual pass has a checklist.

## Setup

1. macOS: `cmd-F5` to toggle VoiceOver.
2. Windows: NVDA running, focus the page.
3. Visit `localhost:3000/en` (then repeat on `/ru`, `/ro`).
4. Press `vo-a` (Read All) on macOS, or `nvda+down` on Windows from the
   first focusable element.

## Expected reading order

The page should announce the section in this exact order. Every line
in this checklist is a single screen-reader announcement.

1. Heading level 1 — "About Pavel"  *(sr-only h1 on the section root)*
2. Heading level 2 — "It started in 1990, in the abandoned observatory
   of the Pioneer Palace."  *(Origin headline)*
3. Paragraph — "I was ten years old. There was no internet in Chișinău
   yet. I wrote my first game — Arkanoid — in Basic, on a ДВК. The same
   year, I placed second in the district math olympiad."
4. Paragraph — "I've been writing code ever since. Thirty-five years."
5. Heading level 2 — "Career"  *(sr-only — Career act has no visible h2)*
6. Paragraph — the Career intro ("Israel. Twenty-six years. Two
   startups I founded…")
7. Image, label "Career timeline, 2000 to present"
   followed by description "Sixteen career periods from 1990 to 2026.
   Each square represents one period…"  *(SVG title + desc)*
8. Sixteen list items, one per period, in the order they appear in the
   list (newest first per spec — Own Studio first, Pioneer Palace
   last). Each list item announces:
     - article landmark
     - years (e.g. "2026 – present")
     - organization
     - role
     - location ("city, country")
     - tech stack (dot-separated)
     - notable items (if any)
     - body summary
9. Heading level 2 — "In 2026, I stopped writing code by hand."  *(Pivot headline)*
10. Pivot body — four paragraphs in order.

## What should NOT be announced

- The Arkanoid icon — it is decorative (no `aria-label`,
  `aria-hidden` propagates from the parent). Screen reader should pass
  over silently.
- The colored squares in the strip should announce their `<title>`
  (`Self-taught at Abandoned Observatory of the Pioneer Palace, 1990`,
  `Founder at LANFUN, 2003 – 2004`, …) — but ONLY when navigated by
  Tab. During a linear `vo-a` read-through they are part of the SVG and
  should not be announced individually after the SVG title + desc.
- The dev-only `BreakpointIndicator` and `GridOverlay` (only in
  `NODE_ENV=development` and `aria-hidden`).

## Tab-order check

Tab from the page top:

1. 16 timeline squares, in chronological order: Origin (1990) → IDF
   (2000) → LANFUN (2003) → … → Own Studio (2026)
2. 16 article rows, in display order (newest first — Own Studio is
   the first article, Pioneer Palace is the last)

Each square announces its `<title>` ("{role} at {organization},
{years}"). Pressing Enter on a focused square smooth-scrolls to the
matching article and moves focus there.

## Coherence check

After the linear read, the listener should leave with:

- A sense of narrative arc — Origin (warm, formative), Career (long
  authority), Pivot (intentional turn).
- Knowledge that there are 16 distinct periods, with two acquisitions
  named (Asurion, Vimeo, Check Point, HPE), two founder ventures
  (brand DNA, QuickWork), and a current studio in Chișinău.
- The Pivot's claim — Product Architect, OpenSpec authoring, Canvas
  for OpenSpec — clearly delivered as the closing thought.

Mark this section closed when both the Tab-order check and the
coherence check pass on /en. Repeat once on /ru to confirm the
translated copy reads naturally.
