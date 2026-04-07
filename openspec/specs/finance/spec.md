# finance

> All the money — in and out. No spreadsheets.

## Purpose

**For whom:** Pavel (tracks everything), eventually — accountant,
tax reporting.

**Why it exists:** Pavel needs to know if he's making money. Per
project, per client, per month. How much AI costs, how much network
members cost, what's the margin. It's in the system, not in spreadsheets.

## Requirements

### Requirement: Revenue Tracking

The system SHALL track invoices to clients and payment status.

#### Scenario: Creating an invoice
- **WHEN** Pavel invoices a client for a project
- **THEN** the system records amount, date, status (sent → paid → overdue)

### Requirement: Expense Tracking

The system SHALL track all expenses: network member payments,
AI token costs, infrastructure, tools.

#### Scenario: AI cost recorded
- **WHEN** an AI session completes
- **THEN** token usage and cost are recorded against the project

#### Scenario: Network member payment
- **WHEN** Pavel pays a network member
- **THEN** the payment is recorded against the project and assignment

### Requirement: Per-Project P&L

The system SHALL calculate profit and loss per project.

#### Scenario: Viewing project profitability
- **WHEN** Pavel opens a project's financial view
- **THEN** he sees revenue minus all costs (AI, network, infra)

### Requirement: Financial Planning

The system SHALL support monthly and quarterly financial goals.

#### Scenario: Setting a financial goal
- **WHEN** Pavel creates a financial goal for a time period
- **THEN** the system tracks progress against the target amount

### Requirement: Reports

The system SHALL generate reports: margin by project,
by client, by time period.

#### Scenario: Generating a margin report
- **WHEN** Pavel requests a report for a time period
- **THEN** the system shows margin broken down by project and client

## Entities

- **Invoice** — a bill to a client
- **Expense** — a cost (AI tokens, network payment, tool, infra)
- **ProjectPnL** — calculated profit/loss per project
- **FinancialGoal** — a target for a time period

## Dependencies

- `projects` — costs and revenue per project
- `clients` — invoices linked to clients
- `network` — payments to members
- `ai` — token costs
