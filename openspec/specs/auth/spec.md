# auth

> Domain security. Every request knows who you are and what you can touch.

## Purpose

**For whom:** Everyone who interacts with the platform —
Pavel (admin), registered users, anonymous visitors.

**Why it exists:** Two apps on two subdomains share one
identity system. Auth must work seamlessly across
pavelrapoport.com and studio.pavelrapoport.com with a
single session. All auth logic — hooks, guards, middleware,
redirects — lives in `@rapoport/auth`. No auth code in apps.

## Data Architecture

Three layers. Each layer expands what we know about a person.

```
Layer 1: auth.users (Supabase, system-managed)
│  id (UUID), email, phone, encrypted_password,
│  last_sign_in, email_confirmed_at
│  ─── We don't touch this directly ───
│
├──► Layer 2: public.profiles (our table, 1:1 with auth.users)
│      id (= auth.users.id)
│      display_name, avatar_url, locale
│      role (admin | user)
│      created_at, updated_at
│      ─── Created automatically via DB trigger ───
│
├──► Layer 3a: public.clients (0 or 1 per profile)
│      id, user_id → profiles.id
│      company, source, status, fit_score, budget_range
│      ─── "This person pays me" ───
│
└──► Layer 3b: public.network_members (0 or 1 per profile)
       id, user_id → profiles.id
       specialty, rate, availability
       ─── "I pay this person / they're in my network" ───
```

One person = one User = one Profile.
But they can be a client AND a network member simultaneously.
A designer from the network brings their own project → now also a client.

### User Expansion Model

The profile extends into domain tables as the person's
relationship with the platform grows:

```
User (authenticated)
  └── Profile (always exists)
        ├── Client (if they bring projects)
        │     └── sees: client dashboard, their projects,
        │         invoices, messages with Pavel
        │
        ├── Network Member (if they're in Pavel's network)
        │     └── sees: their assignments, briefs,
        │         deliverables, group chats
        │
        └── (future roles plug in here)
```

### Network Groups

Network members can belong to groups — organized by project,
specialty, or purpose. Groups mirror real-world communication
channels (Telegram groups, WhatsApp chats).

```
Network
  ├── Group: "Dentour Design Team"
  │     ├── Member: illustrator
  │     ├── Member: 3D artist
  │     └── synced with: Telegram group
  │
  ├── Group: "Legal & Finance"
  │     ├── Member: lawyer
  │     ├── Member: accountant
  │     └── synced with: WhatsApp group
  │
  └── Group: "AI Dev Studio Core"
        ├── Member: Sergey (legacy migrations)
        └── synced with: Telegram chat
```

## Requirements

### Requirement: Auth Methods

The system SHALL support three authentication methods
via Supabase Auth.

#### Scenario: Email login
- **WHEN** a user enters their email
- **THEN** the system sends a magic link to that email
- **AND** clicking the link creates a session
- **AND** no password is required

#### Scenario: SMS login
- **WHEN** a user enters their phone number
- **THEN** the system sends an OTP via SMS
- **AND** entering the correct code creates a session

#### Scenario: WhatsApp login
- **WHEN** a user chooses WhatsApp login
- **THEN** the system sends an OTP via WhatsApp Business API
- **AND** entering the correct code creates a session

#### Scenario: Auth method priority
- **GIVEN** all three methods are available
- **THEN** the default UI order is: Email → WhatsApp → SMS
- **AND** the user can switch between methods freely

---

### Requirement: Roles

The system SHALL support two base roles at launch.

#### Scenario: Admin role
- **GIVEN** Pavel is the only admin
- **WHEN** Pavel authenticates
- **THEN** he has full access to all domains, all projects,
  all data across both apps
- **AND** his role is `admin`

#### Scenario: User role
- **GIVEN** a person registers on the platform
- **WHEN** they authenticate
- **THEN** they have role `user`
- **AND** they see only what is explicitly shared with them

#### Scenario: Anonymous visitor
- **GIVEN** a person visits without logging in
- **THEN** they see only public content on web (landing, blog)
- **AND** they cannot access studio
- **AND** they can interact with the AI chat on the public site

---

### Requirement: Access Levels by Domain Role

The system SHALL determine what a user sees based on
their domain role (client, network member, or both).

#### Scenario: Client access
- **GIVEN** a user has a client profile
- **WHEN** they log in
- **THEN** they see a client dashboard (not studio)
- **AND** they see their projects, invoices, messages with Pavel
- **AND** they cannot see other clients or internal data

#### Scenario: Network member access
- **GIVEN** a user has a network member profile
- **WHEN** they log in
- **THEN** they see their assignments, briefs, deliverables
- **AND** they see group chats they belong to
- **AND** they cannot see client data or finances

#### Scenario: Dual role access
- **GIVEN** a user is both client and network member
- **WHEN** they log in
- **THEN** they see both: their client projects and their
  network assignments
- **AND** data is separated — client view vs network view

---

### Requirement: Profile Creation

The system SHALL auto-create a profile when a user registers.

#### Scenario: New user registration
- **WHEN** a new user completes authentication for the first time
- **THEN** a DB trigger creates a row in `public.profiles`
- **AND** `profiles.id` = `auth.users.id`
- **AND** role is set to `user`
- **AND** display_name is derived from email or phone

#### Scenario: Admin seeding
- **GIVEN** Pavel's account exists
- **THEN** his profile has role `admin`
- **AND** this is set via seed migration, not UI

---

### Requirement: Multi-Domain Sessions

The system SHALL maintain a single auth session across
both subdomains.

#### Scenario: Cross-subdomain auth
- **WHEN** a user logs in on either subdomain
- **THEN** the cookie is set on `.pavelrapoport.com`
- **AND** both pavelrapoport.com and studio.pavelrapoport.com
  share the session

#### Scenario: Token refresh
- **WHEN** the access token expires
- **THEN** the refresh token renews it transparently
- **AND** both apps receive the new token

---

### Requirement: Login Flow

The system SHALL handle the complete login lifecycle.

#### Scenario: Login from protected page
- **WHEN** an unauthenticated user navigates to a protected route
- **THEN** they are redirected to login
- **AND** the original URL is stored as `redirect_url`
- **AND** after login, they are redirected back

#### Scenario: Post-login redirect
- **GIVEN** no `redirect_url` is stored
- **THEN** admin → /studio
- **AND** user with client profile → client dashboard
- **AND** user with network profile → network dashboard
- **AND** user with no domain profile → /

---

### Requirement: Logout Flow

The system SHALL handle logout across both domains.

#### Scenario: Logout
- **WHEN** a user clicks logout on any app
- **THEN** the session is destroyed on Supabase
- **AND** the cookie is cleared on `.pavelrapoport.com`
- **AND** both apps lose the session simultaneously
- **AND** the user is redirected to pavelrapoport.com

---

### Requirement: Email Flows

The system SHALL handle transactional auth emails
via Supabase (templates configured in dashboard).

#### Scenario: Magic link email
- **WHEN** user requests magic link login
- **THEN** Supabase sends email with login link
- **AND** link expires after 1 hour

#### Scenario: Password reset
- **WHEN** user requests password reset
- **THEN** Supabase sends reset email
- **AND** link opens a reset form
- **AND** after reset, user is logged in automatically

#### Scenario: Email change confirmation
- **WHEN** user changes their email in profile
- **THEN** Supabase sends confirmation to new email
- **AND** email updates only after confirmation

#### Scenario: Signup confirmation
- **WHEN** a new user registers via email
- **THEN** Supabase sends confirmation email
- **AND** account activates after confirmation

---

### Requirement: Route Protection

The system SHALL enforce access control on every route
via middleware.

#### Scenario: Admin-only route
- **WHEN** a non-admin navigates to /studio/finance
- **THEN** access is denied, redirect to allowed area

#### Scenario: Authenticated-only route
- **WHEN** an anonymous visitor navigates to any protected route
- **THEN** they are redirected to login

#### Scenario: Public route
- **WHEN** anyone navigates to /, /blog, /blog/[slug]
- **THEN** access is granted regardless of auth status

---

### Requirement: Row-Level Security

The system SHALL use Supabase RLS policies to enforce
data access at the database level.

#### Scenario: Data isolation
- **WHEN** a user queries any table
- **THEN** admin sees all rows
- **AND** users see only rows linked to their profile
- **AND** RLS is the last line of defense — even if middleware
  fails, data doesn't leak

---

### Requirement: Session Expiry

The system SHALL handle expired sessions gracefully.

#### Scenario: Active user session expires
- **WHEN** a session expires while the user is on a page
- **THEN** show a non-blocking notification: "Session expired"
- **AND** offer re-login without losing page context

## Package: @rapoport/auth

All auth logic lives here. Apps import hooks and middleware,
never implement auth themselves.

### Exports

**Hooks:**
- `useAuth()` → { user, profile, role, isAdmin, isLoading }
- `useRequireAuth(role?)` → redirects if not authenticated/authorized
- `useSession()` → { session, refresh, signOut }
- `useDomainRole()` → { isClient, isNetworkMember, groups }

**Middleware:**
- `withAuth(handler)` → checks session, injects user + profile
- `withRole(role, handler)` → checks role after auth
- `authMiddleware(config)` → Next.js middleware for route protection

**Server:**
- `getServerSession(cookies)` → session from request cookies
- `getServerUser(cookies)` → user + profile + domain roles
- `validateSession(token)` → verify + refresh if needed

**Config:**
- `AUTH_ROUTES` → map of public / auth-required / admin-only routes
- `COOKIE_DOMAIN` → `.pavelrapoport.com`
- `REDIRECT_DEFAULTS` → { admin: '/studio', client: '/dashboard', network: '/assignments', user: '/' }

### What is NOT in @rapoport/auth

- **Login/registration UI** — forms, inputs, buttons live in `@rapoport/ui`
- **Page-level layouts** — login page layout lives in the app
- **Business logic** — what a user can do after auth is domain logic

## Entities

- **User** — Supabase auth.users record (system-managed)
- **Profile** — our extension of User. Has: id (= auth.users.id),
  display_name, avatar_url, locale, role, created_at
- **Session** — active auth session. Has: access_token,
  refresh_token, expires_at
- **Role** — `admin` or `user`. Stored in profiles table

## Dependencies

- All domains depend on `auth` for access control
- `clients` — client profile extends User
- `network` — network member profile extends User
- `integrations` — WhatsApp Business API for WhatsApp login
- `@rapoport/ui` — auth form components
- `@rapoport/db` — Supabase client, triggers, RLS policies
