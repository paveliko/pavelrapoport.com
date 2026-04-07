# Financial Sustainability

> The organization feeds everyone first. Then we build.

---

## The Pattern to Break

```
Old Pavel:
  Idea → excitement → build build build → no money → stress

New Pavel:
  Idea → is there a paying client? → yes → build
                                    → no → park it, sell first
```

This document exists because ideas are free and rent is not.
Every person in this organization — Pavel, Misha, network
members, future team — depends on this system generating
revenue. Not eventually. Now.

---

## Revenue Rule

**Every month must have a revenue target.**
**Every week must have a sales action.**

```
Monthly rhythm:
  Week 1: Review last month's P&L. Set this month's target.
  Week 2-3: Build + sell in parallel (never 100% building).
  Week 4: Invoice. Follow up on overdue. Plan next month.

If pipeline is empty:
  STOP building features.
  START: outreach, case studies, LinkedIn, calls.
  Platform development = 0% until pipeline has $10K+.
```

---

## Revenue Streams — Priority Order

### Stream 1: Contract Work (NOW — primary income)

```
Target: $10K-$20K/month within 90 days

Services by speed-to-revenue:
  1. Legacy migration (fastest — proof exists, market huge)
  2. Design system builds (6 weeks, $20-50K)
  3. AI development audits ($3-8K, one week)
  4. Full product builds ($30-80K, 3-6 months)

Client acquisition:
  - LinkedIn content (case studies, AI migration posts)
  - Israeli tech community (Telegram groups, events)
  - Sergey partnership (legacy migration referrals)
  - Word of mouth from delivered projects

Case studies needed (highest priority):
  1. Zerto — AI migration, ~90% automation
  2. Perimeter 81 — design system, acquired $490M
  3. Dentour monorepo — build time 15→2-3 min
```

### Stream 2: Own Products (NEAR-TERM — equity + future)

```
Dentour:
  Target: €750K GMV year 1
  Revenue: commission per booking
  Investment: 30% of Pavel's time max
  Rule: don't fund from contract income.
        Dentour must sustain itself or get investment.

VIVOD:
  Target: 2 pilot clients, prove model
  Revenue: SaaS subscription (future)
  Investment: Misha manages, Pavel builds
  Rule: pilots must pay something. Even symbolic.
        Free pilots = no data on willingness to pay.
```

### Stream 3: SaaS Tools (FUTURE — scalable income)

```
Candidates:
  - Domain Map Builder
  - OpenSpec Visualizer
  - AI Discovery Bot (Canvas as a service)

Rule: don't build until Stream 1 generates $15K/month
      consistently for 3 months.
```

---

## Financial Guardrails

### Monthly Minimums

```
Survival:     $3,000/month (Moldova living costs)
Comfortable:  $6,000/month (living + tools + buffer)
Growing:      $10,000/month (can hire, can invest)
Thriving:     $20,000/month (team, products, freedom)

Current target: $6,000 → $10,000 within 90 days
```

### Cash Buffer Rule

```
Always maintain: 3 months of expenses in bank
If buffer drops below 2 months:
  → Emergency mode: sell only, no building
  → Accept any reasonable contract
  → Pause all product development
```

### Project Profitability

```
Minimum margin: 40% per project
  Revenue: $30,000
  Max expenses: $18,000 (AI, network, infra, tools)
  Minimum profit: $12,000

If margin drops below 30%:
  → Review: scope creep? Underpriced? Too much manual work?
  → Fix before taking next project
```

### Red Flags — Auto-Triggers

```
🔴 No income for 30 days
   → Stop all feature development
   → Full-time sales mode
   → Reach out to 20 contacts

🔴 Overdue invoice > 30 days
   → Escalate: call, formal email, mention contract terms
   → Pause work on that project

🟠 Pipeline < $10K in next 60 days
   → Increase outreach: 5 messages/day
   → Publish case study
   → Offer discovery sessions

🟡 Monthly expenses > 50% of revenue
   → Audit: which tools/services can be cut?
   → Renegotiate or downgrade plans
```

---

## Case Studies — The Revenue Engine

Case studies are not marketing. They are the #1 revenue tool.
Every case study is a sales argument.

### Format: Problem → What Pavel Did → Result (with number)

```
Case Study 1: Zerto
  Problem: Legacy codebase, manual migration would take 12 months
  Solution: AI-powered migration pipeline with Claude Code
  Result: ~90% automated, delivered in fraction of time
  Sells: legacy migration services

Case Study 2: Perimeter 81
  Problem: Inconsistent UI across product, slow dev velocity
  Solution: Design system from scratch, component library
  Result: Company acquired for $490M (design system was
          part of the product quality story)
  Sells: design system builds

Case Study 3: Dentour Monorepo
  Problem: 4 apps, 18 packages, 15-minute build times
  Solution: Turborepo monorepo restructure
  Result: Build time 15 → 2-3 minutes
  Sells: architecture consulting, monorepo expertise
```

### Case Study Pipeline

```
Every completed project → case study within 2 weeks.
No exceptions.

Process:
  1. Project completes → auto-create Linear issue: "Write case study"
  2. Draft: Problem + Solution + Result + Number
  3. Review: is the number impressive?
  4. Publish: blog + LinkedIn + portfolio
  5. Track: which case study generates most leads?
```

---

## Monthly Financial Review

```
1st of every month, Pavel reviews:

Revenue:
  □ Total invoiced this month
  □ Total received this month
  □ Overdue invoices (count, total)
  □ Pipeline: confirmed for next 60 days

Expenses:
  □ AI costs (Claude API, other)
  □ Infrastructure (Cloudflare, Railway, Supabase, Vercel)
  □ Tools (Linear, GitHub, domains, etc.)
  □ Network member payments
  □ Personal expenses

Health:
  □ Cash buffer: how many months?
  □ Margin per project
  □ Biggest expense category
  □ Revenue trend: growing or shrinking?

Actions:
  □ If healthy → continue building
  □ If warning → increase sales activity
  □ If emergency → pause building, sell
```

---

## Revenue Dashboard (Studio)

```
/studio/finance

  This month:
    Revenue:    $XX,XXX (vs target $XX,XXX)
    Expenses:   $X,XXX
    Margin:     XX%
    Buffer:     X.X months

  Pipeline:
    Active quotes:      $XXK
    Signed contracts:   $XXK  (next 90 days)
    Maintenance:        $X,XXX/month recurring

  By project:
    Dentour:   revenue vs cost
    VIVOD:     revenue vs cost
    Client A:  revenue vs cost

  Alerts:
    🔴 Overdue: Invoice #003 — $5,000 — 15 days
    🟠 Pipeline: only $8K in next 60 days
    🟢 Buffer: 4.2 months — healthy
```

---

## Integration with OpenSpec Workflow

```
Before starting any new feature or domain:
  1. Check /studio/finance — is the month on track?
  2. Check pipeline — is there $10K+ in next 60 days?
  3. If yes → build
  4. If no → sell first

This is Rule #8: Revenue before roadmap.
It's in identity.md. It's in the finance dashboard.
It's in the monthly review. There is no escape.
```
