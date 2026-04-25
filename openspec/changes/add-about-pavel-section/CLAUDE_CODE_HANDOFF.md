# Claude Code handoff — add-about-pavel-section

## Paste this into Claude Code

```
Implement OpenSpec change: add-about-pavel-section

Files are in openspec/changes/add-about-pavel-section/
Read in this order before touching any code:
1. proposal.md — the why and what
2. design.md — layout, SVG rules, copy
3. specs/homepage/about-section.md — requirements (source of truth)
4. tasks.md — ordered task list

Then execute tasks.md in order. STOP after each numbered section
(after 1.x tasks, after 2.x tasks, etc.) and show a short summary
of what changed before continuing.

VIVOD rules in effect (from vivod-openspec-workflow skill):
- All reusable UI in packages/ui — not in apps/
- @repo/ui components NEVER import next-intl — strings flow as props
- Use design tokens only — no inline hex codes, no hardcoded spacing
- Run `pnpm check-types` after each section
- Run `pnpm build` before moving to section 9
- Do NOT modify files outside task scope
- Do NOT add unlisted dependencies

If any design token listed in specs/homepage/about-section.md does not
yet exist in @repo/ui, STOP and add it in a separate minimal commit
first. Do not invent tokens in the AboutSection components.

After all tasks pass:
- Run `openspec validate --all --strict`
- Open a PR linked to the Linear issue (create issue in VVD team if none)
- STOP. Do not archive until I confirm the visual works on staging.
```

## What to expect from Claude Code

Claude Code will work through 9 sections. You should see:

- Section 1 — new tokens in `packages/ui` styles
- Section 2 — `timeline.json` moved, types + Zod validator added
- Section 3 — three `web.json` files updated with about copy
- Section 4 — `ArkanoidIcon` component in `@repo/ui/icons`
- Section 5 — `TimelineStrip` + `PeriodListItem` in `@repo/ui`, Storybook stories
- Section 6 — `AboutSection` wrapper + three act components in `apps/web`
- Section 7 — homepage integration, nav link added
- Section 8 — a11y audit green
- Section 9 — build green, validate green, PR opened

If Claude Code proposes scope changes mid-flight (e.g. "I found the tokens
already exist" or "this can be done without a Zod validator"), review
the change, then tell it to proceed or push back.

## Rollback plan

If anything goes wrong:
- The change is isolated in `openspec/changes/add-about-pavel-section/`
- All new components are new files — nothing modifies existing components
- Homepage integration is one import + one JSX node between existing
  sections — trivial to revert

## After staging looks right

Ask Claude Code to archive:

```
Archive the add-about-pavel-section change.
Use manual mv — the CLI rejects date-prefixed names per known memory quirk.
Append delta requirements to openspec/specs/homepage/spec.md under a new
section: "## About section (applied YYYY-MM-DD from add-about-pavel-section)".
Include a cross-reference note at the top of any conflicting parent section.
```
