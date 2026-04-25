# Tasks

## 1. Design tokens (prerequisite)

- [ ] 1.1 Audit `@repo/ui` for existing accent tokens
- [ ] 1.2 Add any missing role-type tokens: `--color-accent-origin`,
      `--color-accent-founder`, `--color-accent-architect`,
      `--color-accent-current`, `--color-text-quaternary`
- [ ] 1.3 Verify tokens resolve in both light and dark themes
- [ ] 1.4 Run `pnpm build` in `@repo/ui` to verify

## 2. Data

- [ ] 2.1 Move `timeline.json` into `apps/web/data/timeline.json`
- [ ] 2.2 Add TypeScript types → `apps/web/types/timeline.ts`
- [ ] 2.3 Add Zod validator; run at `getStaticProps` / RSC boundary
- [ ] 2.4 Export helper `getPeriodAccent(period): AccentToken` — maps
      type + role to a token name

## 3. Copy & i18n

- [ ] 3.1 Add `home.about.*` namespace to `packages/i18n/messages/en/web.json`
- [ ] 3.2 Add Russian translations → `messages/ru/web.json`
- [ ] 3.3 Add Romanian translations → `messages/ro/web.json`
- [ ] 3.4 Verify all locales pass type-check

## 4. Assets

- [ ] 4.1 Create `ArkanoidIcon` component in `@repo/ui/icons` — stylized
      wireframe SVG, uses currentColor
- [ ] 4.2 Confirm SVG renders correctly at 40px, 64px, 96px sizes

## 5. Components in `@repo/ui`

- [ ] 5.1 `<TimelineStrip>` — accepts `periods` + `accentMap` as props,
      renders SVG with squares on an axis
- [ ] 5.2 `<PeriodListItem>` — one row: years, org, role, location, tech,
      summary. Strings as props, no i18n imports.
- [ ] 5.3 Create dev-only preview route
      `apps/web/src/app/[locale]/dev/about-preview/page.tsx` rendering all
      component variants (typical, highlighted, ongoing, origin). The
      `/dev` segment MUST be gated by the production guard added in 7.5.
- [ ] 5.4 Verify via Preview MCP: `preview_start` → `preview_snapshot` +
      `preview_screenshot` at 360, 768, 1440 px; light and dark via
      DevTools Rendering emulation. Attach screenshots to the PR.

## 6. Section assembly in `apps/web`

- [ ] 6.1 Scaffold `AboutSection` wrapper in `apps/web/components/home/about/`
- [ ] 6.2 Wire `<OriginAct>` — renders headline, body, Arkanoid icon
- [ ] 6.3 Wire `<CareerBlock>` — intro paragraph, `<TimelineStrip>`,
      ordered list of `<PeriodListItem>`
- [ ] 6.4 Wire `<PivotAct>` — editorial layout, headline + body
- [ ] 6.5 Hook strip-square click → smooth-scroll to matching list item
      using URL fragment (`#period-{id}`)

## 7. Integration

- [ ] 7.1 Import `<AboutSection>` in `apps/web/src/app/[locale]/page.tsx`,
      replacing `<ComingSoon />`
- [ ] 7.2 Section wrapper owns anchor `#about`; no placement siblings
      required (spec amended — About is primary homepage content for v1)
- [ ] 7.3 (DROPPED) — top-nav integration deferred to a separate Linear issue
- [ ] 7.4 Smoke test all three locales render without layout shift
- [ ] 7.5 Gate `/dev/*` routes from production. Create
      `apps/web/src/app/[locale]/dev/layout.tsx` that calls `notFound()`
      when `process.env.NODE_ENV !== "development"`. Must be in place
      BEFORE pushing the branch so `/dev/about-preview` never ships to
      pavelrapoport.com.

## 8. Accessibility

- [ ] 8.1 Keyboard navigation on timeline strip (tab between squares)
- [ ] 8.2 ARIA labels on all SVG elements
- [ ] 8.3 Semantic `<ol>` + `<article>` for period list
- [ ] 8.4 Run axe-core audit on the section — zero violations
- [ ] 8.5 Test with VoiceOver / NVDA — list reads as coherent narrative

## 9. Close out

- [ ] 9.1 Run `pnpm check-types`
- [ ] 9.2 Run `pnpm build`
- [ ] 9.3 Run `openspec validate --all --strict`
- [ ] 9.4 Open PR, link to Linear issue
- [ ] 9.5 After merge — archive via manual `mv` (CLI quirk with
      date-prefixed names noted in memory)
