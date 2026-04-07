# organizations

> Any group of people with shared projects. Company, partnership, studio.

## Purpose

**For whom:** Pavel (creates and manages), clients (their company
is an organization), partners (joint ventures), network members
(assigned through organization).

**Why it exists:** Projects don't belong to people — they belong
to organizations. A company orders a project. Two partners create
a joint venture. Pavel has his own studio. The organization is the
entity that owns projects, pays invoices, and defines who sees what.

## Data Architecture

```
Organization
  ├── Members (users with roles inside this org)
  │     ├── owner — full access, billing, settings, delete
  │     ├── admin — manage projects, invite members
  │     ├── member — see assigned projects, deliverables
  │     └── viewer — read-only access to shared content
  │
  ├── Projects (belong to the organization)
  │     ├── Project A
  │     └── Project B
  │
  └── Billing (invoices, payments — linked to finance)
```

### How it replaces `clients`

Previously: User → Client → Project.
Now: User → Member of Organization → Organization owns Project.

The "client" is now the organization itself. The people inside
are members with roles. This covers all cases:

| Scenario | Organization | Members |
|----------|-------------|---------|
| Company orders a project | "Dentour Ltd" | CEO (admin), designer (member) |
| Partnership | "Pavel + Sergey" | Both as owners |
| Pavel's own work | "Pavel Rapoport" | Pavel (owner) — auto-created |
| Government contract | "Ministry of Health" | Contact person (admin) |
| Solo client | "John Doe" | John (owner) — personal org |

### Personal Organization

Every user gets a personal organization on registration.
This is their default workspace. Solo clients don't need
to "create a company" — their personal org works as one.

```
New user registers
  → Profile created (auth)
  → Personal Organization created (organizations)
  → User is owner of their personal org
```

## Requirements

### Requirement: Organization Types

The system SHALL support different organization types.

#### Scenario: Organization creation
- **WHEN** a new organization is created
- **THEN** it has a type: `personal`, `company`, `partnership`, `government`
- **AND** a name, slug, avatar, and optional description

#### Scenario: Personal org auto-creation
- **WHEN** a new user registers
- **THEN** a personal organization is auto-created
- **AND** the user is set as owner
- **AND** type is `personal`

---

### Requirement: Membership

The system SHALL manage members within organizations
with role-based access.

#### Scenario: Inviting a member
- **WHEN** an owner or admin invites a user by email
- **THEN** an invitation is sent
- **AND** on acceptance, the user becomes a member with
  the assigned role

#### Scenario: Role hierarchy
- **GIVEN** the roles: owner → admin → member → viewer
- **THEN** each role inherits permissions of roles below it
- **AND** owner can do everything including delete org
- **AND** admin can manage projects and members (not delete org)
- **AND** member can view and work on assigned projects
- **AND** viewer can only read shared content

#### Scenario: Removing a member
- **WHEN** an owner or admin removes a member
- **THEN** the member loses access to all org projects
- **AND** their work history is preserved

#### Scenario: Multiple organizations
- **GIVEN** a user can belong to multiple organizations
- **WHEN** they log in
- **THEN** they can switch between organizations
- **AND** each org shows only its own projects and data

---

### Requirement: Organization Settings

The system SHALL allow owners to manage organization settings.

#### Scenario: Managing organization
- **WHEN** an owner opens organization settings
- **THEN** they can edit: name, avatar, description
- **AND** manage members and their roles
- **AND** view billing information (linked to `finance`)
- **AND** see all projects under this organization

---

### Requirement: Organization-Scoped Data

All project data SHALL be scoped to the organization.

#### Scenario: Data isolation
- **WHEN** a member queries projects
- **THEN** they only see projects of organizations they belong to
- **AND** RLS enforces this at database level

#### Scenario: Cross-org isolation
- **GIVEN** user is member of Org A and Org B
- **WHEN** they are in Org A context
- **THEN** they cannot see Org B data

---

### Requirement: Organization Switching

The system SHALL allow users to switch between their organizations.

#### Scenario: Switching context
- **WHEN** a user belongs to multiple organizations
- **THEN** they see an org switcher in the UI
- **AND** switching changes all visible data to that org's scope
- **AND** current org is stored in session/cookie

## Entities

- **Organization** — a group that owns projects.
  Has: id, name, slug, type (personal/company/partnership/government),
  avatar_url, description, created_at
- **OrganizationMember** — a user's membership in an org.
  Has: id, organization_id, user_id, role (owner/admin/member/viewer),
  invited_by, joined_at
- **Invitation** — a pending invite to join an org.
  Has: id, organization_id, email, role, invited_by,
  status (pending/accepted/expired), expires_at

## Dependencies

- `auth` — members are users, RLS scoped by org membership
- `projects` — projects belong to organizations
- `finance` — billing and invoices per organization
- `network` — network members can be assigned through org context
