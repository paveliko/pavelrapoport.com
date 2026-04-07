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
- WAF rules — block SQL injection, XSS in headers
- Bot protection — separate scripts from real users
- Geo-blocking (if needed)

**Rate limits per endpoint category:**

```
Auth endpoints:
  POST /auth/login         → 5 req/min per IP
  POST /auth/otp           → 3 req/min per IP
  POST /auth/reset         → 3 req/min per IP

AI endpoints:
  POST /canvas/sessions    → 5 sessions/hour per IP
  POST /canvas/*/message   → 30 req/min per session
  POST /muse/*             → 10 req/min per user (authenticated)

Webhook receivers:
  POST /webhooks/*         → 100 req/min per source IP

API (authenticated):
  GET  /api/*              → 120 req/min per user
  POST /api/*              → 60 req/min per user
  File uploads             → 10 req/min per user, 50MB max

Public:
  GET  /* (pages)          → no limit (Cloudflare cache)
  GET  /s/* (shared maps)  → 60 req/min per IP
```

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

**Anon role default: zero access.**
```sql
-- Every new table starts locked. No implicit SELECT.
-- Anon can only access explicitly whitelisted tables:

-- Public read (anon allowed):
--   blog_posts (WHERE status = 'published')
--   case_studies (WHERE status = 'published')
--   pages (WHERE status = 'published')
--   canvas_sessions (INSERT only — start new session)

-- Everything else: authenticated only.
-- CI test: query every table as anon → expect 0 rows
--   unless table is in the whitelist above.
```

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

**Malware scanning:**
```
Upload flow:
  1. Client uploads to Supabase Storage (temp bucket)
  2. Database trigger fires on INSERT to storage.objects
  3. Edge function picks up file → scans via ClamAV
     (self-hosted on Railway, or Cloudflare R2 scanner)
  4. Clean → move to permanent bucket, mark status = 'clean'
  5. Infected → delete file, log event, notify admin
  6. Timeout (>30s) → quarantine, manual review

Allowed file types (whitelist):
  Images: jpg, jpeg, png, gif, webp, svg
  Documents: pdf, md, txt
  Design: fig, sketch (pass-through, no scan)
  Max size: 50MB per file, 200MB per session

Blocked by extension (before upload reaches storage):
  Executables: exe, bat, sh, cmd, ps1, msi
  Archives: zip, rar, tar.gz (unless explicitly enabled per project)
  Scripts: js, ts, py, rb, php
```

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
| Data loss (no backup) | Medium | PITR + daily backups + restore procedure |

### Layer 8: Backup & Disaster Recovery

Last line of defense — when everything else fails.

**Recovery targets:**

```
RPO (max data loss):   1 hour
  → Supabase Pro: point-in-time recovery (PITR)
  → Every change is recoverable up to 1 hour back

RTO (max downtime):    4 hours
  → From "we noticed the problem" to "everything works"
  → Includes: assess damage, restore, verify, re-deploy
```

**What is backed up:**

```
Supabase PostgreSQL:
  → PITR enabled (Supabase Pro plan, automatic)
  → Daily logical backup (pg_dump) to separate storage
  → Retain: 7 daily + 4 weekly + 3 monthly

Supabase Storage:
  → Files replicated by Supabase (S3-compatible)
  → Critical files (contracts, NDA): copy to Cloudflare R2

Secrets:
  → Documented in secrets-registry.md
  → If Supabase is compromised: rotate all keys from registry

Code:
  → Git is the backup. GitHub retains all history.
  → OpenSpec files are in the repo.
```

**Disaster scenarios:**

```
Scenario: Accidental table deletion
  → Restore from PITR to point before deletion
  → Verify data integrity
  → Time: < 1 hour

Scenario: Supabase outage
  → Platform shows "maintenance mode" page (Cloudflare)
  → Wait for Supabase recovery
  → Verify data, resume
  → Time: depends on Supabase (typically < 2 hours)

Scenario: Compromised admin account
  → Revoke all sessions (Supabase dashboard)
  → Rotate all secrets from registry
  → Audit log review: what was accessed/changed
  → Restore data if modified
  → Time: 2-4 hours

Scenario: Full data loss (worst case)
  → Restore PostgreSQL from latest daily backup
  → Restore files from Cloudflare R2 copy
  → Re-deploy apps from Git
  → Accept: up to 24 hours of data loss
  → Time: 4-8 hours
```

**Monthly drill:**

```
Every month, verify:
  □ PITR is enabled and working (Supabase dashboard)
  □ Daily backup ran successfully
  □ Restore test: restore to a test project, verify row count
  □ Secrets registry matches actual deployed secrets
```

### Layer 9: Privacy & Data Protection

Applies to: GDPR (EU clients), Israeli Privacy Protection
Law (5741-1981), and general data ethics.

**What personal data we store:**

```
profiles:          display_name, avatar_url, locale
clients:           company, source, budget_range, fit_score
network_members:   specialty, rate, availability
canvas_sessions:   messages (conversation text), domain_graph
auth.users:        email, phone (Supabase-managed)
activity_log:      user_id, IP address, action
invoices:          client name, amounts, bank details
contracts:         signed documents with names
```

**Data retention policy:**

```
Active data:       retained while account/project is active
Completed projects: retained 2 years after completion,
                    then archived (not deleted)
Deleted accounts:  personal data removed within 30 days
                    of deletion request
Canvas sessions:   anonymous sessions: 90 days
                   accepted sessions: follows project lifecycle
Audit logs:        retained 3 years (legal requirement)
Backups:           follow retention schedule (7 daily,
                   4 weekly, 3 monthly)
```

**User rights (GDPR Articles 15-20):**

```
Right to access:
  → User can request: "What data do you have on me?"
  → System generates a JSON/PDF export of all their data
  → Delivered within 30 days

Right to rectification:
  → User can update their own profile data at any time
  → For data user cannot edit: request to admin, fix in 7 days

Right to erasure ("right to be forgotten"):
  → User requests account deletion
  → System deletes within 30 days:
    - profile, client record, network record
    - their messages in conversations
    - their canvas sessions (if no active project)
    - their auth.users record (Supabase)
  → System RETAINS (anonymized):
    - invoices (legal/tax requirement, name replaced with ID)
    - audit logs (security requirement, user_id only)
    - project data they contributed to (anonymized)

Right to data portability:
  → User can export their data in machine-readable format (JSON)
  → Includes: profile, projects, messages, specs, invoices

Right to restrict processing:
  → User can request: "Stop using my data but don't delete"
  → System sets account to "restricted" — no AI processing,
    no analytics, no outreach. Data retained but frozen.
```

**Consent tracking:**

```
On registration, user consents to:
  □ Terms of service (required)
  □ Privacy policy (required)
  □ AI processing of conversations (required for Canvas)
  □ Marketing communications (optional)

Consent stored in:
  profiles.consents: jsonb {
    terms: { version: "1.0", accepted_at: timestamp },
    privacy: { version: "1.0", accepted_at: timestamp },
    ai_processing: { version: "1.0", accepted_at: timestamp },
    marketing: { accepted: boolean, updated_at: timestamp }
  }
```

**Data Processing Agreement (DPA):**

```
For clients whose data we process (Canvas sessions,
project data): DPA template available, signed on request.
Standard Contractual Clauses (SCC) for EU→Moldova transfers.
```

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

### Requirement: Multi-Factor Authentication

The system SHALL require MFA for admin accounts.

#### Scenario: Admin MFA enrollment
- **WHEN** a user is assigned the `admin` role
- **THEN** the system requires TOTP setup before granting admin access
- **AND** the user scans a QR code with an authenticator app
  (Google Authenticator, Authy, 1Password)
- **AND** the system verifies a one-time code to confirm enrollment

#### Scenario: Admin login with MFA
- **WHEN** an admin authenticates via any method (email, SMS, WhatsApp)
- **THEN** after primary auth, the system requires a TOTP code
- **AND** only after valid TOTP is the admin session created

#### Scenario: MFA not enrolled — admin blocked
- **GIVEN** a user with `admin` role has not enrolled MFA
- **WHEN** they attempt to access /studio
- **THEN** they are redirected to MFA enrollment screen
- **AND** no admin functionality is available until MFA is active

#### Scenario: MFA recovery
- **GIVEN** an admin has lost their authenticator device
- **THEN** recovery via backup codes (generated at enrollment, 10 codes)
- **AND** if backup codes are also lost: manual recovery via
  Supabase dashboard (requires direct DB access)

**Implementation:** Supabase Auth supports TOTP MFA natively.
No external service needed.

---

### Requirement: Privacy Rights

The system SHALL support user data rights as defined
in Layer 9: Privacy & Data Protection.

#### Scenario: User requests data export
- **WHEN** a user requests "export my data"
- **THEN** the system generates a JSON file with all their data:
  profile, projects, messages, specs, invoices
- **AND** delivers it within 30 days (automated: within 24 hours)

#### Scenario: User requests account deletion
- **WHEN** a user requests account deletion
- **THEN** the system shows what will be deleted vs retained
- **AND** requires confirmation
- **AND** deletes personal data within 30 days
- **AND** retains anonymized invoices and audit logs

#### Scenario: User withdraws marketing consent
- **WHEN** a user unchecks marketing communications
- **THEN** the system updates `profiles.consents.marketing`
- **AND** all future marketing emails are blocked immediately

---

### Requirement: Roles

The system SHALL support two base roles at launch.

#### Scenario: Admin role
- **WHEN** Pavel authenticates
- **THEN** role is `admin`, full access everywhere

#### Scenario: User role
- **WHEN** anyone else registers
- **THEN** role is `user`, sees only shared content

#### Scenario: Anonymous visitor
- **GIVEN** no login
- **THEN** sees public web content + AI chat only

---

### Requirement: Access by Domain Role

The system SHALL grant access based on domain-specific roles.

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

The system SHALL auto-create a profile for every new user.

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

The system SHALL share sessions across all platform subdomains.

#### Scenario: Cross-subdomain auth
- **WHEN** user logs in on either subdomain
- **THEN** cookie set on `.pavelrapoport.com`
- **AND** both subdomains share the session

#### Scenario: Token refresh
- **WHEN** access token expires
- **THEN** refresh token renews transparently

---

### Requirement: Login Flow

The system SHALL handle login redirects and post-login routing.

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

The system SHALL destroy sessions across all subdomains on logout.

#### Scenario: Logout
- **WHEN** user clicks logout anywhere
- **THEN** session destroyed on Supabase
- **AND** cookie cleared on `.pavelrapoport.com`
- **AND** both apps lose session
- **AND** redirect to pavelrapoport.com

---

### Requirement: Email Flows

The system SHALL support email-based authentication flows.

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

The system SHALL enforce route-level access control by role.

#### Scenario: Admin-only route
- **WHEN** non-admin hits /studio/finance → denied

#### Scenario: Auth-required route
- **WHEN** anon hits protected route → redirect to login

#### Scenario: Public route
- **WHEN** anyone hits /, /blog/* → allowed

---

### Requirement: Row-Level Security

The system SHALL enforce row-level security on every public table.

#### Scenario: Data isolation
- **WHEN** user queries any table
- **THEN** admin sees all, users see only their linked rows

#### Scenario: RLS as fallback
- **GIVEN** a middleware bug
- **THEN** RLS still blocks unauthorized access

#### Scenario: Self-role modification blocked
- **GIVEN** a user with org_role `member`
- **WHEN** they attempt to UPDATE their own org_role to `admin`
- **THEN** RLS policy blocks the update
- **AND** only `owner` role can modify other users' org_roles
- **AND** the attempt is logged to audit trail

---

### Requirement: Session Expiry

The system SHALL handle session expiration and revocation gracefully.

#### Scenario: Active session expires
- **WHEN** session expires during use
- **THEN** non-blocking notification: "Session expired"
- **AND** re-login without losing page context

#### Scenario: Session revocation (suspected compromise)
- **WHEN** Pavel suspects a stolen session
- **THEN** he calls `revokeAllSessions(userId)` from Studio
- **AND** all active sessions for that user are invalidated
- **AND** user must re-authenticate on next request
- **AND** event logged to audit trail

#### Scenario: Self-service session management
- **WHEN** any user views their security settings
- **THEN** they see active sessions (device, IP, last active)
- **AND** can revoke individual sessions

---

### Requirement: Audit Trail

The system SHALL log all authentication and authorization events.

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

**Middleware:**
- `withAuth(handler)` → check session, inject user + profile
- `withRole(role, handler)` → check role after auth
- `authMiddleware(config)` → Next.js middleware for routes

**Server:**
- `getServerSession(cookies)` → session from cookies
- `getServerUser(cookies)` → user + profile + domain roles
- `validateSession(token)` → verify + refresh if needed

**Security:**
- `validateInput(schema, data)` → zod validation
- `sanitizeOutput(data, role)` → strip sensitive fields
- `auditLog(action, userId, detail)` → security event log
- `revokeAllSessions(userId)` → invalidate all user sessions
- `revokeSession(sessionId)` → invalidate single session
- `listActiveSessions(userId)` → device, IP, last active

**Config:**
- `AUTH_ROUTES` → public / auth-required / admin-only map
- `COOKIE_DOMAIN` → `.pavelrapoport.com`
- `REDIRECT_DEFAULTS` → { admin, client, network, user }

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
- **AuditEvent** — timestamp, user_id, ip, action, success

## Dependencies

- All domains depend on `auth`
- `clients` — client profile extends User
- `network` — network member profile extends User
- `integrations` — WhatsApp Business API for WhatsApp login
- `@rapoport/ui` — auth form components
- `@rapoport/db` — Supabase client, triggers, RLS policies
