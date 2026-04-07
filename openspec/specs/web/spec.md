# web

> Public face of pavelrapoport.com — the first thing anyone sees.

## Purpose

**For whom:** Potential clients, partners, anyone who finds Pavel Rapoport.

**Why it exists:** Sells without selling. Shows who Pavel is, what he
delivers, and proves it with numbers. The site itself demonstrates the value.

## Requirements

### Requirement: Landing page

The landing page SHALL communicate Pavel's positioning, track record,
and services within seconds of arrival.

#### Scenario: First visit
- **WHEN** a visitor lands on pavelrapoport.com
- **THEN** they see who Pavel is, what he delivers, and proof with numbers
- **AND** there is a clear entry point to start a conversation (links to `messages`)

### Requirement: Portfolio

The site SHALL display case studies linked to the `blog` domain.

#### Scenario: Viewing a case study
- **WHEN** a visitor clicks on a portfolio item
- **THEN** they see a structured case: Problem → Solution → Result with a number

### Requirement: SEO & Meta

The site SHALL include proper meta tags, open graph, and structured data
for search engine visibility and social sharing.

#### Scenario: Page meta tags
- **WHEN** a page is rendered
- **THEN** it includes meta title, description, open graph, and structured data

## Entities

- **Page** — a public page (landing, about, contact)
- **CaseStudy** — a portfolio entry (links to `blog`)

## Dependencies

- `blog` — case studies content
- `messages` — contact entry point
