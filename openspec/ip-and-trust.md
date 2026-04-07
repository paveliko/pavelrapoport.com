# IP & Trust — Protecting Ideas, Owning Work

> Every idea that enters the platform is someone's dream.
> Treat it that way.

---

## Trust Layer

Three levels of protection for every idea that enters
the system.

### 1. Legal — NDA

Before any deep discovery, the platform offers a
Non-Disclosure Agreement.

```
Client starts conversation with AI
  → AI asks: "Would you like to protect your idea
     with a confidentiality agreement?"
  → Yes → NDA generated from template
  → Client signs (e-signature)
  → Only then → deep discovery begins
  → No → basic conversation only, no draft project
```

Standard NDA covers:
- Pavel will not disclose the idea to third parties
- Information stored encrypted
- On project end: data deleted or transferred to client
- Duration: 2-3 years after project completion
- Mutual: covers both parties

### 2. Technical — Platform Security

```
Draft Project (client's idea)
  ├── Encrypted at rest (Supabase + AES-256)
  ├── RLS: only org owner + Pavel can see
  ├── Audit log: every access recorded
  ├── AI does not train on client data
  │   (Claude API: data not used for training)
  ├── Data residency: region-selectable
  └── Delete on request: client can purge everything
```

### 3. Process — Who Sees What

```
Who sees the client's idea:

  AI Agent        → processes, does not retain context
                    between sessions
  Pavel (admin)   → sees draft, works on it
  Client (owner)  → sees their project

  DO NOT see:
  Other clients   → RLS isolation
  Network members → only if assigned to project
  Public          → never
```

---

## IP Model — Who Owns What

### Phase 1: Raw Idea

The client comes with an idea.

- **IP: 100% client's**
- Pavel knows the idea but does not own it
- NDA protects against disclosure
- No draft project created without client's consent

### Phase 2: Expanded Idea

Pavel structures, expands, builds domain map and specs.
This is joint intellectual work. Ownership depends on
the contract type:

**Type A: Work for Hire**
```
Client pays → everything belongs to client
Pavel retains: general methods and approaches
  (not the specific implementation)
Client receives: domain map, specs, all project artifacts
```

**Type B: Joint IP**
```
Partnership → IP split by agreement
Typical: client owns business logic,
  Pavel owns technical architecture
Revenue split: by contract
```

**Type C: License**
```
Pavel builds the platform/tool → client gets a license
Pavel retains right to reuse architecture
  for other clients (without business logic)
Client gets: exclusive use of their specific product
```

### Phase 3: Built Product

Code is written, product works.

```
What goes to client:
  - Application code (GitHub repo transfer)
  - Database and data
  - Domain, DNS configuration
  - All specs and documentation
  - Creative assets (if paid for)

What stays with Pavel:
  - Platform components (@rapoport/ui, @rapoport/auth, etc.)
  - General architectural patterns
  - OpenSpec templates and workflows
  - Knowledge and experience gained
```

---

## Contract Types

| Type | Who pays | IP owner | When to use |
|------|---------|----------|-------------|
| Work for Hire | Client pays fixed/hourly | Client | Standard client project |
| Joint IP | Both invest | Shared by agreement | Partnership, co-founding |
| License | Client pays subscription | Pavel (platform) | SaaS product built on platform |
| Revenue Share | No upfront | Split by % | High-risk, high-trust partnership |
| Open Source | Nobody | Public | Community tools, domain-map |

---

## Monetizing Own Ideas

### Model 1: Productized Service

```
Idea: "AI scans legacy code → migration plan"
  → Build POC
  → Package as service: "Legacy Migration Audit"
  → Price: fixed per engagement
  → Each client gets result, Pavel keeps the tool
  → IP: 100% Pavel's (client gets deliverable, not tool)
```

### Model 2: Platform Feature → Standalone Product

```
Idea: "Domain Map as standalone visualizer"
  → Build inside platform (@rapoport/domain-map)
  → Extract as separate product
  → SaaS or open-source with paid tier
  → IP: 100% Pavel's
```

### Model 3: Equity Partnership

```
Idea born in conversation with a partner
  → Create Organization (type: partnership)
  → IP split in contract
  → Pavel contributes: architecture, AI, platform
  → Partner contributes: domain expertise, capital
  → Equity: by agreement
```

### Model 4: Knowledge Product

```
Idea: "How to build products through OpenSpec"
  → Blog posts, case studies → free (SEO, credibility)
  → Course / workshop → paid
  → Consulting → premium
  → IP: 100% Pavel's
```

---

## Platform Entities

### NDA

Stored per project. Generated from template, signed
electronically.

```
NDA:
  id, project_id, organization_id
  template_version
  signed_by_client: user_id, timestamp, IP
  signed_by_pavel: user_id, timestamp, IP
  status: draft | sent | signed | expired
  expires_at
  document_url (PDF in Supabase Storage)
```

### Contract

Stored per project. Defines IP ownership, payment terms,
deliverables.

```
Contract:
  id, project_id, organization_id
  type: work_for_hire | joint_ip | license | revenue_share
  ip_split: { client: %, pavel: % }
  payment_type: fixed | hourly | subscription | revenue_share
  payment_terms: text
  deliverables: text[]
  status: draft | sent | signed | active | completed
  signed_at
  document_url
```

### IP Registry

Per organization — tracks who owns what across all projects.

```
IPRecord:
  id, organization_id, project_id
  asset_type: idea | spec | code | design | brand | data
  owner: client | pavel | shared
  license: exclusive | non_exclusive | open_source
  notes
  created_at
```

---

## Trust Page — Public

For `web` domain: `pavelrapoport.com/trust`

Content:
- NDA before every discovery conversation
- End-to-end encryption of all project data
- 7 layers of security (reference auth spec)
- Full audit trail on every data access
- Data deletion on request — your right
- Built in Israel — cybersecurity standards
- AI does not train on your data
- Your code = your property (with contract)
- IP terms clear before work begins
- References available on request

This is not a legal page — it's a trust signal.
Legal documents are generated and signed inside
the platform.

---

## Audit Requirements

| Event | Logged |
|-------|--------|
| NDA sent | client_id, timestamp |
| NDA signed | client_id, signature_hash, timestamp, IP |
| Draft project created | project_id, creator, timestamp |
| Idea data accessed | user_id, project_id, timestamp, IP |
| Idea data exported | user_id, format, timestamp |
| Idea data deleted | user_id, project_id, timestamp |
| Contract signed | all parties, timestamp, IP |
| IP transferred | from, to, asset_type, timestamp |

All audit events are append-only. Cannot be edited
or deleted except by platform admin with separate
audit of that deletion.
