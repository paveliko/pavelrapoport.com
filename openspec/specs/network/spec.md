# network

> People Pavel works with — specialists, consultants, creatives.

## Purpose

**For whom:** Pavel (finds and coordinates), network members
(eventually — receive briefs, share deliverables).

**Why it exists:** Pavel works with many people — designers,
lawyers, accountants, 3D artists, agents. He needs to know
who does what, who is available, and what the status of
their work or advice is.

## Requirements

### Requirement: Member Profiles

The system SHALL store professional profiles for each
network member.

#### Scenario: Adding a network member
- **WHEN** Pavel adds a new person to the network
- **THEN** the system stores name, specialty, role, rate, portfolio link
- **AND** sets availability status

### Requirement: Availability Tracking

The system SHALL track availability of network members.

#### Scenario: Checking who is free
- **WHEN** Pavel needs a designer for a project
- **THEN** he can filter network by specialty and availability
- **AND** see who is free / busy / on which project

### Requirement: Assignments

The system SHALL link network members to projects with
specific briefs.

#### Scenario: Assigning a person to a project
- **WHEN** Pavel assigns a network member to a project
- **THEN** the assignment includes: project, entity, brief description
- **AND** the member can see their brief (future)

### Requirement: Deliverables

The system SHALL track deliverables per assignment.

#### Scenario: Deliverable lifecycle
- **WHEN** a network member uploads work
- **THEN** it goes through: upload → review → approve cycle

## Entities

- **Member** — a person in Pavel's professional network
- **Assignment** — a member linked to a project with a brief
- **Deliverable** — work product from a member

## Dependencies

- `projects` — assignments live within projects
- `finance` — payments to network members
