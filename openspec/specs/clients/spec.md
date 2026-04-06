# clients

> People who bring money. Pavel brings them product.

## Purpose

**For whom:** Pavel (manages relationships), clients (eventually —
portal with project status).

**Why it exists:** A client is not a project. One client can have
multiple projects. Need to track who they are, how they came in,
what they need, what stage the relationship is at.

## Requirements

### Requirement: Client Profiles

The system SHALL store client profiles with contact information
and source of acquisition.

#### Scenario: New client created
- **WHEN** a new client is registered (manually or via AI bot)
- **THEN** the system stores name, company, contact, source
- **AND** sets initial status to "lead"

### Requirement: Relationship Lifecycle

The system SHALL track client relationship status through stages.

#### Scenario: Status progression
- **GIVEN** a client with status "lead"
- **WHEN** Pavel accepts the client
- **THEN** status changes to "active"
- **AND** the full lifecycle is: lead → active → completed → returning

### Requirement: Client History

The system SHALL maintain complete history per client —
all projects, conversations, and invoices.

#### Scenario: Viewing client history
- **WHEN** Pavel opens a client profile
- **THEN** he sees all linked projects, message threads, and invoices

### Requirement: Qualification

The system SHALL support fit scoring for incoming leads.

#### Scenario: Qualifying a lead
- **WHEN** a new lead comes in (via `messages` or manually)
- **THEN** the system records fit score, budget range, service type

## Entities

- **Client** — a person or company that pays for work
- **Lead** — an unqualified incoming contact

## Dependencies

- `projects` — client's projects
- `messages` — communication history
- `finance` — invoices and payments
