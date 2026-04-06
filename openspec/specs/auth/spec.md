# auth

> Who has access to what.

## Purpose

**For whom:** Everyone — Pavel, clients, network members, community.
Each sees only what they should see.

**Why it exists:** The ecosystem has multiple roles with different
access levels. Studio is Pavel-only today, but tomorrow clients see
their project status, network members see their briefs, and community
members get access zones. Auth grows with the platform.

## Requirements

### Requirement: Authentication

The system SHALL authenticate users via Supabase Auth.

#### Scenario: Login
- **WHEN** a user logs in
- **THEN** a session is created with role-based claims

### Requirement: Roles

The system SHALL support distinct roles with different
access levels.

#### Scenario: Role assignment
- **GIVEN** the following roles exist:
  - **owner** — Pavel, full access
  - **client** — sees their projects, invoices, messages
  - **network** — sees their assignments, briefs, deliverables
  - **community** — access to designated zones (future)
  - **public** — unauthenticated, sees `web` only

### Requirement: Permissions

The system SHALL enforce per-domain, per-project permissions.

#### Scenario: Client accessing studio
- **WHEN** a client tries to access /studio
- **THEN** access is denied
- **AND** they are redirected to their portal

### Requirement: Row-Level Security

The system SHALL use Supabase RLS policies to enforce
data access at the database level.

#### Scenario: Client querying projects
- **WHEN** a client queries the projects table
- **THEN** they only see projects where they are the client

## Entities

- **User** — an authenticated person
- **Role** — a named permission set
- **Session** — an active authentication session

## Dependencies

- All domains depend on `auth` for access control
