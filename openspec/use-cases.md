# Use Cases — Three Worlds, One Platform

> Pavel operates in three spheres. Each requires a different
> face but uses the same platform, same AI, same OpenSpec.

---

## Use Case 1: Government — "The Architect"

### Profile

**Client type:** Government agencies, ministries, public sector.

**Pavel's role:** System Architect. Speaks the language of
security, compliance, and scale. Does not sell "fast MVP" —
sells "a system that survives audit and serves a million users."

**Key message:**
- "7 layers of data protection"
- "Row-level security at the database level"
- "Full audit trail of every action"
- "Built in Israel. Cybersecurity in the DNA"

### What matters to this client

- Security documentation
- Audit trails (everything logged)
- Data residency (data stays in Israel)
- Compliance reports
- SLA, uptime guarantees
- Formal specs (OpenSpec = proof of process)
- Slow, deliberate decision-making
- Multiple stakeholders and approvals

### Example scenario

```
Ministry of Health wants to digitize patient records.

Organization: "Ministry of Health — Digital Records"
  type: government
  Members:
    Pavel — admin (technical lead)
    Ministry contact — admin (project owner)
    Security officer — viewer (audit access)
    Subcontractors — members (assigned tasks)

Project: "Health Records Platform"
  Domain map: Patient, Doctor, Clinic, Appointment,
    MedicalRecord, InsuranceProvider
  Security requirements: [CRITICAL]
  Connections: isolated Supabase instance, no shared infra

Flow:
  Meeting at ministry → recording → transcription
  → AI Listener creates draft project
  → Security-tagged entities generated
  → Task: "Prepare security assessment document"
  → Pavel reviews, shapes, presents to ministry
```

### What platform features are highlighted

- `auth` — 7 security layers, RLS, audit trail
- `domains` — data residency, isolated infrastructure
- `integrations` — secure connection management, key rotation
- OpenSpec — formal, auditable spec process

---

## Use Case 2: Business — "The Accelerator"

### Profile

**Client type:** Growing companies, 10-500 employees.
Have a business, need digital tools fast.

**Pavel's role:** Product Accelerator. Takes a business
process and turns it into a working product faster than
they can hire a team.

**Key message:**
- "Show me your process, I'll show you the product"
- "Here's your domain map — this is what you're building"
- "Today an idea, tomorrow a working product"
- "Design system so designers and developers speak
  the same language"

### What matters to this client

- Speed (MVP in weeks, not months)
- Visualization (domain map shows progress)
- Transparency (client dashboard, budget tracking)
- Scalability (monorepo, design system)
- Cost clarity (budget tracking in finance)
- Ownership (they own the code and domain)

### Example scenario

```
Dentour (dental tourism, 50 employees) needs a platform
for managing patients, clinics, and bookings.

Organization: "Dentour Ltd"
  type: company
  Members:
    CEO — owner (sees everything, pays)
    CTO — admin (manages projects)
    Pavel — admin (builds)
    Designer — member (branding, via network)
    Marketing — viewer (sees progress)

Project: "Dentour Platform"
  Domain map: Patient, Clinic, Doctor, Booking,
    Treatment, Review, Payment
  Connections: GitHub, Linear, Cloudflare, Supabase

Flow:
  Zoom with CEO → recording → transcription
  → AI Listener updates existing project
  → New entities: LoyaltyProgram, ReviewSystem
  → Draft specs generated
  → Task: "Design loyalty program flow"
  → AI Architect generates proposal
  → Pavel reviews, CEO approves
  → AI Builder ships
```

### What platform features are highlighted

- `studio` — visual OpenSpec, domain map, pipeline
- `projects` — transparent progress tracking
- `finance` — budget vs actual per project
- `tasks` — assigned to AI and humans
- Speed: idea → draft → spec → code → ship

---

## Use Case 3: Creative / Startup — "The Connector"

### Profile

**Client type:** Friends, partners, fellow creators.
Small ideas, experiments, POCs, R&D, robotics,
AI-to-AI delegation, open source.

**Pavel's role:** The Connector. Sees links between
technologies, people, and ideas that others don't see.
Connects AI with robotics, designer with engineer,
legacy code with new stack.

**Key message:**
- "What if a robot reads our domain map?"
- "Let's plug this into our ecosystem"
- "One prompt — and we have a working POC"
- "Here's how AI delegates a task to another AI"

### What matters

- Speed of experiment (draft → POC in hours)
- Integrations (connect anything to anything)
- AI delegation (agent builds, tests, ships alone)
- Knowledge accumulation (every experiment enriches
  the knowledge base)
- Open source potential (domain-map as standalone product)
- Fun. Learning. Pushing boundaries.

### Example scenario

```
Pavel + Sergey want to build an AI tool that scans
legacy code and generates migration plans.

Organization: "Pavel + Sergey"
  type: partnership
  Members:
    Pavel — owner
    Sergey — owner
    AI Agent — assigned tasks (scans code)

Flow:
  Bar conversation on Friday night
  → Voice message in Telegram
  → AI Listener: "new idea detected"
  → Draft project: "Legacy Scanner"
  → Entities: SourceCode, Module, Dependency,
    MigrationPlan, ComponentMap
  → Task: "Sergey, send example Angular project"
  → AI Scout scans repo → enriches domain map
  → One week later: working POC

Parallel — Pavel's personal experiments:

Organization: "Pavel Rapoport" (personal)
  → Robotics integration research
  → AI-to-AI delegation patterns
  → Small ideas, captured via voice → draft projects
  → Each experiment feeds knowledge base
```

### What platform features are highlighted

- AI Listener — voice → idea → draft project instantly
- `ai` Scout mode — scan codebase → generate specs
- `tasks` — AI assigns tasks to itself and others
- `integrations` — connect new APIs, robots, services
- `domain-map` — potential standalone open source product
- Speed: Telegram voice → draft spec → POC

---

## Three Faces, One Pavel

| Sphere | Role | Sells | Keyword |
|--------|------|-------|---------|
| Government | System Architect | Security, compliance, scale | **Trust** |
| Business | Product Accelerator | Speed, transparency, results | **Speed** |
| Creative | The Connector | Ideas, experiments, future | **Vision** |

The platform is the same. The AI is the same. The OpenSpec
process is the same. What changes is which aspects Pavel
highlights and how he speaks.

### How AI Listener adapts

When a new idea enters the system, the AI Listener should
detect the sphere from context:

```
"Ministry wants to..." → government mode
  → emphasize security requirements
  → add compliance entities
  → formal language in specs

"Company needs a platform for..." → business mode
  → emphasize speed and cost
  → add budget tracking
  → results-oriented specs

"What if we build..." → creative mode
  → emphasize experimentation
  → minimal specs, fast POC
  → exploration over documentation
```

This context flows into the draft project and affects
how specs are generated, what questions the AI asks,
and what tasks it creates.
