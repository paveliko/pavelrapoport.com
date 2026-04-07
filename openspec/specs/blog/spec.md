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

### Requirement: Case Studies

The system SHALL support structured case studies linked to projects.

#### Scenario: Creating a case study
- **WHEN** Pavel creates a case study from a completed project
- **THEN** it follows the format: Problem → Solution → Result
- **AND** includes at least one measurable number

### Requirement: SEO

All published content SHALL include meta tags, open graph,
and structured data.

#### Scenario: Published article has SEO metadata
- **WHEN** an article is published
- **THEN** it includes meta tags, open graph, and structured data
- **AND** search engines can index the content

## Entities

- **Article** — a blog post (markdown, categorized, tagged)
- **CaseStudy** — a structured project story
- **Category** — a content grouping
- **Tag** — a content label

## Dependencies

- `projects` — case studies reference completed projects
- `site` — blog content surfaces on the public site
