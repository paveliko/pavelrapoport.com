# Add About Pavel section to homepage

## Why

The homepage asserts "Product Architect" in the hero but never earns it.
A visitor meets the positioning, not the person.

Without an About section:
- No differentiation from agencies or anonymous freelance listings
- The 2026 pivot (Senior Frontend Engineer → Product Architect) is invisible
- The spec-first workflow claim has no origin story
- Trust is demanded before proof

The shift from writing code to authoring OpenSpec documents is the defining
narrative arc of this site. This section owns it.

## What changes

- **ADDED** — About section on homepage, placed between *The Blueprint*
  and *Contact*
- **ADDED** — three-act narrative structure: Origin (1990) → Career (2000–2025)
  → Pivot (2026 onward)
- **ADDED** — minimal SVG timeline strip — small colored squares on a single
  horizontal line, one per career period, colored by role type
- **ADDED** — full text list of all periods below the SVG, with organization,
  role, years, and summary (primary information channel)
- **ADDED** — Arkanoid origin story as its own block above the timeline
- **ADDED** — Pivot editorial block below the timeline

All visuals use `@repo/ui` design tokens. No inline colors, no one-off
typography.

## Success criteria

A visitor leaves this section understanding three things:

1. **Authority is earned** — 35 years in code, across Moldova, Israel, and
   remote teams; design systems, architect roles, two founded companies
2. **The pivot is intentional** — 2026 is not a trend reaction but a peak;
   spec-first is the natural evolution after 35 years of shipping code
3. **This is a person, not an agency** — someone who started at 10,
   placed in a math olympiad, and still lives where he started

Visual rules:
- SVG timeline never dominates — it is a visual anchor, not the content
- Text list is the primary information channel (scannable, accessible,
  printable, crawlable)
- Entire section readable in under 2 minutes
- Works in EN / RU / RO

The section must hand off to *Contact* without an explicit CTA button.

## Out of scope

- Canvas-for-OpenSpec product itself (separate product spec)
- Full case studies section (separate change, later)
- LinkedIn / CV sync (separate housekeeping change)
- Interactive playable Arkanoid (static SVG only for v1)
- Swim lanes, nested bars, hover tooltips — explicitly rejected as
  too dense for v1
