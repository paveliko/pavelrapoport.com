# pavelrapoport.com — AI Development Studio

> I turn a creative idea into an engineering spec that builds itself.

## Identity

AI Development Studio of Pavel Rapoport — product architect
who bridges design and engineering. Wrote his first game
(Arkanoid in Basic) at age 10. Over a decade of shipping
digital products, from early-stage startups to enterprise.

Today an idea, tomorrow a working product.

### Track record

- 5 design systems from scratch (1000+ components)
- Perimeter 81 — early engineer, company acquired by
  Check Point for ~$490M
- AI-powered Angular→React migration at Zerto/HPE —
  ~90% automation, adopted by engineering leadership
- Dentour monorepo: 7 apps, 20 shared packages,
  build time from 15 min down to 2-3 min

### What I deliver

- **Rapid MVPs** — idea to working product in days, not months
- **Design systems** — component libraries that make designers
  and developers speak the same language
- **AI agents & automation** — custom agents for client
  businesses, process automation that removes manual work
- **Risk & security agents** — AI agents that assess
  business risks, authorization systems, domain security
- **Business ecosystems** — full digital ecosystem design
  for startups and enterprises, from architecture to delivery
- **Frontend architecture** — monorepos, migrations,
  build optimization, spec-driven development

### How I work

Pavel orchestrates creative teams around each project —
photographers, 3D artists, brand designers — everyone does
what they do best, Pavel connects it into a product.

This site is the ecosystem: projects, clients, contractors,
and an AI agent — all in one place. Everything that can be
automated, will be. Everything that can be delegated to AI,
will be delegated.

The site itself is the first project built entirely through
OpenSpec — shipping a large-scale product one prompt at a time.

---

## Tech Stack

**Frontend:**
React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS,
D3.js, SVG, Canvas, XState

**Backend:**
Supabase (PostgreSQL, Auth, RLS, Realtime),
NestJS + Redis (planned — not yet implemented)

**Infrastructure:**
Turborepo monorepo, pnpm, Cloudflare Pages (frontends),
Railway (planned — API + Redis + workers)

**AI:**
Claude (Opus), MCP servers, RAG pipelines, XState agents,
AI migration pipelines

**Tooling:**
Linear, Git, OpenSpec, CLI-first architecture
(JSON output → DB → read-only Web UI)

**Design Systems:**
5 built from scratch, 1000+ components total

---

## Architecture

Turborepo monorepo, two apps, shared packages:

```
apps/
  web/                → pavelrapoport.com
    app/
      (site)/         → landing, portfolio, contact
      blog/           → articles, case studies

  studio/             → studio.pavelrapoport.com
    app/
      dashboard/
      clients/
      network/
      projects/
      messages/
      finance/

packages/
  @repo/auth          → authentication, roles, permissions
  @repo/config        → env and service configuration
  @repo/db            → Supabase client, types, migrations
  @repo/i18n          → internationalization (next-intl)
  @repo/openspec      → specs, conventions, project identity
  @repo/ui            → design system (shadcn/ui components)
  @repo/ai            → agent logic, prompts, mode switching (planned)
  @repo/api           → OpenAPI client, generated (planned)
  @repo/domain-map    → interactive entity graph (planned)
```

### @repo/ui

Built on shadcn/ui. All components live here, never in apps.
Both web and studio consume from the same library.

### @repo/db

Supabase client, generated types, RLS policies, migrations.
Single source of truth for all database access.

### @repo/ai (planned)

Agent core: mode definitions (Canvas, Scout, Architect, Builder),
system prompts, structured output schemas, model selection,
token tracking. Consumed by both apps and by CLI tools.

### @repo/auth

Supabase Auth wrapper, role definitions (owner, client, network,
public), permission checks, middleware. Shared across apps.

### @repo/config

Environment and service configuration. Zod-validated env schema
with modules for each service:
- `env.ts` — validated env vars (Supabase, Claude, Cloudflare, Linear, GitHub, Google)
- `supabase.ts`, `claude.ts`, `cloudflare.ts`, `linear.ts`, `github.ts`, `google.ts`

Future: connection management layer for integrations (planned).

### @repo/domain-map (planned)

React Flow-based entity graph visualizer. Renders domain maps
from OpenSpec data. Designed for standalone extraction as
a separate product.

**web** — public, for everyone.
**studio** — protected, subdomain, behind auth.
Shared packages connect them.

---

## Vision

### What this becomes

A living platform where people come, register, and get
access to tools that let them spin up a POC in hours.
Pavel helps, answers questions, connects services, builds
applications. Every user who runs through the engine makes
it faster and sharper.

The platform is open to everyone — startups, enterprises,
banks, government. If it can be automated, it will be.

### Near-term goals

- Connect two existing projects to the platform —
  Linear workspace, GitHub repos, all config in place
- Project init flow — plug in variables (Linear, GitHub,
  Supabase, AI keys) and start working immediately
- Build community — people register, get access zones,
  interact with the AI, create POCs through the engine

### Personal goals

- **Personal brand** — grow the studio as a recognized
  name in AI-powered development
- **Learning** — this project is a learning machine.
  Every feature built teaches something new. The discipline
  of shipping and the joy of growing go together
- **Happiness** — the project pushes Pavel forward.
  Learning, discipline, and building — all going uphill
  together

---

## Domains

### `site`

**What:** Public face of pavelrapoport.com — the first thing
anyone sees.

**For whom:** Potential clients, partners, anyone who googles
Pavel Rapoport.

**Why it exists:** Sells without selling. Shows who Pavel is,
what he delivers, and proves it with numbers. No "book a call"
button — the site itself demonstrates the value.

**What's inside:**
- Landing page with positioning and proof
- Portfolio / case studies (links to `blog` for deep dives)
- Contact entry point (connects to `messages`)
- SEO, meta, open graph

---

### `studio`

**What:** The production engine. Visual OpenSpec editor +
automated code generation + creative workspace.

**For whom:** Pavel and his creative collaborators — designers,
copywriters, artists.

**Why it exists:** This is where ideas become specs and specs
become code. The studio visualizes domain structure so everyone
sees the same picture, then automates the path from spec to
shipped product.

**What's inside:**
- OpenSpec visualizer — interactive graph of entities,
  relationships, specs across a project
- Code generator — from approved specs to branches, PRs,
  deployed code
- Creative workspace — describe ideas with people, expand
  specs collaboratively, attach mood boards and references
- Project creation — every new project starts here
- Pipeline view — spec → propose → review → PR → ship

---

### `clients`

**What:** Client management. People who pay for products
Pavel builds.

**For whom:** Pavel (manages relationships), clients
(eventually — portal with project status).

**Why it exists:** A client is not a project. One client
can have multiple projects. Need to track who they are,
how they came in, what they need, what stage the relationship
is at.

**What's inside:**
- Client profiles — name, company, contact, source
- Relationship status — lead → active → completed → returning
- History — all projects, all conversations, all invoices
- Qualification — fit score, budget range, service type
- Link to `projects` (their projects) and `finance`
  (their invoices)

---

### `network`

**What:** Professional network. People Pavel works with —
specialists, consultants, creatives who bring expertise,
deliver work, and enrich context.

**For whom:** Pavel (finds and coordinates), network members
(eventually — receive briefs, share deliverables).

**Why it exists:** Pavel works with many people — designers,
lawyers, accountants, 3D artists, agents. He needs to know
who does what, who is available, and what the status of
their work or advice is.

**What's inside:**
- Profiles — name, specialty, role, rate, portfolio
- Availability — free / busy / on project X
- Assignments — which project, which entity, what brief
- Deliverables — upload, review, approve cycle
- Link to `projects` (their involvement) and `finance`
  (their payments)

---

### `ai`

**What:** Pavel's AI agent — the brain of the automation
layer.

**For whom:** Pavel (configures and directs), clients
(interact through chat), the system (executes tasks
autonomously).

**Why it exists:** Everything that can be delegated to AI,
will be. The agent handles client discovery, codebase
scanning, spec generation, implementation planning, and
code writing. One agent, multiple modes.

**What's inside:**
- Agent configuration — prompts, personality, constraints
- Modes — Canvas (client-facing), Scout (codebase scanning),
  Architect (planning), Builder (code execution)
- Model management — which AI model for which task
- Token tracking — usage, costs per session, per project
- Knowledge base — what the agent knows about Pavel's
  stack, preferences, standards

---

### `auth`

**What:** Authentication and authorization across the
entire ecosystem.

**For whom:** Everyone — Pavel, clients, contractors.
Each sees only what they should see.

**Why it exists:** The ecosystem has multiple roles with
different access levels. Studio is Pavel-only today, but
tomorrow clients see their project status and contractors
see their briefs. Auth grows with the platform.

**What's inside:**
- Authentication — login, sessions, tokens
- Roles — owner (Pavel), client, contractor, public
- Permissions — who can access which domain, which project
- Row-level security — Supabase RLS policies
- Future: client portal access, contractor portal access

---

### `projects`

**What:** Projects as a core entity. Every piece of work
Pavel does lives here.

**For whom:** Pavel (manages), clients (their product),
contractors (their assignments), AI (executes within
project scope).

**Why it exists:** A project is where all domains meet.
It has a client, contractors, specs, a domain map, a
pipeline, a budget. It's the central node of the
ecosystem.

**What's inside:**
- Project profile — name, slug, status, client link
- Domain map — interactive entity graph (OpenSpec visualized)
- Specs — generated from entities, versioned
- Pipeline — changes board, proposal → ship flow
- Team — which contractors are assigned
- Budget — planned vs actual, linked to `finance`
- Settings — GitHub repo, Linear team, AI config

---

### `blog`

**What:** Content platform. Articles, case studies,
technical notes.

**For whom:** The public — potential clients, developers,
anyone searching for expertise in AI, design systems,
frontend architecture.

**Why it exists:** Proof of expertise. SEO. Every case
study is a sales argument in disguise. Format: Problem →
What Pavel did → Result with a number.

**What's inside:**
- Articles — markdown, categories, tags
- Case studies — structured format tied to `projects`
- Publishing — draft → review → published
- SEO — meta, open graph, structured data
- Future: RSS, newsletter

---

### `messages`

**What:** Communication layer of the ecosystem. AI chat
as the entry point, human conversations underneath.

**For whom:** Clients (talk to the AI bot first, then to
Pavel), contractors (receive briefs, ask questions), Pavel
(sees everything in one place).

**Why it exists:** The AI bot is the front door. A client
lands on the site, starts chatting, the bot qualifies them,
answers questions, creates entities (new client, new project).
Then human communication flows through the same channel.

**What's inside:**
- AI chat — open-source chat UI, client-facing
- Bot logic — qualification, FAQ, entity creation,
  handoff to Pavel
- Conversations — Pavel ↔ client, Pavel ↔ contractor
- Notifications — new message, new lead, task update
- Chat history — searchable, linked to projects
- Future: Telegram/WhatsApp integration

---

### `finance`

**What:** Financial management. All the money — in and out.

**For whom:** Pavel (tracks everything), eventually —
accountant, tax reporting.

**Why it exists:** Pavel needs to know if he's making
money. Per project, per client, per month. How much AI
costs, how much contractors cost, what's the margin.
No spreadsheets — it's in the system.

**What's inside:**
- Revenue — invoices to clients, payment status
- Expenses — contractor payments, AI token costs,
  infrastructure, tools
- Per-project P&L — revenue minus all costs
- Planning — monthly/quarterly financial goals
- Reports — margin by project, by client, by period
- Future: automated invoicing, tax export
---

## MVP Phases

### Phase 1 — "Client can come" (4-6 weeks)

Revenue-first. Public site works, client can discover Pavel,
talk to Muse, become a lead.

```
Domains:
  auth           → login, roles, RLS, MFA
  web            → landing, portfolio, case studies
  blog           → articles, SEO, content
  messages       → AI chat (Canvas mode), notifications
  clients        → lead → client, qualification, CRM

Result:
  Visitor → pavelrapoport.com → talks to Muse →
  domain map appears → lead created → Pavel reviews →
  accepts → sends quote

Revenue unblocked: Pavel can find clients and invoice them.
```

### Phase 2 — "Pavel can manage" (4-6 weeks)

Operational backbone. Projects, teams, money tracking.

```
Domains:
  organizations  → org structure, membership, org switcher
  projects       → create, domain map, specs, pipeline
  studio         → dashboard, visualizer, workspace
  tasks          → task management, assignments, AI delegation
  finance        → invoices, P&L, costs, revenue dashboard

Result:
  Pavel manages projects in Studio → assigns network →
  tracks costs → invoices clients → sees P&L

Efficiency: no spreadsheets, no manual tracking.
```

### Phase 3 — "Scale & automate" (ongoing)

Full automation. AI builds code, services sync, network operates.

```
Domains:
  integrations   → Linear, GitHub, full bi-directional sync
  network        → freelancer management, briefs, deliverables
  domains        → DNS, multi-domain, SSL, email
  ai             → Scout, Architect, Builder modes full pipeline

Result:
  OpenSpec → Muse Architect → proposal → approve →
  Muse Builder → PR → deploy. Automated.

Scale: platform runs without Pavel in the loop for routine tasks.
```

### Deep vs Shallow Specs

```
Phase 1 domains — DEEP specs required before build:
  Each domain: 8-15 scenarios, data model, API endpoints,
  entity views, edge cases. Same depth as auth/spec.md.

Phase 2 domains — DEEP specs required before build:
  Same standard. No code without deep spec.

Phase 3 domains — SHALLOW specs OK for now:
  Current 3-4 scenarios sufficient for planning.
  Deepen when Phase 3 starts.
```

### Rule

```
Don't start Phase 2 until Phase 1 is live and generating leads.
Don't start Phase 3 until Phase 2 is operational.
Revenue before roadmap. Always.
```
