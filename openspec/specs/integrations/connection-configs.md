# Integration Connection Configs

## P0 — Core

### Claude API
- **Auth:** API key
- **Fields:**
  - `api_key` (secret) — Anthropic API key
  - `default_model` (select) — claude-opus-4-20250514, claude-sonnet-4-20250514
  - `max_tokens` (number) — default 4096
- **Validate:** POST to /v1/messages with minimal prompt
- **Scope:** global

### Claude Code CLI
- **Auth:** API key (same as Claude API) + CLI binary
- **Fields:**
  - `api_key` (secret) — reuse from Claude API connection or separate
  - `working_directory` (text) — default project root
  - `allowed_commands` (text[]) — whitelist of shell commands
- **Validate:** `claude --version` + test prompt
- **Scope:** project

### Linear
- **Auth:** API key or OAuth
- **Fields:**
  - `api_key` (secret) — Linear personal API key
  - `workspace_id` (text) — auto-detected after auth
  - `team_id` (text) — which team to sync with
  - `team_name` (text) — display name
- **Validate:** GraphQL query `{ viewer { id name } }`
- **Scope:** project (team per project)

### GitHub
- **Auth:** Personal access token or GitHub App
- **Fields:**
  - `token` (secret) — PAT with repo scope
  - `owner` (text) — org or username
  - `repo` (text) — repository name
  - `default_branch` (text) — default `main`
- **Validate:** GET /repos/{owner}/{repo}
- **Scope:** project

### Cloudflare
- **Auth:** API token
- **Fields:**
  - `api_token` (secret) — Cloudflare API token
  - `account_id` (text) — Cloudflare account ID
  - `project_name` (text) — Pages project name
  - `production_branch` (text) — default `main`
- **Validate:** GET /client/v4/accounts/{account_id}
- **Scope:** project or global

### Supabase
- **Auth:** Service role key + project URL
- **Fields:**
  - `project_url` (url) — https://xxx.supabase.co
  - `anon_key` (secret) — public anon key
  - `service_role_key` (secret) — server-side only
  - `db_connection_string` (secret) — direct Postgres (optional)
- **Validate:** GET /rest/v1/ with anon key
- **Scope:** project or global

---

## P1 — Operations

### Sentry
- **Auth:** Auth token
- **Fields:**
  - `auth_token` (secret) — Sentry auth token
  - `org_slug` (text) — organization slug
  - `project_slug` (text) — project slug
  - `dsn` (secret) — client DSN for error reporting
- **Validate:** GET /api/0/organizations/{org_slug}/
- **Scope:** project

### PostHog
- **Auth:** API key
- **Fields:**
  - `api_key` (secret) — project API key
  - `host` (url) — default https://app.posthog.com
  - `project_id` (text) — PostHog project ID
- **Validate:** GET /api/projects/{project_id}/
- **Scope:** global or project

### Telegram Bot API
- **Auth:** Bot token
- **Fields:**
  - `bot_token` (secret) — from @BotFather
  - `webhook_url` (url) — where to receive updates
  - `chat_ids` (text[]) — default notification targets
- **Validate:** GET /bot{token}/getMe
- **Scope:** global

### WhatsApp Business API
- **Auth:** Access token
- **Fields:**
  - `access_token` (secret) — Meta Business access token
  - `phone_number_id` (text) — WhatsApp phone number ID
  - `business_account_id` (text) — WhatsApp Business Account ID
  - `webhook_verify_token` (secret) — for webhook verification
- **Validate:** GET /v17.0/{phone_number_id}
- **Scope:** global

### Resend
- **Auth:** API key
- **Fields:**
  - `api_key` (secret) — Resend API key
  - `from_email` (email) — verified sender address
  - `from_name` (text) — sender display name
  - `reply_to` (email) — reply-to address (optional)
- **Validate:** GET /api/domains
- **Scope:** global

---

## P2 — Growth

### OpenAI API
- **Auth:** API key
- **Fields:**
  - `api_key` (secret) — OpenAI API key
  - `organization_id` (text) — optional org ID
  - `default_model` (select) — gpt-4o, o3, o4-mini
- **Validate:** GET /v1/models
- **Scope:** global

### Open-source Models (Ollama / Together AI)
- **Auth:** varies
- **Fields:**
  - `provider` (select) — ollama, together_ai
  - `base_url` (url) — API endpoint
  - `api_key` (secret) — for Together AI; empty for local Ollama
  - `default_model` (text) — model name
- **Validate:** GET /api/tags (Ollama) or GET /v1/models (Together)
- **Scope:** global

### Cursor API
- **Auth:** Session token
- **Fields:**
  - `session_token` (secret) — Cursor auth
  - `workspace_path` (text) — project directory
- **Validate:** health check endpoint
- **Scope:** project

### GitHub Copilot
- **Auth:** via GitHub token
- **Fields:**
  - `github_token` (secret) — reuse from GitHub connection
  - `enabled` (boolean) — active for this project
- **Validate:** check Copilot subscription status
- **Scope:** project

### Vercel
- **Auth:** API token
- **Fields:**
  - `api_token` (secret) — Vercel access token
  - `team_id` (text) — Vercel team (optional)
  - `project_id` (text) — Vercel project ID
- **Validate:** GET /v9/projects/{project_id}
- **Scope:** project

### Slack API
- **Auth:** Bot token (OAuth)
- **Fields:**
  - `bot_token` (secret) — xoxb-... token
  - `signing_secret` (secret) — for webhook verification
  - `default_channel` (text) — channel ID for notifications
- **Validate:** POST /api/auth.test
- **Scope:** global or project

### Vector DB (pgvector / Pinecone)
- **Auth:** varies
- **Fields:**
  - `provider` (select) — pgvector, pinecone
  - `connection_string` (secret) — for pgvector (Supabase)
  - `api_key` (secret) — for Pinecone
  - `index_name` (text) — for Pinecone
  - `dimensions` (number) — embedding dimensions
- **Validate:** test query on index
- **Scope:** project or global

### Web Search API
- **Auth:** API key
- **Fields:**
  - `provider` (select) — tavily, serper, brave
  - `api_key` (secret) — provider API key
- **Validate:** test search query
- **Scope:** global

### Google Workspace
- **Auth:** OAuth 2.0 (single consent → multiple scopes)
- **Account:** hello@pavelrapoport.com
- **Services:**

**Gmail**
- **Fields:**
  - `access_token` (secret) — OAuth token
  - `refresh_token` (secret) — for token renewal
- **Scopes:** gmail.readonly, gmail.send
- **Use:** incoming lead detection, AI Listener classification
- **Scope:** global
- **Note:** transactional/marketing emails → Resend, NOT Gmail

**Google Calendar**
- **Fields:**
  - `calendar_id` (text) — primary or specific calendar
- **Scopes:** calendar.events, calendar.readonly
- **Use:** discovery call booking, deadline sync with Linear,
  meeting recordings → AI Listener
- **Scope:** global

**Google Drive**
- **Fields:**
  - `root_folder_id` (text) — root folder for projects
- **Scopes:** drive.file, drive.readonly
- **Use:** client documents (NDA, contracts, briefs),
  mood boards, references. Auto-create folder per project.
- **Scope:** project (folder per project) + global (root)

**Google Meet**
- **Fields:** (via Calendar API — no separate config)
- **Use:** recording → transcript → AI Listener → entities
- **Scope:** global

**Google Search Console**
- **Fields:**
  - `site_url` (text) — https://pavelrapoport.com
- **Scopes:** webmasters.readonly
- **Use:** SEO monitoring, indexation tracking
- **Scope:** global

**Google Sheets** (optional)
- **Fields:**
  - `spreadsheet_id` (text) — per export
- **Scopes:** spreadsheets
- **Use:** financial reports exported for client sharing
- **Scope:** project

- **Validate:** OAuth consent → list calendars + list files
- **Single OAuth flow:** one consent screen, multiple scopes

### Notion
- **Auth:** OAuth
- **Fields:**
  - `access_token` (secret) — OAuth token
  - `workspace_id` (text) — Notion workspace
- **Validate:** list pages
- **Scope:** project or global

### Stripe
- **Auth:** API keys
- **Fields:**
  - `secret_key` (secret) — sk_live_... or sk_test_...
  - `publishable_key` (text) — pk_live_... or pk_test_...
  - `webhook_secret` (secret) — whsec_...
  - `mode` (select) — live, test
- **Validate:** GET /v1/balance
- **Scope:** global

---

## Summary

| Field Type | Count | Examples |
|-----------|-------|---------|
| secret | 35 | API keys, tokens, DSNs |
| text | 22 | slugs, IDs, names |
| url | 5 | endpoints, webhooks |
| select | 8 | providers, models, modes |
| email | 2 | from/reply-to |
| number | 2 | max_tokens, dimensions |
| boolean | 1 | enabled flag |
| text[] | 2 | chat_ids, allowed_commands |

Total: 77 fields across 21 integrations.
