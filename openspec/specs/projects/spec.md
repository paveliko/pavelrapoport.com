# projects

> The central node of the ecosystem. Where all domains meet.

## Purpose

**For whom:** Pavel (manages), clients (their product), network
members (their assignments), AI (executes within project scope).

**Why it exists:** A project is where all domains converge. It has
a client, network members, specs, a domain map, a pipeline, and a
budget. Everything connects through a project.

## Requirements

### Requirement: Project Profile

Each project SHALL have a name, slug, status, and client link.

#### Scenario: Creating a project
- **WHEN** Pavel creates a project in studio
- **THEN** it gets a name, unique slug, initial status "shaping"
- **AND** optionally links to a client

Status lifecycle: shaping → speccing → building → delivered

### Requirement: Project Init

A project SHALL support initialization with external service
configuration.

#### Scenario: Connecting services
- **WHEN** Pavel inits a project
- **THEN** he can configure: Linear team, GitHub repo, Supabase
  project, AI model preferences
- **AND** all variables are stored and used by the pipeline

### Requirement: Domain Map

Each project SHALL have an interactive entity graph
(OpenSpec visualized).

#### Scenario: Viewing domain map
- **WHEN** Pavel opens a project's domain tab
- **THEN** he sees all entities and relationships as an interactive graph

### Requirement: Specs

Each project SHALL maintain versioned specs generated from entities.

#### Scenario: Generating a spec from entities
- **WHEN** a project's entities are defined
- **THEN** specs are generated and versioned automatically

### Requirement: Pipeline

Each project SHALL have a changes board tracking the full
lifecycle: proposal → approve → ship.

#### Scenario: Tracking a change through the pipeline
- **WHEN** a change is proposed
- **THEN** it appears on the board and moves through proposal → approve → ship

### Requirement: Team

Each project SHALL track which network members are assigned.

#### Scenario: Viewing project team
- **WHEN** Pavel opens a project
- **THEN** he sees which network members are assigned and their roles

### Requirement: Budget

Each project SHALL track planned vs actual costs, linked
to `finance`.

#### Scenario: Comparing planned vs actual budget
- **WHEN** Pavel checks a project's budget
- **THEN** he sees planned vs actual costs with variance

## Entities

- **Project** — a piece of work with a lifecycle
- **DomainMap** — interactive entity graph
- **Spec** — versioned specification document
- **Change** — a pipeline item (proposal → ship)
- **ProjectConfig** — external service connections

## Dependencies

- `clients` — who the project is for
- `network` — who is working on it
- `studio` — where the project is managed
- `ai` — executes within project scope
- `finance` — project budget and costs
