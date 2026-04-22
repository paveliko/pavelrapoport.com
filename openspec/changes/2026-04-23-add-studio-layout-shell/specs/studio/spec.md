# Spec diff — studio

## ADD: Requirement: Dashboard Layout Shell

The studio authenticated workspace SHALL render a consistent shell — left sidebar navigation, top breadcrumb/status bar, and main content area — around every authenticated page.

### Scenario: Route group separation
- **GIVEN** a request to `/login` or `/auth/callback`
- **THEN** the (auth) route group layout renders (centered, no shell)
- **AND** a request to any other authenticated route renders under the (dashboard) group layout (sidebar + topbar + main)

### Scenario: Unauthenticated dashboard request
- **GIVEN** a user with no Supabase session
- **WHEN** they request any (dashboard) route
- **THEN** `apps/studio/src/middleware.ts` redirects to `/login` before the layout renders

### Scenario: Authenticated dashboard request
- **GIVEN** a user with a valid whitelisted session
- **WHEN** they request any (dashboard) route
- **THEN** `(dashboard)/layout.tsx` resolves `user` via `getUser()` from `@repo/auth`
- **AND** renders the SidebarProvider shell with user props passed to NavUser
- **AND** if `getUser()` returns null, the layout redirects to `/login?error=session_expired`

## ADD: Requirement: Primary Navigation

The sidebar SHALL expose six top-level navigation entries in this order: Dashboard, Inbox, Projects, Tasks, Costs, Settings.

### Scenario: Current route highlight
- **GIVEN** the user is on `/tasks`
- **THEN** the "Tasks" sidebar entry renders with the active state
- **AND** all other entries render in inactive state

### Scenario: Sidebar collapse persistence
- **GIVEN** the user collapses the sidebar via the trigger
- **THEN** shadcn stores the collapsed state in a cookie
- **AND** subsequent page loads preserve the collapsed state

### Scenario: Mobile drawer
- **GIVEN** a viewport width below the sidebar breakpoint
- **THEN** the sidebar renders as an offcanvas drawer, triggered by the topbar menu button

## ADD: Requirement: User Menu

The sidebar footer SHALL display the current user's identity and provide a sign-out action.

### Scenario: User identity display
- **GIVEN** a user is signed in
- **THEN** the sidebar footer shows avatar + display name + email as an always-visible row

### Scenario: Sign out action
- **WHEN** the user clicks the footer row and selects "Sign out"
- **THEN** the server action `signOutAction` calls `signOut()` from `@repo/auth` and redirects to `/login`
- **AND** the Supabase session cookie is cleared for `.pavelrapoport.com`

## ADD: Requirement: Breadcrumb

The topbar SHALL display a breadcrumb derived from the current pathname.

### Scenario: Root path
- **GIVEN** the user is on `/`
- **THEN** the breadcrumb renders "Dashboard"

### Scenario: Single-segment path
- **GIVEN** the user is on `/tasks`
- **THEN** the breadcrumb renders "Tasks"

### Scenario: Nested path
- **GIVEN** the user is on `/projects/abc`
- **THEN** the breadcrumb renders "Projects · abc" using raw path segments
- **AND** slug-to-name resolution is deferred to the ticket that introduces per-project data

## ADD: Requirement: Stub Pages

Until their owning tickets ship real content, the six primary pages SHALL each render a minimal "Coming soon" placeholder under the dashboard shell.

### Scenario: Stub page render
- **GIVEN** a user on `/inbox`, `/projects`, `/tasks`, `/costs`, or `/settings`
- **THEN** the page renders a server component with an H1 title and a "Coming soon" line
- **AND** no data fetching or business logic executes

### Scenario: Dashboard landing
- **GIVEN** a user on `/`
- **THEN** the Dashboard page renders "Welcome back, {display name}"
- **AND** no metric cards, charts, or data are shown in this version
