# blog

> Proof of expertise. Every case study is a sales argument.

## Purpose

**For whom:** The public — potential clients, developers, anyone
searching for expertise in AI, design systems, frontend architecture.

**Why it exists:** SEO and credibility. Every article demonstrates
expertise. Every case study follows the format: Problem → What
Pavel did → Result with a number.

## Requirements

### Requirement: Articles

The system SHALL support markdown articles with categories and tags.

#### Scenario: Publishing an article
- **WHEN** Pavel writes an article
- **THEN** it goes through: draft → review → published
- **AND** gets proper SEO meta, open graph, and structured data

#### Scenario: Article structure
- **GIVEN** a published article
- **THEN** it has: title, excerpt, content (MDX), author,
  published date, category, tags, reading time (auto-calculated)

#### Scenario: Draft preview
- **WHEN** Pavel writes a draft
- **THEN** he can preview it at a unique URL
- **AND** the preview is not indexed by search engines
- **AND** the preview URL can be shared for review

### Requirement: Case Studies

The system SHALL support structured case studies linked to projects.

#### Scenario: Creating a case study
- **WHEN** Pavel creates a case study from a completed project
- **THEN** it follows the format: Problem → Solution → Result
- **AND** includes at least one measurable number
- **AND** links back to the project (if public)

#### Scenario: Case study as revenue tool
- **GIVEN** every completed project
- **THEN** a case study is created within 2 weeks (tracked as task)
- **AND** published on blog + shared on LinkedIn
- **AND** tracked: which case study generates most leads (PostHog)

### Requirement: SEO

The system SHALL optimize all published content for search engines.

#### Scenario: Search engine optimization
- **GIVEN** a published article or case study
- **THEN** it has: meta title (< 60 chars), meta description (< 160 chars),
  canonical URL, open graph image (auto-generated from title),
  structured data (Article schema)

#### Scenario: Sitemap
- **WHEN** content is published or updated
- **THEN** sitemap.xml is regenerated
- **AND** Google Search Console is pinged

### Requirement: Content Categories

The system SHALL organize blog content into predefined categories.

#### Scenario: Category structure
- **GIVEN** the blog
- **THEN** it has categories:
  - Case Studies — project results
  - AI & Automation — AI agents, workflows, tools
  - Frontend Architecture — monorepos, design systems, migrations
  - Business — freelancing, partnerships, pricing
  - Guides — tutorials, how-tos

### Requirement: RSS Feed

The system SHALL provide an RSS feed of published content.

#### Scenario: RSS availability
- **GIVEN** the blog has published content
- **THEN** an RSS feed is available at /blog/rss.xml
- **AND** it includes title, excerpt, date, link for each article

### Requirement: Multi-Language Content

The system SHALL support publishing articles in multiple languages.

#### Scenario: Article in multiple languages
- **WHEN** Pavel publishes an article in English
- **THEN** he can add Russian and Hebrew translations
- **AND** each translation has its own URL (/blog/ru/..., /blog/he/...)
- **AND** hreflang tags connect the translations

## Entities

- **Article** — a blog post (MDX, categorized, tagged)
- **CaseStudy** — a structured project story
- **Category** — a content grouping
- **Tag** — a content label
- **Translation** — an article in another language

## Dependencies

- `projects` — case studies reference completed projects
- `web` — blog content surfaces on the public site
- `finance` — track which content generates leads → revenue
