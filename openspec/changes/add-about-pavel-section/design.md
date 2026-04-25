# Design: About Pavel section

## Narrative arc

The section answers one question: *why is this person a Product Architect?*

The answer is delivered in three acts. Each reinforces the next. By the end,
the Product Architect title is earned, not claimed.

| Act | Years | Role in narrative | Emotional beat |
|-----|-------|-------------------|----------------|
| Origin | 1990 | Roots. Self-taught since age 10. | Warmth, curiosity |
| Career | 2000–2025 | Earned expertise. 25 years shipping at scale. | Authority, depth |
| Pivot | 2026→ | The evolution. Not a pivot *away* — a pivot *up*. | Intention, clarity |

## Layout — section structure

```
┌─────────────────────────────────────────────────┐
│  ORIGIN ACT                                     │
│  Arkanoid story, 1990, Pioneer Palace           │
├─────────────────────────────────────────────────┤
│  CAREER — SVG timeline strip                    │  ← visual anchor
│  · · ■ ■ · · · ■ · ■ ■ · · · · · ★              │
├─────────────────────────────────────────────────┤
│  CAREER — text list of periods                  │  ← primary content
│  2003 – 2004  LANFUN · Founder                  │
│  2004 – 2007  MidiCom · Web Developer           │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  PIVOT ACT                                      │
│  "In 2026, I stopped writing code by hand."     │
└─────────────────────────────────────────────────┘
```

## SVG timeline strip — design rules

The SVG is deliberately minimal. It is a visual anchor that gives shape to
the text list below, not the content itself.

### Structure

- A single horizontal axis line from year 2000 to current year
- Small squares (not circles — squares match the `@repo/ui` visual language)
  placed on the axis at each period's start year
- Squares sized 10 × 10 px (non-highlighted) or 14 × 14 px (highlighted)
- Year ticks at every 5 years (2000, 2005, 2010, 2015, 2020, 2025)
- Origin (1990) appears as a single square on a detached segment to the
  far left, connected to the main axis by a dotted bridge line

### Color coding by role type

Colors come from the `@repo/ui` design tokens only. Hex codes are forbidden
in the component. The mapping:

| Period type | Token reference |
|-------------|-----------------|
| `formative` (Origin) | `--color-accent-origin` |
| `founder`, `business` | `--color-accent-founder` |
| `work` with "Architect" or "Lead" in role | `--color-accent-architect` |
| `work` (other) | `--color-text-tertiary` |
| `military` | `--color-text-quaternary` |
| Current (ongoing) | `--color-accent-current` |

If any of these tokens do not yet exist in `@repo/ui`, add them in a
separate, minimal PR before this change. Do not invent tokens here.

### Interaction

- Hover on a square reveals a tooltip with organization name + years
- Click on a square scrolls to the matching entry in the text list below
- Focus ring follows `@repo/ui` focus token
- Keyboard accessible in tab order

### What the strip does NOT show

- No swim lanes, no vertical stacking, no overlapping bars
- No duration rendered as width (all squares same size within their tier)
- No company logos, no technology icons
- No decorative gradients, shadows, or animations beyond fade-in

The strip's job is to say: *"here is a rhythm of 16 moments across 35 years."*
Nothing more. All substance lives in the text list below.

## Text list — design rules

The list is the primary information channel. If JavaScript fails, if a screen
reader is used, if the page is printed — the list alone must tell the story.

### Row structure

```
2020 – 2026    Zerto                              Frontend Architect
               Herzliya, Israel
               React · TypeScript · Redux Toolkit · TanStack Query
               Lead on enterprise DRM console migration from AngularJS.
               Created @zerto/shared-fe: 56+ components across 4 apps.
```

Each row has:

- **Left column** — years (`YYYY – YYYY` or `YYYY – present`)
- **Center column** — organization + role, stacked
- **Right column** — location (small, muted)
- **Below** — tech stack as inline dot-separated text
- **Below** — one-paragraph summary from `timeline.json`

### Periods in list

- All 16 periods appear in the list (including IDF, Origin)
- Sort order: chronological, newest first (Origin at the bottom)
- No filtering, no pagination, no "show more" button — all visible always
- Highlighted periods (founder, architect, notable) get a thin accent
  border-left; everything else renders with border-left neutral

## Copy (EN source of truth)

### Origin — headline
> It started in 1990, in the abandoned observatory of the Pioneer Palace.

### Origin — body
> I was ten years old. There was no internet in Chișinău yet.
> I wrote my first game — Arkanoid — in Basic, on a ДВК.
> The same year, I placed second in the district math olympiad.
>
> I've been writing code ever since. Thirty-five years.

### Career — intro (short, before timeline)
> Israel. Twenty-six years. Two startups I founded. A design system shipped
> alone in under a year. Six years as Frontend Architect at Zerto, through
> the HPE acquisition. 1,498 commits on the final product.

### Pivot — headline
> In 2026, I stopped writing code by hand.

### Pivot — body
> After 35 years, I realized the bottleneck was never the typing.
> It was the thinking upstream of the code. The spec.
>
> Today I design systems in OpenSpec — a format made for humans and machines.
> Architecture first. Then AI writes the code, under my supervision.
> I review every decision. I own every line.
> But my hands are on the blueprint, not the keyboard.
>
> I'm also building something bigger: a Canvas for OpenSpec.
> Large specifications deserve to be explored visually, not read top-to-bottom.
> That work is in progress.
>
> Today I'm a Product Architect. Based in Chișinău. Working with founders
> across the EU.

## Data source

Timeline periods come from `apps/web/data/timeline.json`. The file follows
schema `timeline-data/v1`. Both the SVG strip and the text list read from
this single source.

## Language support

- Copy authored in EN as source of truth
- RU / RO translations live in `packages/i18n/messages/{locale}/web.json`
  under namespace `home.about.*`
- Timeline metadata (organization names, cities, tech stack) stays in EN
  across all locales — proper nouns and technical terms are not translated
- Summary text per period (from `timeline.json`) stays in EN for v1;
  translation of period summaries is a follow-up change

## Accessibility

- SVG strip has `role="img"` with descriptive `aria-label`
- Each square has `<title>` inside for hover + screen reader
- Full list is the accessible information source — SVG is decorative-plus
- Every piece of information in the SVG is also present in the list
- Keyboard navigation tabs through squares in chronological order
- List rows are semantic `<article>` elements inside an `<ol>`

## Performance

- SVG is static, server-rendered, zero JavaScript required to render
- Timeline JSON loaded at build time (imported, not fetched)
- Section does not block First Contentful Paint
- No client-side rendering for any period content
