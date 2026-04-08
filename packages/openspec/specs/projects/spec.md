# projects

> The central node of the ecosystem. Where all domains meet.

## Purpose

**For whom:** Pavel (manages), organization members (their product),
network members (their assignments), AI (executes within project scope).

**Why it exists:** A project is where all domains converge. It belongs
to an organization, has team members, specs, a domain map, a pipeline,
and a budget. Everything connects through a project.

## Data Architecture

```
Organization (owner of the project)
  └── Project
        ├── organization_id → who owns this
        ├── created_by → who created it (user_id)
        │
        ├── Team (network members assigned)
        │     ├── Designer (via network)
        │     └── Copywriter (via network)
        │
        ├── Domain Map (visual entity graph)
        ├── Specs (versioned, from entities)
        ├── Pipeline (changes board)
        ├── Connections (via integrations)
        │     ├── GitHub repo
        │     ├── Linear team
        │     └── Supabase project
        │
        └── Budget (planned vs actual → finance)
```

### Access Model

Project access is determined by organization membership:

```
Can this user see this project?
  1. Is user a member of the project's organization? (org membership)
  2. What is their role in the org? (owner/admin/member/viewer)
  3. Are they assigned to this specific project? (for member/viewer)
```

- **owner/admin** of org → see all org projects
- **member** of org → see only projects they're assigned to
- **viewer** of org → read-only on assigned projects
- **Pavel (admin)** → sees everything across all orgs

## Requirements

### Requirement: Project Profile

Each project SHALL have a name, slug, status, and belong
to an organization.

#### Scenario: Creating a project
- **WHEN** a user creates a project in studio
- **THEN** it gets a name, unique slug, initial status "shaping"
- **AND** it belongs to the currently active organization
- **AND** created_by records who created it

Status lifecycle: shaping → speccing → building → delivered

#### Scenario: Project belongs to organization
- **GIVEN** a project is created under "Dentour Ltd"
- **THEN** all members of "Dentour Ltd" with sufficient role
  can access it
- **AND** members of other organizations cannot see it

---

### Requirement: Project Init

A project SHALL support initialization with external
service configuration.

#### Scenario: Connecting services
- **WHEN** Pavel inits a project
- **THEN** he configures: Linear team, GitHub repo, Supabase
  project, AI model preferences
- **AND** connections are stored via `integrations` domain
- **AND** all are scoped to this project

#### Scenario: Template init
- **WHEN** Pavel creates a project with a template
- **THEN** predefined connections and domain structure are applied

---

### Requirement: Domain Map

Each project SHALL have an interactive entity graph.

#### Scenario: Viewing domain map
- **WHEN** a user opens a project's domain tab
- **THEN** they see all entities and relationships as
  an interactive graph (via @repo/domain-map)
- **AND** access level determines edit vs read-only

---

### Requirement: Specs

Each project SHALL maintain versioned specs generated
from entities.

#### Scenario: Generating specs
- **WHEN** a project's entities are defined
- **THEN** specs are generated in OpenSpec format
- **AND** each spec is versioned

---

### Requirement: Pipeline

Each project SHALL have a changes board tracking the
full lifecycle.

#### Scenario: Tracking a change
- **WHEN** a change is proposed
- **THEN** it appears on the board
- **AND** moves through: proposal → approve → ship

---

### Requirement: Team

Each project SHALL track which network members are assigned.

#### Scenario: Assigning a team member
- **WHEN** Pavel assigns a network member to a project
- **THEN** they appear in the project team
- **AND** they get access to project deliverables and briefs
- **AND** they must be a member of the project's organization
  OR invited as an external contributor

---

### Requirement: Budget

Each project SHALL track planned vs actual costs.

#### Scenario: Budget tracking
- **WHEN** Pavel checks a project's budget
- **THEN** he sees planned vs actual costs
- **AND** breakdown by: AI tokens, network payments, infra
- **AND** linked to `finance` for invoicing

---

### Requirement: Project-Level Permissions

The system SHALL enforce project access based on organization role.

#### Scenario: Organization member access
- **WHEN** an org member opens a project
- **THEN** org owners/admins see everything
- **AND** org members see only assigned projects
- **AND** org viewers see read-only on assigned projects

#### Scenario: Admin override
- **WHEN** Pavel (platform admin) opens any project
- **THEN** he has full access regardless of org membership

## Entities

- **Project** — a piece of work with a lifecycle.
  Has: id, organization_id, created_by, name, slug, status,
  description, created_at, updated_at
- **DomainMap** — interactive entity graph for the project
- **Spec** — versioned specification document
- **Change** — a pipeline item (proposal → ship)
- **ProjectConfig** — external service connections
  (via `integrations`)
- **ProjectAssignment** — network member assigned to project.
  Has: project_id, network_member_id, role, brief

## Dependencies

- `organizations` — project belongs to an organization
- `auth` — access scoped by org membership + role
- `network` — team assignments
- `studio` — where the project is managed
- `ai` — executes within project scope
- `finance` — project budget and costs
- `integrations` — project-scoped connections
