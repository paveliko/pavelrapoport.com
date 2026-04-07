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

### Requirement: AI Chat

The site SHALL provide an AI-powered chat as the primary
entry point for visitors.

#### Scenario: First conversation
- **WHEN** a visitor starts a chat on the site
- **THEN** the AI bot responds, qualifies them, answers questions
- **AND** can create entities: new client, new project

### Requirement: Entity Creation via Chat

The AI bot SHALL be able to create domain entities from
conversation context.

#### Scenario: Bot creates a client
- **WHEN** the bot determines a visitor is a potential client
- **THEN** it creates a Client entity in the `clients` domain
- **AND** notifies Pavel

### Requirement: Human Conversations

The system SHALL support direct messaging between Pavel,
clients, and network members.

#### Scenario: Pavel replies to a client
- **WHEN** a bot hands off to Pavel
- **THEN** Pavel continues the conversation in the same thread

### Requirement: Notifications

The system SHALL notify relevant parties of new messages,
new leads, and task updates.

#### Scenario: New message notification
- **WHEN** a new message is received in a conversation
- **THEN** the system notifies all relevant participants

### Requirement: Chat History

All conversations SHALL be searchable and linked to projects.

#### Scenario: Searching chat history
- **WHEN** a user searches conversations by keyword
- **THEN** the system returns matching messages across all accessible threads

## Entities

- **Conversation** — a thread between participants
- **Message** — a single message in a conversation
- **BotSession** — an AI chat session with a visitor
- **Notification** — an alert about a message or event

## Dependencies

- `ai` — bot logic for the chat interface
- `clients` — entity creation from chat
- `projects` — conversations linked to projects
- `site` — chat lives on the public site
