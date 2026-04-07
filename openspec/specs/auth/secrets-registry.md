# Secrets Registry

> Single source of truth for all keys, tokens, and secrets.
> Security Domain Owner: organization owner.

## Ownership Rules

- **Platform secrets** — managed by Pavel (platform admin).
  No one else has access. Stored in Cloudflare environment
  variables or Supabase Vault.
- **Integration secrets** — managed by organization owner/admin.
  Stored encrypted in Supabase. Access logged.
  Full config per integration: see `integrations/connection-configs.md`
- **Environment config** — not secrets, but per-environment.
  Stored in `.env` files, committed to repo as `.env.example`
  with empty values.

## Responsibility Chain

```
Platform secrets
  └── Pavel (platform admin)
        ├── rotates on schedule
        ├── stores in Cloudflare / Supabase Vault
        └── only person with direct DB access

Integration secrets (per organization)
  └── Organization owner
        ├── creates and edits connections
        ├── reviews audit log of key access
        ├── rotates keys on schedule
        └── receives alerts on compromise
              │
              └── Organization admin
                    ├── can view keys (audit logged)
                    ├── can create connections
                    ├── CANNOT delete connections
                    └── owner notified on every access

Members and viewers: NEVER see keys.
System uses keys on their behalf.
```

---

## Platform Secrets

### Supabase Auth

| Key | Type | Where stored | Client-safe? | Used by |
|-----|------|-------------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | url | env | YES | both apps |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | token | env | YES — RLS protects | both apps |
| `SUPABASE_SERVICE_ROLE_KEY` | token | Cloudflare secret | **NO — bypasses RLS** | server only |
| `SUPABASE_JWT_SECRET` | secret | Cloudflare secret | NO | server only |
| `SUPABASE_DB_URL` | connection string | Cloudflare secret | NO | migrations, server |

### Session & Cookies

| Key | Type | Where stored | Client-safe? | Used by |
|-----|------|-------------|-------------|---------|
| `COOKIE_SIGNING_SECRET` | secret | Cloudflare secret | NO | @rapoport/auth |
| `COOKIE_DOMAIN` | config | env | YES | @rapoport/auth |

### Encryption

| Key | Type | Where stored | Client-safe? | Used by |
|-----|------|-------------|-------------|---------|
| `ENCRYPTION_KEY` | AES-256 key | Cloudflare secret | NO | @rapoport/config |

Used to encrypt all integration connection configs at rest
in Supabase. If compromised, all integration keys are exposed.

**Rotation procedure:**
1. Generate new key
2. Re-encrypt all connection configs with new key
3. Deploy new key to Cloudflare
4. Delete old key

---

## Integration Secrets

Detailed field definitions per integration:
→ `openspec/specs/integrations/connection-configs.md`

Summary by priority:

### P0 — Core (6 integrations, 16 secret fields)

| Integration | Secret fields |
|------------|--------------|
| Claude API | `api_key` |
| Claude Code CLI | `api_key` |
| Linear | `api_key` |
| GitHub | `token` |
| Cloudflare | `api_token` |
| Supabase (per-project) | `anon_key`, `service_role_key`, `db_connection_string` |

### P1 — Operations (5 integrations, 9 secret fields)

| Integration | Secret fields |
|------------|--------------|
| Sentry | `auth_token`, `dsn` |
| PostHog | `api_key` |
| Telegram | `bot_token` |
| WhatsApp | `access_token`, `webhook_verify_token` |
| Resend | `api_key` |

### P2 — Growth (10 integrations, 16 secret fields)

| Integration | Secret fields |
|------------|--------------|
| OpenAI | `api_key` |
| Ollama / Together | `api_key` |
| Cursor | `session_token` |
| GitHub Copilot | `github_token` |
| Vercel | `api_token` |
| Slack | `bot_token`, `signing_secret` |
| Vector DB | `connection_string`, `api_key` |
| Web Search | `api_key` |
| Google Drive / Notion | `access_token`, `refresh_token` |
| Stripe | `secret_key`, `webhook_secret` |

**Total: 41 secret fields across 21 integrations + 5 platform secrets = 46 secrets.**

---

## Environment Config (not secrets)

| Variable | Value example | Used by |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | both apps |
| `NEXT_PUBLIC_SITE_URL` | `https://pavelrapoport.com` | web app |
| `NEXT_PUBLIC_STUDIO_URL` | `https://studio.pavelrapoport.com` | studio app |
| `COOKIE_DOMAIN` | `.pavelrapoport.com` | @rapoport/auth |
| `NODE_ENV` | `production` | both apps |

---

## Storage Strategy

```
Where secrets live by environment:

Development:
  └── .env.local (git-ignored, each dev has their own)

Staging:
  └── Cloudflare Pages env variables (encrypted)

Production:
  ├── Platform secrets → Cloudflare secrets (encrypted, server-only)
  └── Integration secrets → Supabase table (AES-256 encrypted)
        ├── encrypted by ENCRYPTION_KEY
        ├── decrypted only in @rapoport/config at runtime
        └── never logged, never in client bundle
```

---

## Rotation Schedule

| Category | Rotation | Trigger |
|----------|---------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Every 90 days | Supabase dashboard |
| `SUPABASE_JWT_SECRET` | Rarely (breaks all sessions) | Only on compromise |
| `ENCRYPTION_KEY` | Every 180 days | Re-encrypt all configs |
| `COOKIE_SIGNING_SECRET` | Every 90 days | Invalidates sessions |
| Integration keys | Per-service policy | Owner discretion |
| Compromised key | Immediately | Revoke + rotate + audit |

---

## Audit Requirements

Every secret access SHALL be logged:

| Event | Logged fields |
|-------|--------------|
| Key viewed | user_id, connection_id, timestamp, IP |
| Key edited | user_id, connection_id, old_hash, new_hash, timestamp |
| Key rotated | user_id, connection_id, reason, timestamp |
| Key deleted | user_id, connection_id, timestamp |
| Failed access | user_id, connection_id, reason, timestamp, IP |

Audit log is append-only. Cannot be edited or deleted
by anyone except platform admin (Pavel) with separate
audit of that deletion.

---

## CI Security Checks

| Check | What it catches |
|-------|----------------|
| `no-service-key-in-client` | service_role_key imported in apps/ |
| `no-secrets-in-logs` | console.log containing key patterns |
| `env-example-sync` | .env.example matches required vars |
| `rls-on-all-tables` | public tables without RLS |
| `encrypted-connections` | connection configs stored unencrypted |
