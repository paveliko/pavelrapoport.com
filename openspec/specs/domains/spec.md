# domains

> DNS, subdomains, email, SSL — everything around a web address.

## Purpose

**For whom:** Organization owners (manage their domains),
admins (configure subdomains and email), Pavel (platform-level
DNS management via Cloudflare).

**Why it exists:** A domain is more than a URL. It has DNS
records, SSL certificates, email configuration, subdomain
routing, and an expiry date. Organizations own domains,
projects use subdomains. Cloudflare is the central DNS
manager for all domains on the platform.

## Data Architecture

```
Organization
  └── Domain: "dentour.com"
        ├── registrar: Namecheap (client owns)
        ├── dns_provider: Cloudflare (platform manages)
        ├── cloudflare_zone_id: "abc123"
        ├── status: active
        ├── expires_at: 2027-03-15
        │
        ├── Subdomains → Projects
        │     ├── @ (root) → "Dentour Platform" (prod)
        │     ├── api.* → "Dentour Platform" (API routes)
        │     ├── staging.* → "Dentour Platform" (staging)
        │     └── admin.* → "Dentour Admin Panel"
        │
        ├── Email Config
        │     ├── provider: resend
        │     ├── from: ["info@", "noreply@"]
        │     ├── SPF: ✓  DKIM: ✓  DMARC: ✓
        │     └── MX: configured
        │
        └── SSL: Cloudflare (automatic)
```

### Domain Ownership Model

```
Client buys domain on any registrar
  → Points nameservers to Cloudflare
  → Verifies ownership via TXT record
  → Platform manages DNS from here
  → Client never needs Cloudflare access
  → Client sees status in their dashboard
```

## Requirements

### Requirement: Add Domain

The system SHALL allow organization owners to add
domains to their organization.

#### Scenario: Adding a new domain
- **WHEN** an org owner goes to Settings → Domains → Add
- **THEN** they enter the domain name
- **AND** the system checks if nameservers point to Cloudflare
- **AND** if not, shows instructions:
  "Point nameservers to ns1.cloudflare.com, ns2.cloudflare.com"

#### Scenario: Domain verification
- **WHEN** nameservers are pointed to Cloudflare
- **THEN** the system generates a TXT verification record
- **AND** the owner adds it at their registrar (or system
  adds it via Cloudflare API)
- **AND** the system polls until verified
- **AND** status changes: pending_dns → active

#### Scenario: Domain already in use
- **WHEN** an owner tries to add a domain that belongs
  to another organization
- **THEN** the system rejects: "This domain is already
  registered on the platform"

---

### Requirement: Subdomain Management

The system SHALL allow mapping subdomains to projects.

#### Scenario: Creating a subdomain
- **WHEN** an org owner or admin creates a subdomain
- **THEN** they specify: subdomain prefix, target project,
  environment (production / staging / preview)
- **AND** the system creates DNS records via Cloudflare API

#### Scenario: Root domain mapping
- **WHEN** the root domain (@) is mapped to a project
- **THEN** Cloudflare creates A/AAAA records pointing to
  the deployment (Cloudflare Pages or Workers)

#### Scenario: Subdomain to project
- **WHEN** a subdomain (e.g., api.*) is mapped to a project
- **THEN** Cloudflare creates a CNAME record
- **AND** the project's deployment receives traffic on
  that subdomain

#### Scenario: Multiple subdomains, one project
- **GIVEN** a project "Dentour Platform"
- **THEN** it can have: dentour.com (root), api.dentour.com,
  staging.dentour.com — all pointing to the same project
  with different environments

---

### Requirement: SSL/TLS

The system SHALL provide automatic SSL for all domains.

#### Scenario: SSL provisioning
- **WHEN** a domain is added and DNS is verified
- **THEN** Cloudflare automatically provisions SSL certificate
- **AND** HTTPS is enforced (HTTP → HTTPS redirect)
- **AND** HSTS headers are enabled

#### Scenario: SSL renewal
- **GIVEN** Cloudflare manages SSL
- **THEN** certificates renew automatically
- **AND** no manual intervention needed

---

### Requirement: Email Configuration

The system SHALL support email setup per domain.

#### Scenario: Setting up email
- **WHEN** an org owner enables email for a domain
- **THEN** they choose a provider: Resend, Google Workspace,
  or custom
- **AND** the system configures DNS records:
  MX, SPF (TXT), DKIM (TXT), DMARC (TXT)
- **AND** records are created via Cloudflare API

#### Scenario: Email verification
- **WHEN** email DNS records are created
- **THEN** the system verifies: SPF valid, DKIM valid,
  DMARC configured
- **AND** shows status per record: ✓ or ✗ with fix instructions

#### Scenario: From addresses
- **WHEN** email is configured
- **THEN** the org owner defines allowed from addresses
  (e.g., hello@, noreply@, support@)
- **AND** these are available for the `messages` domain
  and auth emails

---

### Requirement: Domain Expiry Tracking

The system SHALL track domain expiration dates.

#### Scenario: Expiry warning
- **GIVEN** a domain expires in 30 days
- **WHEN** the daily check runs
- **THEN** the org owner receives a notification
- **AND** the domain shows a warning badge in the dashboard

#### Scenario: Expired domain
- **GIVEN** a domain has expired
- **THEN** status changes to `expired`
- **AND** all projects using this domain show a critical alert
- **AND** org owner receives urgent notification

---

### Requirement: Domain Removal

The system SHALL allow organization owners to remove domains safely.

#### Scenario: Removing a domain
- **WHEN** an org owner removes a domain
- **THEN** the system shows impact: X subdomains, Y projects
  affected
- **AND** requires confirmation
- **AND** DNS records are removed from Cloudflare
- **AND** projects using this domain lose their custom domain
  (fall back to default *.pages.dev)

---

### Requirement: Domain Access Control

The system SHALL enforce role-based access control for domain management.

#### Scenario: Permissions by role
- **GIVEN** the following access:
  - owner: add, remove, configure DNS, configure email
  - admin: configure subdomains, map to projects, view DNS
  - member: view domain status only
  - viewer: view domain status only

#### Scenario: Cloudflare access
- **WHEN** a domain is managed by the platform
- **THEN** only the platform (via API) modifies DNS records
- **AND** organization members never need direct Cloudflare
  access
- **AND** all DNS changes are logged in audit trail

---

### Requirement: Platform Domains

The system SHALL manage Pavel's platform domains separately.

#### Scenario: Platform domain setup
- **GIVEN** the platform has its own domains:
  - pavelrapoport.com → web app
  - studio.pavelrapoport.com → studio app
- **THEN** these belong to the platform organization
  ("Pavel Rapoport")
- **AND** are managed by platform admin only
- **AND** cannot be deleted through the regular UI

## Entities

- **Domain** — a registered web address.
  Has: id, organization_id, name, registrar,
  dns_provider, cloudflare_zone_id, status
  (pending_dns / active / expired / removed),
  expires_at, verified_at, created_at
- **Subdomain** — a prefix mapping to a project.
  Has: id, domain_id, prefix (@ for root), project_id,
  environment (production / staging / preview),
  dns_record_type (A / CNAME), cloudflare_record_id
- **EmailConfig** — email setup for a domain.
  Has: id, domain_id, provider (resend / google_workspace /
  custom), from_addresses[], spf_status, dkim_status,
  dmarc_status
- **DomainEvent** — audit log for DNS changes.
  Has: id, domain_id, action, detail, user_id, timestamp

## Dependencies

- `organizations` — domains belong to organizations
- `projects` — subdomains map to projects
- `integrations` — Cloudflare connection for DNS management,
  Resend connection for email
- `auth` — access control by org role
- `messages` — email from addresses used for notifications
