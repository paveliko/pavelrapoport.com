# ai

> The brain of the automation layer. One agent, multiple modes.

## Purpose

**For whom:** Pavel (configures and directs), clients (interact
through chat), the system (executes tasks autonomously).

**Why it exists:** Everything that can be delegated to AI, will be.
The agent handles client discovery, codebase scanning, spec
generation, implementation planning, and code writing.

## Requirements

### Requirement: Agent Modes

The AI agent SHALL operate in distinct modes, each with its
own system prompt, constraints, and output format.

#### Scenario: Mode switching
- **GIVEN** the agent is active
- **WHEN** context changes (public chat vs studio vs pipeline)
- **THEN** the agent switches mode accordingly

Modes:
- **Canvas** — client-facing, builds domain maps from conversation
- **Scout** — scans existing codebases, extracts specs
- **Architect** — takes tasks, generates proposal → design → tasks
- **Builder** — executes approved plans, writes code, opens PRs

### Requirement: Agent Configuration

The system SHALL allow Pavel to configure agent prompts,
personality, and constraints per mode.

#### Scenario: Editing a mode prompt
- **WHEN** Pavel updates a system prompt for a mode
- **THEN** all subsequent conversations use the new prompt

### Requirement: Model Management

The system SHALL support selecting which AI model handles
which task.

#### Scenario: Assigning a model to a task type
- **WHEN** Pavel configures which model handles a task type
- **THEN** the agent uses the selected model for that task

### Requirement: Token Tracking

The system SHALL track token usage and costs per session,
per project.

#### Scenario: Viewing AI costs
- **WHEN** Pavel checks a project's AI costs
- **THEN** he sees total tokens in/out, cost in USD, broken by session

### Requirement: Knowledge Base

The agent SHALL have access to Pavel's stack preferences,
standards, and conventions as persistent context.

#### Scenario: Agent uses project conventions
- **WHEN** the agent generates code or specs
- **THEN** it applies conventions from the knowledge base

## Entities

- **Agent** — the AI agent instance
- **Mode** — a configuration set (prompt, constraints, output format)
- **Session** — a single conversation or task execution
- **KnowledgeBase** — persistent context the agent draws from

## Dependencies

- `messages` — Canvas mode serves the chat interface
- `studio` — Architect and Builder modes serve the pipeline
- `projects` — agent operates within project scope
- `finance` — token costs feed into finance
