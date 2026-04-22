# Tasks

## 1. Create OpenSpec change folder (10 min)

Create `openspec/changes/2026-04-23-add-studio-layout-shell/` with all 5 files using verbatim content pasted by Pavel. No improvisation on content.

Commit: `docs(studio): add OpenSpec change for layout shell (AI-65)`

## 2. Install shadcn sidebar + verify tokens (10 min)

```bash
cd packages/ui
pnpm dlx shadcn@latest add sidebar
```

Verify generated files land under `packages/ui/src/components/ui/sidebar.tsx` and the component exports through `@repo/ui`. Grep `packages/ui/src/styles/globals.css` for `--sidebar` — tokens should already exist from AI-60; if missing, add them per shadcn docs.

Do NOT re-install `sheet` or `tooltip` — already present from AI-60.

Run `pnpm --filter @repo/ui typecheck`.

Commit: `feat(ui): add shadcn sidebar component (AI-65)`

## 3. Move login to (auth) route group (15 min)

```bash
cd apps/studio/src/app
mkdir -p "(auth)"
git mv login "(auth)/login"
```

Create `apps/studio/src/app/(auth)/layout.tsx`:

```tsx
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-canvas">
      {children}
    </div>
  );
}
```

Start `pnpm --filter @repo/studio dev`, navigate to `/login`, confirm it renders (URL unchanged), magic link + Google button still work.

Commit: `refactor(studio): move login to (auth) route group (AI-65)`

## 4. Create (dashboard) layout + components + server action + dashboard landing (30 min)

Steps:

1. `git mv apps/studio/src/app/page.tsx apps/studio/src/app/(dashboard)/page.tsx`, rewrite body to render "Welcome back, {display name}"
2. Create `apps/studio/src/app/(dashboard)/layout.tsx`:
   - Server component
   - Resolve `user` via `getUser()` from `@repo/auth`
   - If no user → `redirect("/login?error=session_expired")`
   - Wrap children with `<SidebarProvider>` + `<AppSidebar user={user} />` + `<SidebarInset>` containing `<Topbar />` and `{children}`
3. Create `apps/studio/src/app/(dashboard)/actions.ts`:
   ```ts
   "use server";
   import { signOut } from "@repo/auth";
   import { redirect } from "next/navigation";
   export async function signOutAction() {
     await signOut();
     redirect("/login");
   }
   ```
4. Create `apps/studio/src/components/app-sidebar.tsx` — wraps shadcn `<Sidebar collapsible="offcanvas">` with `<SidebarHeader>` (studio name), `<SidebarContent>` (NavMain), `<SidebarFooter>` (NavUser)
5. Create `apps/studio/src/components/nav-main.tsx` — client component; 6 entries with href/icon/label; `usePathname()` for `isActive` highlight
6. Create `apps/studio/src/components/nav-user.tsx` — client component; `<DropdownMenu>` wrapping `<SidebarMenuButton>` with avatar + name + email + `<ChevronsUpDown>`; dropdown item "Sign out" with `useActionState` calling `signOutAction`
7. Create `apps/studio/src/components/topbar.tsx` — server component; `<SidebarTrigger />` + `<Breadcrumbs />` + sync status stub ("Not connected"); `h-12 border-b border-ink/10`
8. Create `apps/studio/src/components/breadcrumbs.tsx` — client component; reads `usePathname`; title-cases segments; joins with `·`; `/` → "Dashboard"

Commit: `feat(studio): add (dashboard) layout with sidebar and topbar (AI-65)`

## 5. Create five stub pages (15 min)

Create each as server component with H1 + "Coming soon" + `metadata.title`:

- `(dashboard)/inbox/page.tsx` — "Inbox"
- `(dashboard)/projects/page.tsx` — "Projects"
- `(dashboard)/tasks/page.tsx` — "Tasks"
- `(dashboard)/costs/page.tsx` — "Costs"
- `(dashboard)/settings/page.tsx` — "Settings"

Each 5-10 lines JSX. No data fetching.

Commit: `feat(studio): add five stub pages under dashboard shell (AI-65)`

## 6. Build gate (no commit, 5 min)

Run all:

```bash
pnpm --filter @repo/ui typecheck
pnpm --filter @repo/studio typecheck
pnpm --filter @repo/studio lint
pnpm --filter @repo/studio build
```

All must pass. Fix squashes into the touching commit (rebase if needed).

## 7. Local E2E verification (no commit, 15 min) — STOP, show Pavel

`pnpm --filter @repo/studio dev` on port 3001. Walk the 8 E2E steps:

1. `/` unauthenticated → `/login`
2. Google login → land on `/` with full shell
3. All 6 nav entries render correctly
4. Active route highlight works
5. Avatar row → dropdown → Sign out → `/login`
6. Sidebar collapse persists across reload (cookie)
7. Mobile width → offcanvas drawer behavior
8. Breadcrumb correct for `/`, `/tasks`, `/projects/abc`

Capture screenshots (light + dark mode via DevTools Rendering panel). Share with Pavel. WAIT for approval before Task 8.

## 8. Push + open PR (no commit, 5 min)

After Pavel approves:

```bash
git push -u origin feature/ai-65-studio-layout-shell
gh pr create --base main \
  --title "feat(studio): layout shell with sidebar, topbar, six stub pages (AI-65)" \
  --body "..."
```

PR body: summary + verification checklist from Task 7 + ref to AI-65 / AI-60 / AI-61 / AI-62. Share URL.
