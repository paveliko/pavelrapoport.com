# auth

> Domain security. Every request knows who you are and what you can touch.
> Built in Israel. Cybersecurity in the DNA.

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
       ─── "They're in my network" ───
```

### User Expansion Model

```
User (authenticated)
  └── Profile (always exists)
        ├── Client (if they bring projects)
        │     └── sees: client dashboard, their projects,
        │         invoices, messages
        │
        ├── Network Member (if in Pavel's network)
        │     └── sees: assignments, briefs, deliverables,
        │         group chats
        │
        └── (future roles plug in here)
```

### Access Model: Three Levels

Three nested levels of access control:

```
Platform (role: admin | user)
  └── Organization (org_role: owner | admin | member | viewer)
        └── Project (assigned | not assigned)
```

Access check — three questions in order:
1. Authenticated? → no → login
2. Member of organization? → no → 403
3. Has project access? → owner/admin see all, member/viewer only assigned

### Database Tables

```
organization_members:
  id, organization_id → organizations.id, user_id → profiles.id,
  org_role (owner | admin | member | viewer), joined_at

project_assignments:
  id, project_id → projects.id, user_id → profiles.id
```

### RLS Function: can_access_project(project_id)

Security definer function — single source of truth for project access:
- Platform admin → sees everything
- Org owner/admin → sees all projects in their org
- Org member/viewer → sees only assigned projects
- Not in org → no access

### Network Groups

Network members belong to groups — organized by project,
specialty, or purpose. Groups mirror real communication
channels (Telegram, WhatsApp).

```
Network
  ├── Group: "Dentour Design Team"
  │     └── synced with: Telegram group
  ├── Group: "Legal & Finance"
  │     └── synced with: WhatsApp group
  └── Group: "AI Dev Studio Core"
        └── synced with: Telegram chat
```

---

## Security Architecture

Seven layers of protection, from edge to database.

### Layer 1: Edge (Cloudflare)

First wall — before the request reaches the application.
- DDoS protection (Cloudflare default)
- Rate limiting by IP (login: max 5 attempts/min)
- WAF rules — block SQL injection, XSS in headers
- Bot protection — separate scripts from real users
- Geo-blocking (if needed)

### Layer 2: Transport (HTTPS + Headers)

- TLS everywhere (Cloudflare automatic)
- HSTS header — browser refuses HTTP
- Cookie flags: `Secure`, `HttpOnly`, `SameSite=Lax`
- CORS whitelist: only `pavelrapoport.com`
  and `studio.pavelrapoport.com`
- CSP headers — prevent XSS, restrict script sources

### Layer 3: Authentication (Supabase Auth)

- No passwords stored — magic link, SMS OTP, WhatsApp OTP
- JWT with short TTL — access token 1 hour, refresh 7 days
- Refresh token rotation — each refresh issues new token
- Never use `user_metadata` in RLS policies — users can
  modify it
- Auth events logged — sign in, sign out, password reset

### Layer 4: Middleware (@rapoport/auth)

- Route protection — every route checked before render
- Role check — admin/user at middleware level
- Domain role check — client/network after base auth
- CSRF protection — origin header verification
- Input validation — zod schemas on every API endpoint
- Output sanitization — strip sensitive fields by role

### Layer 5: Row-Level Security (Supabase RLS)

Last line of defense. Even if all above fails, data
doesn't leak.
- RLS enabled on EVERY table in public schema, no exceptions
- Indexes on all RLS-referenced columns (100x performance)
- `TO authenticated` on all policies — never rely on
  `auth.uid()` alone to block anon
- Security definer functions for complex join checks
- Separate policies per operation: SELECT, INSERT, UPDATE,
  DELETE — never `FOR ALL`
- Tested with anon/user/admin roles in CI

### Layer 6: Secrets Management

- `anon_key` — safe on client, RLS protects
- `service_role_key` — NEVER in client code, server only,
  bypasses RLS
- All integration API tokens encrypted at rest
- Environment separation — different keys for dev/staging/prod
- Key rotation schedule — periodic rotation, revoke on
  compromise
- Lint rule: no service key imports in `apps/`

### Layer 7: Storage Security (Supabase Storage)

- No uploads without RLS policies (Supabase default)
- RLS on storage.objects — who can upload, to which paths
- User files isolated by user_id folder structure
- File type validation — reject unexpected formats
- Size limits per upload

### Risk Matrix

| Risk | Likelihood | Prevention |
|------|-----------|------------|
| Missing RLS on table | High | CI: all public tables have RLS |
| service_role key leaked to client | Medium | Lint rule in CI |
| SQL injection | Low (Supabase parameterizes) | Zod + WAF |
| Session hijacking | Low | HttpOnly + Secure + HSTS + short JWT |
| Login brute force | Medium | Cloudflare rate limit (5/min) |
| Anon sees private data | High without RLS | RLS + test suite |
| Integration key compromise | Medium | Encryption + rotation + audit |
| XSS attack | Medium | CSP headers + input sanitization |
| CSRF attack | Low | Origin verification + SameSite cookie |

---

## Requirements

### Requirement: Auth Methods

The system SHALL support three authentication methods
via Supabase Auth.

#### Scenario: Email login
- **WHEN** a user enters their email
- **THEN** the system sends a magic link
- **AND** clicking the link creates a session

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
- **THEN** default order: Email → WhatsApp → SMS

---

### Requirement: Roles

The system SHALL support two platform-level roles and
four organization-level roles.

Platform roles (`profiles.role`):
- `admin` — platform-wide access (Pavel)
- `user` — default, scoped by org membership

Organization roles (`organization_members.org_role`):
- `owner` — full access, billing, delete org
- `admin` — manage projects and members
- `member` — work on assigned projects
- `viewer` — read-only on assigned projects

#### Scenario: Admin role
- **WHEN** Pavel authenticates
- **THEN** platform role is `admin`, full access everywhere

#### Scenario: User role
- **WHEN** anyone else registers
- **THEN** platform role is `user`, access scoped by org membership

#### Scenario: Anonymous visitor
- **GIVEN** no login
- **THEN** sees public web content + AI chat only

#### Scenario: Org role determines project access
- **GIVEN** user is member of an organization
- **THEN** org owner/admin sees all org projects
- **AND** org member/viewer sees only assigned projects

---

### Requirement: Access by Domain Role

The system SHALL determine visibility based on domain
role (client, network member, or both).

#### Scenario: Client access
- **GIVEN** user has client profile
- **THEN** sees client dashboard, their projects, invoices, messages

#### Scenario: Network member access
- **GIVEN** user has network member profile
- **THEN** sees assignments, briefs, deliverables, group chats

#### Scenario: Dual role
- **GIVEN** user is both client and network member
- **THEN** sees both views, data separated

---

### Requirement: Profile Auto-Creation

The system SHALL auto-create a profile on first login.

#### Scenario: New registration
- **WHEN** new user completes first authentication
- **THEN** DB trigger creates `public.profiles` row
- **AND** `profiles.id = auth.users.id`
- **AND** role = `user`

#### Scenario: Admin seeding
- **GIVEN** Pavel's account
- **THEN** role = `admin` via seed migration

---

### Requirement: Multi-Domain Sessions

The system SHALL maintain a single session across both
subdomains.

#### Scenario: Cross-subdomain auth
- **WHEN** user logs in on either subdomain
- **THEN** cookie set on `.pavelrapoport.com`
- **AND** both subdomains share the session

#### Scenario: Token refresh
- **WHEN** access token expires
- **THEN** refresh token renews transparently

---

### Requirement: Login Flow

The system SHALL handle the complete login lifecycle.

#### Scenario: Login from protected page
- **WHEN** unauthenticated user hits protected route
- **THEN** redirect to login, store original URL
- **AND** after login, redirect back

#### Scenario: Post-login redirect defaults
- **GIVEN** no stored redirect URL
- **THEN** admin → /studio
- **AND** client → client dashboard
- **AND** network member → assignments
- **AND** user with no profile → /

---

### Requirement: Logout Flow

The system SHALL handle logout across both domains.

#### Scenario: Logout
- **WHEN** user clicks logout anywhere
- **THEN** session destroyed on Supabase
- **AND** cookie cleared on `.pavelrapoport.com`
- **AND** both apps lose session
- **AND** redirect to pavelrapoport.com

---

### Requirement: Email Flows

The system SHALL handle transactional auth emails via
Supabase.

#### Scenario: Magic link
- **WHEN** user requests magic link
- **THEN** Supabase sends email, link expires in 1 hour

#### Scenario: Password reset
- **WHEN** user requests reset
- **THEN** reset email sent, after reset auto-login

#### Scenario: Email change
- **WHEN** user changes email
- **THEN** confirmation sent to new address, updates after click

---

### Requirement: Route Protection

The system SHALL enforce access control on every route
via middleware.

#### Scenario: Admin-only route
- **WHEN** non-admin hits /studio/finance → denied

#### Scenario: Auth-required route
- **WHEN** anon hits protected route → redirect to login

#### Scenario: Public route
- **WHEN** anyone hits /, /blog/* → allowed

#### Scenario: Org-scoped route
- **WHEN** user hits /studio/projects
- **THEN** middleware checks current org context
- **AND** only shows projects from the active organization

#### Scenario: No org membership
- **WHEN** authenticated user has no org membership
- **THEN** they see only their personal org content

---

### Requirement: Row-Level Security

The system SHALL use Supabase RLS policies to enforce
data access at the database level.

#### Scenario: Data isolation
- **WHEN** user queries any table
- **THEN** admin sees all, users see only their linked rows

#### Scenario: RLS as fallback
- **GIVEN** a middleware bug
- **THEN** RLS still blocks unauthorized access

---

### Requirement: Session Expiry

The system SHALL handle expired sessions gracefully.

#### Scenario: Active session expires
- **WHEN** session expires during use
- **THEN** non-blocking notification: "Session expired"
- **AND** re-login without losing page context

---

### Requirement: Audit Trail

The system SHALL log all security-relevant events.

#### Scenario: Security event logging
- **WHEN** any auth event occurs (login, logout, role change,
  failed attempt, password reset)
- **THEN** the event is logged with timestamp, user_id,
  IP, action, success/failure

## Package: @rapoport/auth

All auth logic lives here. Apps import, never implement.

### Exports

**Hooks:**
- `useAuth()` → { user, profile, role, isAdmin, isLoading }
- `useRequireAuth(role?)` → redirect if not authorized
- `useSession()` → { session, refresh, signOut }
- `useDomainRole()` → { isClient, isNetworkMember, groups }
- `useOrganization()` → { org, orgRole, switchOrg }
- `useOrgPermission(permission)` → boolean
- `useOrganizations()` → [{ org, role }]

**Middleware:**
- `withAuth(handler)` → check session, inject user + profile
- `withRole(role, handler)` → check role after auth
- `authMiddleware(config)` → Next.js middleware for routes

**Server:**
- `getServerSession(cookies)` → session from cookies
- `getServerUser(cookies)` → user + profile + domain roles
- `validateSession(token)` → verify + refresh if needed
- `getServerOrgRole(cookies, orgId)` → org_role
- `canAccessProject(userId, projectId)` → boolean

**Security:**
- `validateInput(schema, data)` → zod validation
- `sanitizeOutput(data, role)` → strip sensitive fields
- `auditLog(action, userId, detail)` → security event log

**Config:**
- `AUTH_ROUTES` → public / auth-required / admin-only map
- `COOKIE_DOMAIN` → `.pavelrapoport.com`
- `REDIRECT_DEFAULTS` → { admin, client, network, user }
- `ORG_PERMISSIONS` → map of org_role to allowed actions

### What is NOT in @rapoport/auth

- **Login UI** — forms live in `@rapoport/ui`
- **Page layouts** — login page layout lives in the app
- **Business logic** — domain-level permissions are domain logic

## Entities

- **User** — Supabase auth.users (system-managed)
- **Profile** — our extension: id, display_name, avatar_url,
  locale, role, created_at
- **Session** — access_token, refresh_token, expires_at
- **Role** — `admin` or `user` (stored in profiles)
- **OrganizationMember** — user's membership in an org.
  Has: id, organization_id, user_id, org_role, joined_at
- **ProjectAssignment** — user assigned to a project.
  Has: id, project_id, user_id
- **AuditEvent** — timestamp, user_id, ip, action, success

## Dependencies

- All domains depend on `auth`
- `organizations` — org membership determines access scope
- `network` — network member profile extends User
- `integrations` — WhatsApp Business API for WhatsApp login
- `@rapoport/ui` — auth form components
- `@rapoport/db` — Supabase client, triggers, RLS policies
