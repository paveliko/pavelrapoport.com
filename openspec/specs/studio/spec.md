# studio

> The production engine. Ideas become specs, specs become code.

## Purpose

**For whom:** Pavel and his creative collaborators — designers,
copywriters, artists.

**Why it exists:** This is where ideas become specs and specs become
code. The studio visualizes domain structure so everyone sees the same
picture, then automates the path from spec to shipped product.

## Requirements

### Requirement: OpenSpec Visualizer

The studio SHALL provide an interactive graph of entities,
relationships, and specs across a project.

#### Scenario: Viewing a project domain map
- **WHEN** Pavel opens a project in studio
- **THEN** he sees an interactive graph of all entities and relationships
- **AND** he can click any entity to see its spec, attributes, and status

### Requirement: Code Generation

The studio SHALL automate code generation from approved specs.

#### Scenario: Generating code from spec
- **WHEN** a spec is approved
- **THEN** the system generates a branch, writes code, and opens a PR
- **AND** all changes reference the originating spec

### Requirement: Creative Workspace

The studio SHALL support collaborative spec authoring with
creative team members.

#### Scenario: Expanding a spec with a designer
- **WHEN** Pavel invites a collaborator to a project
- **THEN** they can see the domain map, add mood boards, references
- **AND** expand specs with visual and brand direction

### Requirement: Project Creation

Every new project SHALL be created through the studio.

#### Scenario: Starting a new project
- **WHEN** Pavel creates a new project
- **THEN** the system initializes a domain map, empty specs, and pipeline
- **AND** connects to Linear workspace and GitHub repo

### Requirement: Pipeline View

The studio SHALL display the full lifecycle of changes:
spec → propose → review → PR → ship.

#### Scenario: Viewing the pipeline
- **WHEN** Pavel opens a project's pipeline in studio
- **THEN** he sees all changes and their current phase in the lifecycle

## Entities

- **Workspace** — the studio environment for a project
- **Visualizer** — interactive OpenSpec graph renderer
- **Pipeline** — change lifecycle manager
- **Brief** — creative brief generated from entity data

## Dependencies

- `projects` — studio operates on projects
- `ai` — code generation and spec expansion
- `auth` — studio is access-controlled
