# Add studio layout shell

## Why

`apps/studio` currently ships a working login + middleware + Google OAuth flow (AI-62). But after authentication, the user lands on a bare `requireAdmin()` stub at `apps/studio/src/app/page.tsx`. Every subsequent studio ticket — Tasks view, Projects view, Inbox, Costs, Settings — needs the same wrapper: sidebar, topbar, user menu, route group separating authed from public pages. Building that wrapper per-page is wrong. This change builds it once.

## What

1. **Route groups** — introduce `(auth)` and `(dashboard)` groups under `apps/studio/src/app/`. Move the existing `login/` folder into `(auth)/` with a minimal centered layout. All authenticated pages live under `(dashboard)/` with the full shell layout.
2. **shadcn Sidebar** — add the official shadcn `sidebar` component via `pnpm dlx shadcn@latest add sidebar` into `@repo/ui`. Wire it as the primary left nav with 6 entries: Dashboard, Inbox, Projects, Tasks, Costs, Settings. shadcn handles collapsed-state cookie and mobile drawer. `sheet` and `tooltip` primitives are already present in `@repo/ui` from AI-60; this change does not re-install them.
3. **Sidebar footer user block** — `<SidebarFooter>` contains an always-visible row: avatar + display name + email. Click opens a dropdown with a single "Sign out" action that calls a new server action wrapping `signOut()` from `@repo/auth`.
4. **Topbar** — thin strip above main content. Left: `<SidebarTrigger />` + auto-derived breadcrumb from pathname. Right: placeholder sync status text (stub until Linear sync lands).
5. **Six stub pages** — Dashboard (`/`), Inbox, Projects, Tasks, Costs, Settings. Dashboard is a minimal "Welcome back, {name}" landing. Inbox / Projects / Tasks / Costs / Settings are one-liner placeholders with H1 + "Coming soon". No business logic.
6. **`auth/callback/route.ts` stays where it is** — technical route handler, not a UI page, not under `(auth)` group.

## Non-goals

- Login page visual redesign / branding polish — separate future ticket.
- Real content in any stub page — Dashboard metric cards, Tasks table, Projects list all land in their own tickets.
- Linear sync status logic in topbar — stub text only.
- Role-based nav hiding — every authed user sees all 6 links. Role-gated rendering lands with the client portal / `profiles.role` work.
- Dark mode toggle in user popover — OS preference already handled by the existing theme system; explicit toggle deferred.
- Mobile-first polish — shadcn defaults are enough for MVP. Breakpoint tuning deferred.
- Per-page `error.tsx` / `not-found.tsx` — root boundary in `app/layout.tsx` is sufficient for now.

## Affected domains

- `studio` — primary. New spec content on layout shell, nav structure, user menu behavior, breadcrumb derivation, stub page contract.
- `ui` (package `@repo/ui`) — adds shadcn `sidebar` component files plus minor lucide-react icon imports. No API changes to existing exports.

## Dependencies

- `@repo/ui` — shadcn base installed in AI-60. `dropdown-menu`, `avatar`, `separator`, `sheet`, `tooltip`, `button` already present. Only `sidebar` is added here.
- `@repo/auth` — no changes. Existing `getUser()`, `signOut()`, `requireAdmin()` wired into layout and user popover.
- No new npm deps beyond what `shadcn add sidebar` installs.
- No DB changes. No env var changes.

## Rollout

Ships in one PR. On merge, authenticated users see the shell immediately; sidebar fully navigable; stub pages all render "Coming soon". Next ticket (Tasks screen) replaces `/tasks/page.tsx` body with real content, inheriting the shell. Future tickets follow the same pattern.
