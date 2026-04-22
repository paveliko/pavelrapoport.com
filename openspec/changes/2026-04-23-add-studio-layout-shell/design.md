# Design — studio layout shell

## Stack

- Next.js 16 App Router (route groups, server components by default)
- React 19 (`useActionState` for user popover sign-out)
- shadcn/ui `sidebar` component family: `Sidebar`, `SidebarProvider`, `SidebarInset`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarTrigger`
- shadcn primitives already installed in AI-60: `dropdown-menu`, `avatar`, `separator`, `sheet`, `tooltip`, `button`
- Tailwind 4 + brand tokens from `packages/ui/src/styles/globals.css` (sidebar tokens `--sidebar`, `--sidebar-foreground`, `--sidebar-primary` already present)
- lucide-react icons: `LayoutDashboard`, `Inbox`, `FolderKanban`, `CheckSquare`, `DollarSign`, `Settings`, `ChevronsUpDown`, `LogOut`

## Directory layout after this change

```
apps/studio/src/
├── app/
│   ├── layout.tsx                   # root (unchanged): html lang, body, Toaster
│   ├── (auth)/
│   │   ├── layout.tsx               # NEW: centered min-h-screen, no shell
│   │   └── login/                   # MOVED from src/app/login/ (git mv)
│   │       ├── page.tsx
│   │       ├── login-form.tsx
│   │       └── actions.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx               # NEW: SidebarProvider + AppSidebar + SidebarInset(Topbar + children)
│   │   ├── actions.ts               # NEW: signOutAction server action
│   │   ├── page.tsx                 # MOVED from src/app/page.tsx, body rewritten
│   │   ├── inbox/page.tsx           # NEW: "Coming soon" stub
│   │   ├── projects/page.tsx        # NEW
│   │   ├── tasks/page.tsx           # NEW
│   │   ├── costs/page.tsx           # NEW
│   │   └── settings/page.tsx        # NEW
│   ├── auth/callback/route.ts       # UNCHANGED: technical route handler
│   └── middleware.ts                # UNCHANGED (URLs don't change with route groups)
└── components/
    ├── app-sidebar.tsx              # NEW: composes shadcn Sidebar with our nav
    ├── nav-main.tsx                 # NEW: 6 nav entries, active-state highlight
    ├── nav-user.tsx                 # NEW: sidebar footer avatar row + dropdown
    ├── topbar.tsx                   # NEW: trigger + breadcrumbs + sync stub
    └── breadcrumbs.tsx              # NEW: pathname-derived, client component
```

Rationale for `apps/studio/src/components/` rather than `@repo/ui`: these are studio-specific compositions of shadcn primitives, not reusable atomics. If a future app (client portal, public web) needs the same sidebar structure, extract then. YAGNI.

## Route group semantics

- `(auth)` — centered single-column `min-h-screen grid place-items-center bg-canvas`. No sidebar, no topbar. Future auth pages (`/signup`, `/forgot-password`) also land here.
- `(dashboard)` — the shell. Wraps children with `<SidebarProvider>` so shadcn's collapse state reaches every nested page. Every authed page MUST live under this group.

Route groups do NOT affect URLs (`/login` stays `/login`, `/tasks` stays `/tasks`), so middleware's existing `publicRoutes: ["/login", "/auth/callback", "/api/studio/command"]` continues to work unchanged.

## User popover sign-out

`nav-user.tsx`:
- Wraps a `<SidebarMenuButton>` with `<DropdownMenu>` / `<DropdownMenuTrigger>`
- Button row: `<Avatar>` + display name + email + `<ChevronsUpDown>` icon
- Dropdown content: single item "Sign out" with `<LogOut>` icon
- Click → invokes `signOutAction` server action
- Uses `useActionState` for pending state (button disabled while signing out)

User data (email, optional name/avatar) resolved server-side in `(dashboard)/layout.tsx` via `getUser()` from `@repo/auth`, passed down as props. No client-side auth fetch.

## Breadcrumb derivation

`breadcrumbs.tsx`:
- Client component (`"use client"` for `usePathname`)
- Splits pathname on `/`, filters empty, title-cases each segment
- Renders `<nav aria-label="Breadcrumb">` with segments joined by `·`
- Edge cases:
  - `/` → "Dashboard"
  - `/tasks` → "Tasks"
  - `/projects/abc` → "Projects · abc" (raw slug; real-name resolution deferred to the ticket that introduces per-project data)

Pure function of pathname — no route metadata lookup, no data fetching.

## Stub pages contract

Each stub page:
- Server component (no `"use client"`)
- `export const metadata = { title: "..." }`
- Default export async function returning centered block: H1 with page title + "Coming soon" subtitle
- 5-10 lines of JSX total, no data fetching, no business logic

Dashboard is the exception: renders "Welcome back, {display name}" using user from layout. No metric cards in this version.

## State management

- Sidebar collapse: shadcn cookie (built-in)
- User session: resolved server-side per layout render. No context provider.
- No Redux, Zustand, Jotai.

## Theming

Studio inherits brand tokens from `packages/ui/src/styles/globals.css` (shared with web, normalized in AI-61). Sidebar-specific tokens already declared there. No CSS additions needed.

## Error handling

- `(dashboard)/layout.tsx`: if `getUser()` returns null → `redirect("/login?error=session_expired")`. Shouldn't happen because middleware gates this layer, but defense-in-depth.
- Per-page `error.tsx` / `not-found.tsx` deferred to a later ticket — root boundary in `app/layout.tsx` suffices for MVP.

## Risk

- **Route group refactor touches many files** — `git mv` for login dir, `git mv` for page.tsx, creates 10+ new files. Mitigation: explicit file checklist in tasks.md, verification step E2E before push.
- **First-time shadcn sidebar install** — may warn about missing peer deps or ask for config overrides. Task 2 handles.
- **Nav icon choices are taste-driven** — may need second pass after Pavel sees the result. Not worth blocking on pre-review.
