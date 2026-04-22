## Context

Studio is accessed daily by a single admin (Pavel) and, in the near future, a small internal team. `auth.users` will eventually be shared with the public site, where `enable_signup=true` must be enabled to support client registration for the future client portal and Canvas AI sessions. A valid Supabase session will therefore exist for any registered public user — studio must not trust "has session" as sufficient.

## Stack

- Next.js 16 App Router (`apps/studio`)
- `@supabase/ssr` 0.10.0 (already in `packages/auth`)
- Supabase Auth (Google provider — built-in, configured via Dashboard)
- Cloudflare Workers runtime (`rapoport-studio` worker)
- Zod-validated env via `@repo/config`
- Infisical for secret injection (`pnpm dev:secrets`)

## Why Google OAuth (not TOTP, not passwords)

**Passwords are excluded** by existing spec Layer 3: Authentication — "No passwords stored — magic link, SMS OTP, WhatsApp OTP". OAuth does not store a password locally; Supabase holds only the provider session.

**TOTP (Supabase-native) is not added** on top of Google OAuth: the existing Multi-Factor Authentication requirement mandates MFA for admin accounts, but the requirement is satisfied by Google Workspace 2SV (hardware key / passkey / Authenticator). Adding Supabase TOTP would double-prompt without reducing risk.

**Google OAuth specifically** is the only method that makes daily studio login one click. Magic link, SMS, and WhatsApp OTP all require a second device or inbox context-switch.

## Why an env-var whitelist (not `profiles.role`)

The auth spec already declares roles — `profiles.role` = `admin` | `user` — as the long-term mechanism, seeded for Pavel via migration. That is the correct end state and will land with the client portal change, which is when `auth.users` actually becomes shared across subdomains.

Until then, two considerations tip this change toward an env var:

1. **Scope.** The database-backed path requires the `profiles` table, `handle_new_user` trigger, RLS policies, and a seed migration for Pavel — none of which exist yet. Adding them here would turn AI-62 (a thin OAuth feature) into the full auth-infrastructure change. That is a legitimate change, but it is not this one.
2. **Cardinality.** The whitelist has one entry today (and 2–3 expected over the next 6 months). Storing three emails in a table and then enforcing them with an RLS-backed lookup is more ceremony than an env var string. Rotating it means redeploying — acceptable at this scale.

Tech debt is recorded in the spec diff (see `## Out-of-scope follow-ups` block in `specs/auth/spec.md`).

## Why enforce in middleware, not at the callback

The callback route (`apps/studio/src/app/auth/callback/route.ts`) runs once per auth code exchange. Middleware runs on every request. Enforcing the whitelist in middleware:

- Catches sessions that become invalid post-deploy (e.g., email removed from the whitelist).
- Catches sessions created on `pavelrapoport.com` that try to visit studio directly with the shared `.pavelrapoport.com` cookie — no callback is involved in that flow.
- Uses the existing `createProxyClient` (which already has cookie write-through via `NextResponse` cookies), so `supabase.auth.signOut()` cleanly expires the cross-subdomain cookie.

## Implementation surface

**`packages/auth/src/server.ts`** — new helper:

```ts
export async function signInWithGoogle(redirectTo: string) {
  const supabase = await createAuthServerClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}
```

`supabase.auth.signInWithOAuth` returns `{ data: { provider, url }, error }` — the caller redirects the browser to `data.url`. The secret stays server-side; only the URL is returned to the client.

**`packages/auth/src/index.ts`** — add to existing `export { ... } from "./server"`.

**`packages/auth/src/proxy.ts`** — extend `AuthProxyConfig`:

```ts
type AuthProxyConfig = {
  publicRoutes?: string[];
  loginUrl?: string;
  allowedEmails?: string[];  // lowercased, already-trimmed list
};
```

After `supabase.auth.getUser()` succeeds and `!isPublicRoute`, if `allowedEmails` is non-empty and `user.email?.toLowerCase()` is not in the list:

```ts
await supabase.auth.signOut();
const url = request.nextUrl.clone();
url.pathname = loginUrl;
url.search = "";
url.searchParams.set("error", "not_authorized");
return NextResponse.redirect(url);
```

Empty or undefined `allowedEmails` = whitelist disabled (any valid session passes). This is the dev fallback; production must set `STUDIO_ALLOWED_EMAILS`.

**`packages/config/src/env.ts`** — new optional field:

```ts
STUDIO_ALLOWED_EMAILS: z.string().min(1).optional(),
```

**`apps/studio/src/middleware.ts`** — read and parse:

```ts
const allowedEmails = (process.env.STUDIO_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const middleware = createAuthProxy({
  publicRoutes: ["/login", "/auth/callback", "/api/studio/command"],
  loginUrl: "/login",
  allowedEmails,
});
```

**`apps/studio/src/app/login/actions.ts`** — new server action:

```ts
export async function signInWithGoogleAction() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const { data, error } = await signInWithGoogle(`${siteUrl}/auth/callback`);
  if (error) return { url: null, error: error.message };
  return { url: data.url, error: null };
}
```

**`apps/studio/src/app/login/login-form.tsx`** — new Google button **above** the magic link form, wired via `useActionState`:

```tsx
const [googleState, googleAction, googlePending] = useActionState(
  googleOAuthReducer,
  { url: null as string | null, error: null as string | null }
);

useEffect(() => {
  if (googleState.url) window.location.assign(googleState.url);
}, [googleState.url]);
```

The reducer simply calls `signInWithGoogleAction()` and returns its result. `useEffect` performs the browser redirect when the URL is returned. This stays within React 19 server-action semantics.

**`apps/studio/src/app/login/page.tsx`** — read `searchParams`, render banner for `?error=not_authorized` ("Access denied. Your email is not whitelisted for the studio.") and `?error=auth_failed` ("Authentication failed. Please try again.").

## Manual configuration (outside the repo)

Tasks 2 and 3 in `tasks.md` cover:

1. **Google Cloud Console**: new OAuth 2.0 Client ID (Web app), authorized origins `https://studio.pavelrapoport.com` + `http://localhost:3001`, redirect URI `https://mtavnbjdgldttqdpwouo.supabase.co/auth/v1/callback`.
2. **Supabase Dashboard**: Authentication → Providers → Google → enable + paste client ID/secret. Redirect URLs must include `https://studio.pavelrapoport.com/auth/callback` and `http://localhost:3001/auth/callback` (likely already present — magic link uses them too).
3. **Infisical**: add `STUDIO_ALLOWED_EMAILS=pavel@pavelrapoport.com` to dev/staging/prod. Production worker picks it up through existing Infisical → Cloudflare sync (or `wrangler secret put` as fallback).

`GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` already exist as optional fields in `packages/config/.env.example` — they are **not** used by the Next.js runtime in this change. Supabase holds the OAuth secret in its provider config; the app only needs Supabase URL + anon key.

## Risk

Low. All code changes are additive:

- Magic link path is untouched; users can fall back if Google OAuth breaks.
- Whitelist is a no-op when the env var is empty, so dev stays functional.
- If middleware whitelist misbehaves in production, worst case is a studio lockout, fixable by redeploying with `STUDIO_ALLOWED_EMAILS` set or the `allowedEmails` argument removed.
- No database changes → no migration to roll back.
- Cross-subdomain cookie behavior (`COOKIE_OPTIONS.domain = ".pavelrapoport.com"`) is unchanged; sessions created via Google OAuth on studio will be valid on `pavelrapoport.com` too — safe because that app has no protected routes yet, and aligns with the spec Requirement: Multi-Domain Sessions.
