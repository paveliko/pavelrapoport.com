## Why

Studio is Pavel's daily workspace (~20 logins/day). Magic link requires opening email, clicking a link, waiting — every session. Google OAuth is one click. Google Workspace MFA satisfies the existing admin-MFA requirement without adding a Supabase TOTP flow on top. Business goal: operational efficiency.

`auth.users` will eventually be shared across `pavelrapoport.com` (public + client portal, with `enable_signup=true`) and `studio.pavelrapoport.com`. "Valid session" alone cannot gate the studio — anyone who registers on the public site could walk in. Middleware needs a second gate: an email whitelist driven by the `STUDIO_ALLOWED_EMAILS` env var.

## What Changes

- `@repo/auth` exports a new `signInWithGoogle(redirectTo)` server helper wrapping `supabase.auth.signInWithOAuth({ provider: 'google' })`. Existing `signInWithMagicLink` and `exchangeCodeForSession` are unchanged; the OAuth return uses the same `/auth/callback` route.
- `createAuthProxy` gains an optional `allowedEmails?: string[]` option. When non-empty, middleware compares `user.email` (lowercased) against the list; non-matches trigger `supabase.auth.signOut()` + redirect to `${loginUrl}?error=not_authorized`.
- `packages/config` Zod schema declares `STUDIO_ALLOWED_EMAILS` (optional, comma-separated).
- `apps/studio` middleware passes the parsed whitelist into `createAuthProxy`. Login page adds a "Continue with Google" button above the magic link form, wired through a new `signInWithGoogleAction` server action following the existing `useActionState` pattern.
- `apps/studio` login page renders `?error=not_authorized` and `?error=auth_failed` as inline messages.

Magic link stays as a fallback. All changes are additive.

## Capabilities

### New Capabilities

_None._ Auth methods are defined in an existing requirement; this change extends it.

### Modified Capabilities

- `auth`: add Google OAuth as a fourth auth method; revise the auth method priority scenario (studio: Google → Email; client portal: Email → WhatsApp → SMS deferred); add Studio email whitelist + Empty whitelist in production scenarios under Route Protection.

## Impact

- **Code:**
  - [packages/auth/src/server.ts](../../../packages/auth/src/server.ts) — new `signInWithGoogle` export
  - [packages/auth/src/index.ts](../../../packages/auth/src/index.ts) — re-export new helper
  - [packages/auth/src/proxy.ts](../../../packages/auth/src/proxy.ts) — `allowedEmails` option + whitelist enforcement
  - [packages/auth/src/__tests__/smoke.test.ts](../../../packages/auth/src/__tests__/smoke.test.ts) — extend with whitelist cases
  - [packages/config/src/env.ts](../../../packages/config/src/env.ts) — add `STUDIO_ALLOWED_EMAILS`
  - [apps/studio/src/middleware.ts](../../../apps/studio/src/middleware.ts) — pass whitelist
  - [apps/studio/src/app/login/login-form.tsx](../../../apps/studio/src/app/login/login-form.tsx) — Google button
  - [apps/studio/src/app/login/actions.ts](../../../apps/studio/src/app/login/actions.ts) — `signInWithGoogleAction`
  - [apps/studio/src/app/login/page.tsx](../../../apps/studio/src/app/login/page.tsx) — error-banner rendering
- **Spec:** [packages/openspec/specs/auth/spec.md](../../../packages/openspec/specs/auth/spec.md) — MODIFIED Requirement: Auth Methods, MODIFIED Requirement: Route Protection.
- **Config (manual, outside repo):**
  - Google Cloud Console — new OAuth 2.0 Client ID (Web app)
  - Supabase Dashboard — enable Google provider + paste credentials
  - Infisical — add `STUDIO_ALLOWED_EMAILS` to dev/staging/prod
- **No DB migrations. No UI layout shift. Magic link untouched. Cross-subdomain cookie behavior (`.pavelrapoport.com`) unchanged.**

## Non-Goals

- Client auth on `pavelrapoport.com` (separate future change).
- `profiles.role`-backed whitelist (env var is MVP; DB-backed roles land with client portal work).
- RLS policies, `auth_events` audit trail, TOTP enrollment, SMS/WhatsApp OTP, GDPR data-rights endpoints — all deferred to their own changes.
- Production guardrail enforcing non-empty `STUDIO_ALLOWED_EMAILS` at build/deploy time — tracked in the spec as tech debt.
