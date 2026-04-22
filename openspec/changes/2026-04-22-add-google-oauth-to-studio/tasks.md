## 1. Spec update

- [ ] 1.1 Apply the diff in `specs/auth/spec.md` to `packages/openspec/specs/auth/spec.md`: add "Google OAuth login (admin only)" scenario under Requirement: Auth Methods; replace the "Auth method priority" scenario body; add "Studio email whitelist" and "Empty whitelist in production" scenarios under Requirement: Route Protection.
- [ ] 1.2 Run `pnpm openspec validate 2026-04-22-add-google-oauth-to-studio --strict` if the CLI is available; otherwise lint the diff manually against `packages/openspec/config.yaml` rules (Given/When/Then, one spec per domain).

## 2. Google Cloud Console OAuth client

- [ ] 2.1 Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID → Web application. Name: `pavelrapoport-studio-production`.
- [ ] 2.2 Authorized JavaScript origins: `https://studio.pavelrapoport.com`, `http://localhost:3001`.
- [ ] 2.3 Authorized redirect URI: `https://mtavnbjdgldttqdpwouo.supabase.co/auth/v1/callback`.
- [ ] 2.4 Save Client ID + Client Secret to 1Password (temporary — Supabase will hold the secret of record).

## 3. Supabase provider + Infisical

- [ ] 3.1 Supabase Dashboard → Authentication → Providers → Google → toggle Enabled, paste Client ID + Client Secret from Task 2. Save.
- [ ] 3.2 Supabase Dashboard → Authentication → URL Configuration → confirm Redirect URLs include `https://studio.pavelrapoport.com/auth/callback` and `http://localhost:3001/auth/callback` (add if missing; magic link already uses them).
- [ ] 3.3 Infisical → add `STUDIO_ALLOWED_EMAILS=pavel@pavelrapoport.com` to dev, staging, prod environments.
- [ ] 3.4 Confirm the prod worker sees the var after next deploy: `wrangler secret list --name rapoport-studio` includes `STUDIO_ALLOWED_EMAILS`. If Infisical sync doesn't cover it, run `wrangler secret put STUDIO_ALLOWED_EMAILS --name rapoport-studio` manually.

## 4. Extend @repo/auth/server

- [ ] 4.1 In `packages/auth/src/server.ts`, add `signInWithGoogle(redirectTo: string)` wrapping `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })`.
- [ ] 4.2 In `packages/auth/src/index.ts`, add `signInWithGoogle` to the `export { ... } from "./server"` list.

## 5. Extend @repo/auth/proxy with whitelist

- [ ] 5.1 In `packages/auth/src/proxy.ts`, add `allowedEmails?: string[]` to `AuthProxyConfig`. After `supabase.auth.getUser()` and before the final `return response`, when `user` exists, `!isPublicRoute`, and `allowedEmails` is non-empty, verify `user.email?.toLowerCase()` is in the list; otherwise `await supabase.auth.signOut()` and redirect to `${loginUrl}?error=not_authorized` (using the existing `NextResponse.redirect` pattern, clearing the `next` param).
- [ ] 5.2 Extend `packages/auth/src/__tests__/smoke.test.ts` with three cases: (a) no `allowedEmails` → passes, (b) email in list (case-insensitive) → passes, (c) email not in list → redirect + signOut called.

## 6. Wire studio middleware, config, login form

- [ ] 6.1 In `packages/config/src/env.ts`, add `STUDIO_ALLOWED_EMAILS: z.string().min(1).optional()` to the Zod schema.
- [ ] 6.2 In `packages/config/.env.example`, append `STUDIO_ALLOWED_EMAILS=` with a comment explaining the format (comma-separated emails).
- [ ] 6.3 In `apps/studio/src/middleware.ts`, parse `process.env.STUDIO_ALLOWED_EMAILS` (split on comma, trim, lowercase, filter empty) and pass as `allowedEmails` to `createAuthProxy`.
- [ ] 6.4 In `apps/studio/src/app/login/actions.ts`, add `signInWithGoogleAction()` returning `{ url, error }` — uses `NEXT_PUBLIC_SITE_URL` like `sendMagicLink` does.
- [ ] 6.5 In `apps/studio/src/app/login/login-form.tsx`, add a "Continue with Google" button above the magic link form. Wire via `useActionState` + `useEffect(() => window.location.assign(state.url))`. Add a neutral divider between the two methods.
- [ ] 6.6 In `apps/studio/src/app/login/page.tsx`, read `searchParams` (App Router async prop in Next.js 16 — check `node_modules/next/dist/docs/` first), render a small error banner for `error=not_authorized` and `error=auth_failed`.

## 7. Verification

- [ ] 7.1 `pnpm --filter @repo/auth typecheck && pnpm --filter @repo/auth test` — green.
- [ ] 7.2 `pnpm --filter @repo/config typecheck` — green.
- [ ] 7.3 `pnpm --filter @repo/studio typecheck && pnpm --filter @repo/studio lint` — green.
- [ ] 7.4 `pnpm --filter @repo/studio dev` + browser test: `http://localhost:3001/` redirects to `/login`; click "Continue with Google" → Google consent screen; complete with whitelisted account → land at `/`. Re-test with a non-whitelisted account added to `.env.local` → expect `?error=not_authorized`. Confirm magic link still works. Take screenshots of (a) login screen with both options, (b) Google consent, (c) not_authorized banner. Blocked until Tasks 2–3 are complete in real infra — pre-merge run may only cover typecheck/lint/unit tests + visual check of the login form.
- [ ] 7.5 DevTools → Application → Cookies: `sb-mtavnbjdgldttqdpwouo-auth-token` with `HttpOnly`, `SameSite=Lax`.

## 8. Archive

- [ ] 8.1 After PR merge, invoke the `openspec-archive-change` skill to move `openspec/changes/2026-04-22-add-google-oauth-to-studio/` into `openspec/changes/archive/` and apply the spec diff into `packages/openspec/specs/auth/spec.md` (if not already applied in Task 1).
- [ ] 8.2 Verify `packages/openspec/specs/auth/spec.md` contains the new Google OAuth scenario, the revised auth method priority, and the two new Route Protection scenarios.
- [ ] 8.3 Update Linear AI-62 status to Done and add PR link to the issue.
