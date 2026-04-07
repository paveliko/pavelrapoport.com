# Seed Data — Platform Init

> Initial state of the platform on first deployment.
> This is not a migration — it's the starting point.

## Platform Admin

```
Profile:
  email: hello@pavelrapoport.com
  display_name: Pavel Rapoport
  role: admin
  locale: en
```

## Organization

```
Organization:
  name: Pavel Rapoport
  slug: rapoport
  type: personal
  subtitle: AI Development Studio
  
  Members:
    - hello@pavelrapoport.com
      org_role: owner
```

## Domain

```
Domain:
  name: pavelrapoport.com
  organization: rapoport
  registrar: (current registrar)
  dns_provider: cloudflare
  status: active

  Subdomains:
    - prefix: @
      project: pavelrapoport
      environment: production

    - prefix: studio
      project: pavelrapoport
      environment: production

  Email:
    provider: google_workspace
    from_addresses:
      - hello@pavelrapoport.com
    spf: configured
    dkim: configured
    dmarc: configured
```

## Project

```
Project:
  name: pavelrapoport.com
  slug: pavelrapoport
  organization: rapoport
  status: building
  created_by: hello@pavelrapoport.com
```

## Connections (global)

```
Global connections (owned by rapoport):

  - type: claude_api
    scope: global
    config:
      api_key: (secret)
      default_model: claude-opus-4-20250514

  - type: google_workspace
    scope: global
    config:
      account: hello@pavelrapoport.com
      services: [gmail, calendar, drive, contacts]
      oauth_token: (secret)
      refresh_token: (secret)

  - type: posthog
    scope: global
    config:
      api_key: (secret)
      host: https://app.posthog.com
```

## Connections (project: pavelrapoport)

```
Project connections (pavelrapoport):

  - type: github
    scope: project
    config:
      owner: paveliko
      repo: pavelrapoport.com
      default_branch: main
      token: (secret)

  - type: linear
    scope: project
    config:
      workspace: AI Development Studio
      team: VIVOD
      api_key: (secret)

  - type: cloudflare
    scope: project
    config:
      account_id: (secret)
      project_name: pavelrapoport-com
      production_branch: main
      api_token: (secret)

  - type: supabase
    scope: project
    config:
      project_url: (secret)
      anon_key: (secret)
      service_role_key: (secret)
```

## Verification Checklist

After seed:
- [ ] Pavel can login via hello@pavelrapoport.com
- [ ] Profile exists with role = admin
- [ ] Organization "Pavel Rapoport" exists, Pavel is owner
- [ ] Project "pavelrapoport.com" exists under the org
- [ ] Domain pavelrapoport.com is active
- [ ] Subdomains @ and studio.* are mapped
- [ ] Global connections (Claude, Google, PostHog) are active
- [ ] Project connections (GitHub, Linear, Cloudflare, Supabase) are active
- [ ] AI agent can read Gmail via Google Workspace connection

---

# VIVOD — Partnership Project

## Partner Profile

```
Profile:
  email: (Misha's email)
  display_name: Misha
  role: user
```

## Organization

```
Organization:
  name: VIVOD
  slug: vivod
  type: partnership

  Members:
    - Pavel
      org_role: owner
      role_title: CTO — product, technology, AI architecture

    - Misha
      org_role: owner
      role_title: CEO — business, domain expertise, sales

  Origin:
    how_met: long-time friends, different domains
    trigger: conversation during war (sirens), Misha's pain
      in facade construction management + Pavel's need to build
    first_conversation: (date)
    spark_to_spec: Misha described the problem,
      Pavel shaped it into a product
```

## Domain

```
Domain:
  name: vivod.app
  organization: vivod
  dns_provider: cloudflare
  status: active

  Subdomains:
    - prefix: @
      project: vivod-platform
      environment: production
```

## Project

```
Project:
  name: VIVOD Platform
  slug: vivod-platform
  organization: vivod
  status: building
  created_by: Pavel

  Pilot clients:
    - Gishat Havalim
    - Euro Towers

  Stage: Build (Stage 4 of partnership lifecycle)
```

## Connections (project: vivod-platform)

```
Project connections (vivod-platform):

  - type: github
    scope: project
    config:
      owner: (github org)
      repo: vivod
      default_branch: main
      token: (secret)

  - type: linear
    scope: project
    config:
      workspace: AI Development Studio
      team: VIVOD
      api_key: (secret)

  - type: supabase
    scope: project
    config:
      project_url: (secret)
      anon_key: (secret)
      service_role_key: (secret)

  - type: cloudflare
    scope: project
    config:
      account_id: (secret)
      project_name: vivod
      api_token: (secret)
```

## VIVOD Verification Checklist

After seed:
- [ ] Misha can login and see VIVOD organization
- [ ] Both Pavel and Misha are owners
- [ ] Project "VIVOD Platform" exists under VIVOD org
- [ ] Domain vivod.app is active
- [ ] Project connections (GitHub, Linear, Supabase, Cloudflare) active
- [ ] Pavel can switch between "Pavel Rapoport" and "VIVOD" orgs
- [ ] Misha cannot see "Pavel Rapoport" org data
- [ ] Pilot clients tracked in project

---

# Dentour — Solo Project

## Organization

```
Organization:
  name: Dentour
  slug: dentour
  type: company

  Members:
    - Pavel
      org_role: owner
      role_title: Co-Founder, Solo Developer, Product Manager

    - (Marketing Partner — TBD)
      org_role: admin
      role_title: Marketing / Business Development
      status: searching
      need: someone who onboards clinics, runs demand-side
        marketing, builds supply in Moldova/Romania/Georgia
      ideal_profile: dental tourism industry knowledge,
        B2B sales experience, connections to clinics,
        speaks Romanian/Russian

  Origin:
    trigger: personal pain — dental costs in Israel vs
      Moldova/Romania (60-80% savings), friends flying
      abroad for treatment, chaotic WhatsApp-based process
    market_gap: no platform combines real-time booking
      + dental tourism focus + transparent pricing
    competitive_analysis: 12 competitors analyzed,
      three clusters, none solve the full problem
```

## Domains

```
Domains:
  - name: dentour.eu
    market: Europe (central)
    languages: EN, RU

  - name: dentour.co.il
    market: Israel
    languages: HE, RU, EN

  - name: dentour.md
    market: Moldova (supply side)
    languages: RO, RU

  - name: dentour.ro
    market: Romania (supply side)
    languages: RO, EN

  - name: dentour.ge
    market: Georgia
    languages: KA, RU, EN

  - name: dentour.es
    market: Spain
    languages: ES

  - name: dentour.co.uk
    market: UK
    languages: EN

  All domains: dns_provider: cloudflare
```

## Project

```
Project:
  name: Dentour Platform
  slug: dentour-platform
  organization: dentour
  status: building
  created_by: Pavel

  Architecture: monorepo (pnpm + Turborepo)
    apps: patient-web, clinic-portal, admin, api (NestJS)
    packages: 18 shared packages (@dentour/*)

  Current state:
    - Patient web: catalog, clinic profiles, 5 onboarding paths
    - Clinic portal: registration, profile management
    - Admin panel: clinic/patient management
    - API: auth, clinics, patients, services, quotes, uploads
    - i18n: 6 languages with RTL
    - 77 documentation files

  Direction: catalog → AI-first platform
    - AI assistant as primary patient interface
    - X-ray analysis for treatment plans
    - Smart clinic matching
    - AI assistant for clinics

  Key challenge: chicken-and-egg marketplace problem
    Need marketing partner to onboard clinics (supply side)

  Year 1 targets:
    - 500 completed bookings
    - €750K GMV
    - €94K platform revenue (12.5% take rate)
    - 100 clinics onboarded
    - 4,000 patient registrations
```

## Connections (project: dentour-platform)

```
Project connections (dentour-platform):

  - type: github
    scope: project
    config:
      owner: (github org)
      repo: dentour
      default_branch: main
      token: (secret)

  - type: supabase
    scope: project
    config:
      project_url: (secret)
      anon_key: (secret)
      service_role_key: (secret)

  - type: cloudflare
    scope: project
    config:
      account_id: (secret)
      zones: [dentour.eu, dentour.co.il, dentour.md,
              dentour.ro, dentour.ge, dentour.es, dentour.co.uk]
      api_token: (secret)

  - type: railway
    scope: project
    config:
      project_id: (secret)
      api_token: (secret)
    note: NestJS API hosted on Railway

  - type: infisical
    scope: project
    config:
      project_id: (secret)
      token: (secret)
    note: secrets management (may migrate to @rapoport/config)

  - type: sentry
    scope: project
    config:
      org_slug: dentour
      project_slug: dentour
      dsn: (secret)
      auth_token: (secret)

  - type: posthog
    scope: project
    config:
      api_key: (secret)
      host: https://app.posthog.com
      project_id: (secret)
```

## Dentour Verification Checklist

After seed:
- [ ] Organization "Dentour" exists, Pavel is owner
- [ ] Project "Dentour Platform" exists under Dentour org
- [ ] 7 domains registered and active
- [ ] All connections (GitHub, Supabase, Cloudflare,
      Railway, Infisical, Sentry, PostHog) active
- [ ] Pavel can switch between all 3 orgs:
      "Pavel Rapoport", "VIVOD", "Dentour"
- [ ] Cross-org isolation: VIVOD cannot see Dentour data
- [ ] Marketing partner slot visible as "searching"
