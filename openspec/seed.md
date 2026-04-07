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
  name: Pavel Rapoport Studio
  slug: rapoport-studio
  type: company
  
  Members:
    - hello@pavelrapoport.com
      org_role: owner
```

## Domain

```
Domain:
  name: pavelrapoport.com
  organization: rapoport-studio
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
  organization: rapoport-studio
  status: building
  created_by: hello@pavelrapoport.com
```

## Connections (global)

```
Global connections (owned by rapoport-studio):

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
- [ ] Organization "Pavel Rapoport Studio" exists
- [ ] Pavel is owner of the organization
- [ ] Project "pavelrapoport.com" exists under the org
- [ ] Domain pavelrapoport.com is active
- [ ] Subdomains @ and studio.* are mapped
- [ ] Global connections (Claude, Google, PostHog) are active
- [ ] Project connections (GitHub, Linear, Cloudflare, Supabase) are active
- [ ] AI agent can read Gmail via Google Workspace connection
