# tasks

> Work that needs to be done. Assigned to anyone — people or AI.

## Purpose

**For whom:** Pavel (manages and reviews), network members
(receive and complete), AI agent (creates and executes),
clients (eventually — see their task status).

**Why it exists:** Everything in the platform produces work.
An email comes in → task. A spec is approved → task. A client
asks a question → task. A deadline approaches → task. Tasks
are the universal unit of work, assigned to anyone in the
system — humans or AI agents.

## Data Architecture

### Polymorphic Assignment

A task can be assigned to any entity in the system:

```
Task
  ├── assignee_type: "user" | "ai_agent"
  ├── assignee_id: → user profile id or agent mode id
  │
  ├── linked_to_type: "project" | "client" | "organization"
  │                   | "domain" | "connection" | "spec"
  ├── linked_to_id: → any entity in the system
  │
  └── source: where the task came from
```

### Task Sources

Tasks can be created by anyone and anything:

```
Sources:
  manual     → Pavel creates a task in studio
  ai         → AI agent creates task from analysis
  email      → Gmail inbox parsed by AI → task extracted
  calendar   → Google Calendar event → reminder task
  linear     → Linear issue synced as task
  webhook    → External event triggers a task
  system     → Automated: domain expiring, key rotation due
```

### Examples

```
Task: "Review Dentour contract"
  assignee: Pavel (user)
  linked_to: Project "Dentour Platform"
  source: manual
  priority: high
  due: 2026-04-10

Task: "Summarize this morning's emails"
  assignee: AI Agent (Canvas mode)
  linked_to: Organization "Rapoport Studio"
  source: system (daily 8am trigger)
  priority: medium

Task: "Upload brand assets"
  assignee: Designer (network member)
  linked_to: Project "Dentour Platform"
  source: ai (AI created from brief)
  priority: medium

Task: "Rotate Sentry API key"
  assignee: Pavel (user)
  linked_to: Connection "sentry-dentour"
  source: system (90-day rotation schedule)
  priority: high

Task: "Respond to client inquiry"
  assignee: AI Agent (Canvas mode)
  linked_to: Client "John Doe"
  source: email (Gmail → AI parsed)
  priority: medium

Task: "Prepare tax documents"
  assignee: Accountant (network member)
  linked_to: Organization "Rapoport Studio"
  source: manual
  priority: high
  due: 2026-06-30
```

## Requirements

### Requirement: Task CRUD

The system SHALL support creating, reading, updating,
and completing tasks.

#### Scenario: Creating a task
- **WHEN** a user creates a task
- **THEN** it has: title, description (optional), assignee,
  linked entity (optional), priority, due date (optional)
- **AND** status is set to `todo`

#### Scenario: Task status lifecycle
- **GIVEN** a task exists
- **THEN** it moves through: todo → in_progress → done
- **AND** optionally: todo → cancelled
- **AND** status changes are timestamped

---

### Requirement: Polymorphic Assignment

Tasks SHALL be assignable to any entity type in the system.

#### Scenario: Assign to user
- **WHEN** a task is assigned to a user
- **THEN** the user sees it in their task list
- **AND** they receive a notification

#### Scenario: Assign to AI agent
- **WHEN** a task is assigned to the AI agent
- **THEN** the agent picks it up based on its mode
- **AND** executes autonomously or asks for clarification
- **AND** marks done when complete

#### Scenario: Reassign
- **WHEN** a task is reassigned from AI to a user (or vice versa)
- **THEN** both parties are notified
- **AND** task history records the change

---

### Requirement: Polymorphic Linking

Tasks SHALL be linkable to any entity in the system.

#### Scenario: Task linked to project
- **WHEN** a task is linked to a project
- **THEN** it appears in the project's task board

#### Scenario: Task linked to client
- **WHEN** a task is linked to a client
- **THEN** it appears in the client's activity feed

#### Scenario: Task linked to connection
- **WHEN** a task is linked to a connection (e.g., key rotation)
- **THEN** it appears in the integrations dashboard

#### Scenario: Unlinked task
- **WHEN** a task has no linked entity
- **THEN** it appears only in the assignee's personal task list

---

### Requirement: AI Task Creation

The AI agent SHALL create tasks from external sources.

#### Scenario: Email → task
- **GIVEN** AI agent has access to Gmail via Google Workspace
- **WHEN** an email arrives that contains an actionable request
- **THEN** the AI creates a task with:
  title extracted from email subject/content,
  source = `email`, linked_to = relevant client or project
- **AND** Pavel reviews and approves (or auto-approves
  based on rules)

#### Scenario: Calendar → task
- **GIVEN** AI agent has access to Google Calendar
- **WHEN** an event is approaching (e.g., meeting tomorrow)
- **THEN** the AI creates preparation tasks:
  "Prepare agenda for Dentour meeting"
- **AND** assigns to Pavel or relevant team member

#### Scenario: Linear → task sync
- **GIVEN** a Linear issue is created or updated
- **WHEN** the webhook fires
- **THEN** the system creates or updates a matching task
- **AND** status syncs bidirectionally

#### Scenario: System → task
- **WHEN** a system event occurs (domain expiring, key
  rotation due, budget exceeded)
- **THEN** a task is auto-created with appropriate priority
- **AND** assigned to the responsible person (org owner
  for keys, Pavel for platform)

---

### Requirement: Task Visibility

Tasks SHALL respect organization and project access rules.

#### Scenario: Task scoped to project
- **GIVEN** a task is linked to a project
- **THEN** only users who can access that project can see
  the task (follows project access model)

#### Scenario: Task scoped to organization
- **GIVEN** a task is linked to an organization
- **THEN** org members can see it based on their org role

#### Scenario: Personal tasks
- **GIVEN** a task has no linked entity
- **THEN** only the assignee and platform admin can see it

---

### Requirement: Task Priority

The system SHALL support priority levels for task ordering.

#### Scenario: Priority levels
- **GIVEN** a task is created
- **THEN** priority is one of: `low`, `medium`, `high`, `urgent`
- **AND** urgent tasks trigger immediate notification
- **AND** high tasks appear at the top of task lists

---

### Requirement: Task Board Views

The system SHALL provide multiple views for browsing tasks.

#### Scenario: My tasks
- **WHEN** any user opens their task list
- **THEN** they see all tasks assigned to them
- **AND** grouped by: today, upcoming, overdue

#### Scenario: Project tasks
- **WHEN** a user opens a project's task board
- **THEN** they see all tasks linked to that project
- **AND** grouped by status: todo, in_progress, done

#### Scenario: AI tasks
- **WHEN** Pavel opens the AI task queue
- **THEN** he sees all tasks assigned to AI agents
- **AND** their status: pending, executing, done, failed
- **AND** can reassign failed tasks to humans

## Entities

- **Task** — a unit of work.
  Has: id, title, description, status (todo/in_progress/done/cancelled),
  priority (low/medium/high/urgent), source (manual/ai/email/calendar/
  linear/webhook/system), assignee_type, assignee_id,
  linked_to_type, linked_to_id, organization_id,
  due_at, created_by, created_at, updated_at,
  completed_at
- **TaskComment** — a note on a task.
  Has: id, task_id, author_id, content, created_at
- **TaskHistory** — audit trail of task changes.
  Has: id, task_id, action (created/assigned/status_changed/
  priority_changed/completed/cancelled), old_value,
  new_value, changed_by, timestamp

## Dependencies

- `auth` — task visibility follows access model
- `organizations` — tasks scoped by org membership
- `projects` — tasks linked to projects
- `clients` — tasks linked to clients
- `network` — tasks assigned to network members
- `ai` — AI agent creates and executes tasks
- `integrations` — Gmail, Calendar, Linear as task sources
- `messages` — task notifications
