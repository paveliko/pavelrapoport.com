# integrations

> Universal connectors to everything the studio touches.

## Purpose

**What:** Platform-level integration layer. Two concepts:
Integration (driver — "we can talk to Linear") and Connection
(instance — "project X is connected to Linear workspace Y
with this token").

**For whom:** Pavel (configures connections per project),
the system (uses connections to sync data, trigger actions,
track costs), clients and network members (eventually —
connect their own tools).

**Why it exists:** The studio orchestrates many external
services. Each one needs auth, config, status tracking,
and a shared interface. Without a unified integration layer,
every domain reinvents how to talk to the outside world.

## Requirements

### Requirement: Integration Registry

The system SHALL maintain a registry of supported integration
types, each describing the external service capabilities.

#### Scenario: Listing available integrations
- **GIVEN** the integration registry exists
- **WHEN** Pavel opens the integrations settings
- **THEN** he sees all supported types grouped by category:
  AI Models, AI Coding, Dev Platform, Monitoring,
  Communication, Knowledge, Finance

### Requirement: Connection Lifecycle

Each connection SHALL follow a lifecycle:
disconnected → connecting → connected → error.

#### Scenario: Creating a new connection
- **WHEN** Pavel connects a project to a GitHub repo
- **THEN** the system creates a connection with type `github`,
  scope `project`, config (repo slug, token), status `connecting`
- **AND** validates the credentials
- **AND** sets status to `connected` or `error`

#### Scenario: Connection health check
- **GIVEN** a connection with status `connected`
- **WHEN** the system runs a periodic health check
- **THEN** it calls `status()` on the connection
- **AND** updates status and `last_sync` timestamp

### Requirement: Connection Scope

Each connection SHALL have a scope: `global` (platform-wide)
or `project` (belongs to a specific project).

#### Scenario: Global connection
- **WHEN** Pavel connects PostHog for platform analytics
- **THEN** the connection scope is `global`
- **AND** all projects can access this connection

#### Scenario: Project connection
- **WHEN** Pavel connects a GitHub repo to project Dentour
- **THEN** the connection scope is `project`
- **AND** only that project uses this connection

### Requirement: Unified Interface

Every connection SHALL expose a common interface regardless
of the underlying service.

#### Scenario: Common operations
- **GIVEN** any active connection
- **THEN** it supports: `connect()`, `disconnect()`,
  `status()`, `sync()`
- **AND** returns data in a normalized format

### Requirement: Config Management

Connection credentials and configuration SHALL be stored
securely and never exposed in logs or UI.

#### Scenario: Storing credentials
- **WHEN** Pavel enters an API token for a connection
- **THEN** the token is encrypted at rest
- **AND** only the connection type and status are visible in UI

### Requirement: Webhook Security

Every incoming webhook SHALL be verified before processing.

#### Scenario: Linear webhook received
- **WHEN** the API receives a POST to `/webhooks/linear`
- **THEN** the system reads the `X-Linear-Signature` header
- **AND** computes HMAC-SHA256 of the raw body using the
  stored `linear_webhook_secret`
- **AND** compares the computed signature with the header
- **IF** signatures match → process the webhook
- **IF** signatures don't match → return 401, log the attempt

#### Scenario: GitHub webhook received
- **WHEN** the API receives a POST to `/webhooks/github`
- **THEN** the system reads the `X-Hub-Signature-256` header
- **AND** computes HMAC-SHA256 of the raw body using the
  stored `github_webhook_secret`
- **IF** signatures match → process the webhook
- **IF** signatures don't match → return 401, log the attempt

#### Scenario: Unknown webhook source
- **WHEN** a POST arrives at any `/webhooks/*` endpoint
  without a valid signature header
- **THEN** the system returns 401 immediately
- **AND** logs: timestamp, IP, path, headers (no body)

#### Scenario: Webhook idempotency
- **WHEN** the same webhook is delivered twice
  (Linear/GitHub retry on timeout)
- **THEN** the system checks a delivery ID
  (`X-Linear-Delivery` / `X-GitHub-Delivery`)
- **AND** if already processed → return 200, skip processing
- **AND** if new → process normally

**Rules:**
```
1. NEVER process a webhook without signature verification
2. NEVER parse the body before verifying the signature
3. Store delivery IDs for 7 days to prevent duplicate processing
4. Webhook secrets are per-connection, stored in secrets-registry
5. Log all webhook attempts (success + failure) to activity_log
```

### Requirement: Supported Integrations

The system SHALL support the following integration types:

**P0 — Core (required for studio to function):**
- Claude API (Opus, Sonnet) — AI model
- Claude Code CLI — code execution
- Linear — task management
- GitHub — code, repos, PRs
- Cloudflare — deployment
- Supabase — database, auth, storage

**P1 — Operations (needed for production use):**
- Sentry — error tracking
- PostHog — analytics, feature flags
- Telegram Bot API — notifications, client entry
- WhatsApp Business API — client communication
- Resend — transactional email

**P2 — Growth (extend capabilities):**
- OpenAI API — multi-model support
- Open-source models (Ollama / Together AI)
- Cursor API — alternative coding agent
- GitHub Copilot — code review assistance
- Vercel — alternative deployment
- Slack API — team communication
- Vector DB (pgvector / Pinecone) — RAG pipelines
- Web Search API — Scout mode research
- Google Drive / Notion — client documents
- Stripe — payments and billing

#### Scenario: Adding a new integration type
- **WHEN** a new service needs to be supported
- **THEN** a new integration driver is added to the registry
- **AND** it implements the unified interface
- **AND** no existing connections are affected

## Entities

- **Integration** — a supported service type (driver).
  Has: type, category, capabilities, auth method, docs URL
- **Connection** — an active link to an external service.
  Has: integration type, scope (global/project), config,
  status, last_sync, project_id (if scoped)
- **SyncEvent** — a record of data exchange through a
  connection. Has: connection_id, direction (in/out),
  payload summary, timestamp, success/error

## Dependencies

- `projects` — project-scoped connections belong to projects
- `auth` — credentials management, access control
- `ai` — AI model connections feed into the agent
- `finance` — API usage costs tracked per connection
