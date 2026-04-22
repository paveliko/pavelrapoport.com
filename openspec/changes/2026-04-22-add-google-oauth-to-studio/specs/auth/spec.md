## MODIFIED Requirements

### Requirement: Auth Methods

The system SHALL support multiple authentication methods via Supabase Auth. Studio uses Google OAuth primarily with magic link as a fallback. The future client portal on `pavelrapoport.com` will use email magic link; WhatsApp and SMS OTP are deferred.

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

#### Scenario: Google OAuth login (studio only)
- **WHEN** a user on `studio.pavelrapoport.com/login` clicks "Continue with Google"
- **THEN** the system redirects to Google's OAuth consent screen with `redirectTo` pointing at `/auth/callback`
- **AND** on consent, Google returns to `https://<project>.supabase.co/auth/v1/callback` which redirects to the app's `/auth/callback` with a PKCE code
- **AND** `exchangeCodeForSession(code)` creates a Supabase session
- **AND** middleware then applies the Studio email whitelist (see Requirement: Route Protection)
- **AND** a valid whitelisted session is issued with the existing `.pavelrapoport.com` cookie

#### Scenario: Auth method priority
- **GIVEN** multiple methods are available
- **THEN** on `studio.pavelrapoport.com`, default order is: Google OAuth → Email magic link
- **AND** on the future `pavelrapoport.com` client portal, default order is: Email → WhatsApp → SMS
- **AND** SMS and WhatsApp OTP are not yet implemented and are deferred to the client-portal change

### Requirement: Route Protection

The system SHALL enforce route-level access control by role, and — until `profiles.role` is populated platform-wide — by an email whitelist on `studio.pavelrapoport.com`.

#### Scenario: Admin-only route
- **WHEN** non-admin hits /studio/finance → denied

#### Scenario: Auth-required route
- **WHEN** anon hits protected route → redirect to login

#### Scenario: Public route
- **WHEN** anyone hits /, /blog/* → allowed

#### Scenario: Studio email whitelist
- **GIVEN** a valid Supabase session (any auth method)
- **WHEN** the user requests a protected route on `studio.pavelrapoport.com`
- **THEN** middleware compares `user.email` (case-insensitive) against the `STUDIO_ALLOWED_EMAILS` environment variable (comma-separated list)
- **AND** if the email is not in the list, middleware calls `supabase.auth.signOut()` and redirects to `/login?error=not_authorized`
- **AND** if `STUDIO_ALLOWED_EMAILS` is empty or unset, the whitelist check is skipped (dev fallback) and any valid session is allowed

#### Scenario: Empty whitelist in production
- **GIVEN** `STUDIO_ALLOWED_EMAILS` is empty or unset in the production `rapoport-studio` worker
- **THEN** this is a misconfiguration: any registered Supabase user could access studio
- **AND** a future change SHALL add a build-time or deploy-time guard that fails CI when the variable is missing in production — tracked as tech debt
- **AND** the long-term replacement is `profiles.role = 'admin'` per Requirement: Roles, landing with the client portal change
