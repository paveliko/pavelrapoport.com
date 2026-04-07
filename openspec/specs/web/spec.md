# web

> Public face of pavelrapoport.com — the first thing anyone sees.

## Purpose

**For whom:** Potential clients, partners, anyone who finds Pavel Rapoport.

**Why it exists:** Sells without selling. Shows who Pavel is, what he
delivers, and proves it with numbers. The site itself demonstrates the value.

## Requirements

### Requirement: Landing Page

The landing page SHALL communicate Pavel's positioning, track record,
and services within seconds of arrival.

#### Scenario: First visit
- **WHEN** a visitor lands on pavelrapoport.com
- **THEN** they see: tagline, what Pavel delivers, proof with numbers
- **AND** there is a visible chat entry point (Muse)
- **AND** page loads in < 2 seconds (Lighthouse performance ≥ 90)

#### Scenario: Chat entry point
- **WHEN** a visitor clicks the chat entry
- **THEN** Muse Canvas opens (split layout: chat | domain map)
- **AND** Muse greets in the visitor's detected language (EN/RU/HE)

#### Scenario: Mobile experience
- **WHEN** a visitor opens the site on mobile
- **THEN** they see a responsive layout (no horizontal scroll)
- **AND** chat and domain map stack vertically
- **AND** all CTAs are thumb-reachable

### Requirement: Portfolio / Case Studies

The site SHALL display case studies linked to the `blog` domain.

#### Scenario: Case study listing
- **WHEN** a visitor scrolls to the portfolio section
- **THEN** they see 3-5 case studies as cards
- **AND** each card shows: project name, one-line result, visual

#### Scenario: Case study detail
- **WHEN** a visitor clicks a case study
- **THEN** they see: Problem → Solution → Result with a number
- **AND** the page has proper SEO meta and open graph

### Requirement: SEO & Meta

The system SHALL provide proper SEO metadata on every page.

#### Scenario: Search engine indexing
- **WHEN** Google crawls pavelrapoport.com
- **THEN** it finds: meta title, description, open graph image
- **AND** structured data (JSON-LD: Person, WebSite, Article)
- **AND** sitemap.xml and robots.txt are present

#### Scenario: Social sharing
- **WHEN** someone shares a page URL on social media
- **THEN** the preview shows: title, description, branded image
- **AND** each page has unique og:title and og:description

### Requirement: Multi-Language

The system SHALL support multiple languages with RTL layout.

#### Scenario: Language detection
- **WHEN** a visitor arrives
- **THEN** the system detects preferred language from browser
- **AND** defaults to English if unsure
- **AND** language switcher is visible (EN / RU / HE)

#### Scenario: Hebrew layout
- **WHEN** the user switches to Hebrew
- **THEN** the entire layout mirrors to RTL
- **AND** text alignment, navigation, icons — all flip

### Requirement: Performance

The system SHALL meet Core Web Vitals thresholds on all public pages.

#### Scenario: Core Web Vitals
- **GIVEN** the public site
- **THEN** LCP < 2.5s, FID < 100ms, CLS < 0.1
- **AND** Lighthouse score ≥ 90 on all categories

### Requirement: Shareable Domain Maps

The system SHALL generate shareable links for completed Canvas sessions.

#### Scenario: Sharing a Canvas session
- **WHEN** a Canvas session is completed
- **THEN** a shareable link is generated: /s/[session-id]
- **AND** anyone with the link sees: read-only domain map
- **AND** no auth required for viewing
- **AND** the map includes: entities, relationships, notes

## Entities

- **Page** — a public page (landing, about, contact)
- **CaseStudy** — a portfolio entry (links to `blog`)
- **ShareableMap** — read-only domain map snapshot

## Dependencies

- `blog` — case studies content
- `messages` — chat entry point (Muse Canvas)
- `auth` — no auth for public pages, but chat may create lead
