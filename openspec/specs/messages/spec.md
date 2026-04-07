# messages

> Communication layer. AI chat is the front door.

## Purpose

**For whom:** Clients (talk to the AI bot first, then to Pavel),
network members (receive briefs, ask questions), Pavel (sees
everything in one place).

**Why it exists:** The AI bot is the front door. A client lands
on the site, starts chatting, the bot qualifies them, answers
questions, creates entities (new client, new project). Then human
communication flows through the same channel.

## Requirements

### Requirement: AI Chat (Canvas Mode)

The site SHALL provide an AI-powered chat as the primary
entry point for visitors.

#### Scenario: First conversation
- **WHEN** a visitor starts a chat on the site
- **THEN** Muse greets them in their detected language
- **AND** the domain map canvas appears alongside the chat
- **AND** as conversation progresses, entities appear on the canvas

#### Scenario: Language detection
- **WHEN** a visitor sends their first message
- **THEN** Muse detects the language (EN/RU/HE)
- **AND** responds in the same language for the rest of the session

#### Scenario: Session limits
- **GIVEN** a Canvas session
- **THEN** max 20 messages, max 15 entities
- **AND** at message 18: Muse starts wrapping up
- **AND** at message 20: session auto-completes with summary

#### Scenario: Session persistence
- **GIVEN** a visitor closes the browser mid-session
- **WHEN** they return within 24 hours from the same browser
- **THEN** the session resumes where they left off
- **AND** domain map and messages are preserved

### Requirement: Entity Creation via Chat

The AI bot SHALL be able to create domain entities from
conversation context.

#### Scenario: Bot creates entities
- **WHEN** the bot detects domain structure in conversation
- **THEN** it generates `domain_update` JSON per message
- **AND** entities and relationships appear on the canvas
- **AND** each entity has: id, label, category, attributes, visual_hint

#### Scenario: Bot creates lead
- **WHEN** the session completes and client provides contact info
- **THEN** Muse creates a Lead entity in `clients` domain
- **AND** notifies Pavel via email (Resend)
- **AND** lead includes: name, email, company, fit_score, session link

### Requirement: Human Conversations

The system SHALL support direct messaging between Pavel,
clients, and network members.

#### Scenario: Pavel replies to a client
- **WHEN** a bot hands off to Pavel
- **THEN** Pavel continues the conversation in the same thread
- **AND** the client sees a seamless transition (same chat UI)

#### Scenario: Thread per project
- **GIVEN** an active project with a client
- **THEN** a message thread is linked to the project
- **AND** all participants (Pavel, client, network members) can post
- **AND** messages are persisted and searchable

#### Scenario: Internal notes
- **WHEN** Pavel writes a message marked as "internal"
- **THEN** only admin and assigned network members see it
- **AND** the client never sees internal notes

### Requirement: Notifications

The system SHALL notify relevant parties of events.

#### Scenario: Notification triggers
- **GIVEN** the following events trigger notifications:
  - New Canvas session completed → Pavel
  - New message in thread → all thread participants
  - Task assigned → assignee
  - Invoice sent → client
  - Invoice overdue → Pavel + client
  - Pipeline change (PR merged, phase change) → Pavel
  - Session expiring (message 18/20) → visitor (in-chat)

#### Scenario: Notification channels
- **GIVEN** a notification trigger
- **THEN** the system delivers via (in priority order):
  1. In-app notification (always)
  2. Email via Resend (configurable per user)
  3. Future: Telegram bot, push notification

#### Scenario: Notification preferences
- **WHEN** a user opens notification settings
- **THEN** they can toggle per channel (email on/off)
- **AND** set quiet hours (no emails between 22:00-08:00)
- **AND** batch non-urgent notifications (digest every 4 hours)

#### Scenario: Notification in URL
- **WHEN** a user clicks a notification
- **THEN** it navigates to the exact URL of the referenced entity
- **AND** the relevant context is visible (message, task, invoice)

### Requirement: Chat History

The system SHALL persist and allow searching of all conversations.

#### Scenario: Search messages
- **WHEN** Pavel searches for text across all conversations
- **THEN** results show: message snippet, sender, date, project
- **AND** clicking a result opens the thread at that message

#### Scenario: Export conversation
- **WHEN** Pavel exports a conversation
- **THEN** the system generates a markdown file with all messages
- **AND** includes: timestamps, sender names, domain map snapshot

## Entities

- **Conversation** — a thread between participants
- **Message** — a single message in a conversation
- **CanvasSession** — an AI chat session with a visitor
  (extends Conversation with domain_graph)
- **Notification** — an alert about a message or event
- **NotificationPreference** — per-user channel settings

## Dependencies

- `ai` — bot logic for the chat interface
- `clients` — lead creation from chat
- `projects` — conversations linked to projects
- `web` — chat lives on the public site
- `auth` — thread visibility based on roles
