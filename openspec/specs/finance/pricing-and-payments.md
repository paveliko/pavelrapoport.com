# Pricing Model & Payment Flow

> How money enters the system. Contract-first, product-second, SaaS-future.

---

## Business Model

Three revenue streams, activated sequentially:

```
Stream 1: Contract Work (now)
  Build a product for a client → handoff → 2-year maintenance → exit.
  Revenue: project fee + monthly maintenance.

Stream 2: Own Products (near-term)
  Dentour, VIVOD — Pavel as co-founder/CTO.
  Revenue: equity, revenue share, or percentage of GMV.

Stream 3: SaaS Tools (future)
  Productize parts of the platform (domain mapper, spec builder).
  Revenue: monthly subscription.
```

---

## Stream 1: Contract Work — Pricing

### Engagement Types

```
Discovery Only
  What: Canvas session + domain map + creative brief
  Duration: 1-2 weeks
  Deliverable: domain map, entity specs, brand direction
  Price: fixed fee

Build
  What: Full product development from spec to launch
  Duration: 3-6 months
  Deliverable: working product, deployed, documented
  Price: fixed fee, paid in milestones

Build + Maintain
  What: Build + 2-year maintenance contract
  Duration: 3-6 months build + 24 months support
  Deliverable: product + ongoing updates, bug fixes, infra
  Price: build fee + monthly maintenance fee

Maintenance Only
  What: Support existing product (built by Pavel or migrated)
  Duration: rolling monthly or annual
  Deliverable: bug fixes, updates, monitoring, small features
  Price: monthly retainer
```

### Pricing Structure

```
Discovery:       $2,000 — $5,000 (fixed)
Build:           $15,000 — $80,000 (milestone-based)
Maintenance:     $1,000 — $3,000/month
Emergency fix:   $200/hour (outside maintenance scope)

Milestones (typical for a 3-month build):
  Milestone 1 (signing):     30% upfront
  Milestone 2 (mid-build):   30% on spec approval
  Milestone 3 (launch):      30% on delivery
  Milestone 4 (post-launch): 10% after 30-day stabilization
```

### Quote → Contract → Payment Flow

```
1. Discovery
   Client talks to Muse (Canvas) → domain map created
   Pavel reviews → accepts lead → shapes domain

2. Quote
   Pavel creates Quote in platform:
     - engagement type (discovery / build / build+maintain)
     - scope: domains, entities, integrations
     - timeline: start date, milestones
     - price: total, per milestone
     - maintenance: monthly fee, duration, scope

3. Contract
   Generated from Quote template:
     - NDA (signed before discovery)
     - Service agreement (scope, timeline, IP, payment terms)
     - Maintenance addendum (if applicable)
   Signed via: DocuSign or simple PDF + email confirmation

4. Invoice
   Per milestone:
     - Invoice generated in platform
     - Sent to client via email (Resend)
     - Payment via bank transfer (Moldovan bank)
     - Status tracked: sent → paid → overdue

5. Online Payment (future)
   - Payment page: pavelrapoport.com/pay/[invoice-id]
   - Merchant processor: registered in Moldova
   - Methods: card (Visa/MC), bank transfer
   - Receipt generated automatically
```

---

## Payment Infrastructure

### Bank (primary)

```
Moldovan bank account
  - Receives: bank transfers from clients (EU, Israel, international)
  - Currency: EUR (primary), USD, MDL
  - SWIFT/IBAN for international transfers
  - Invoice includes bank details
```

### Online Payments (future)

```
Merchant processor (Moldova-registered)
  - Card payments: Visa, Mastercard
  - Payment page hosted on pavelrapoport.com
  - Webhook → platform marks invoice as paid
  - Receipt auto-generated, sent via Resend

Options to explore:
  - Stripe (if available in Moldova) — preferred
  - Payze (Georgian fintech, works in region)
  - Local Moldovan acquiring bank
  - Wise Business (for multi-currency receiving)
```

### Crypto (optional, future)

```
For international clients who prefer crypto:
  - USDT/USDC on a known chain
  - Manual reconciliation for now
  - Add to invoice as payment option
```

---

## Data Model

### Entities

```
Quote
  id, project_id, client_id
  engagement_type: discovery | build | build_maintain | maintain
  scope_summary: text
  milestones: jsonb [{ title, percentage, amount, due_date }]
  maintenance_monthly: numeric
  maintenance_months: int (default 24)
  total_amount: numeric
  currency: EUR | USD | ILS
  status: draft | sent | accepted | declined | expired
  valid_until: date
  created_at, updated_at

Contract
  id, quote_id, project_id, client_id
  type: nda | service_agreement | maintenance_addendum
  file_url: text (Supabase Storage)
  signed_by_client: boolean
  signed_by_pavel: boolean
  signed_at: timestamptz
  status: draft | sent | signed | expired
  created_at

Invoice
  id, project_id, client_id, quote_id
  milestone_index: int (which milestone)
  amount: numeric
  currency: EUR | USD | ILS
  tax_amount: numeric (if applicable)
  total: numeric
  bank_details: jsonb
  payment_method: bank_transfer | card | crypto
  status: draft | sent | paid | overdue | cancelled
  due_date: date
  paid_at: timestamptz
  receipt_url: text
  sent_at: timestamptz
  created_at, updated_at

Payment
  id, invoice_id
  amount: numeric
  currency: EUR | USD | ILS
  method: bank_transfer | card | crypto
  reference: text (bank ref, transaction ID)
  received_at: timestamptz
  confirmed_by: uuid (Pavel confirms manually or webhook)
  created_at
```

---

## Flows in Platform

### Quote Creation

```
/studio/projects/[slug]/finance   → Finance tab
  → "New Quote" button
  → Form:
      engagement type (select)
      scope (markdown editor — what's included)
      milestones (add rows: title, %, amount, due date)
      maintenance (toggle on/off, monthly fee, months)
      currency
      valid until
  → Preview → Send to client

URL: /studio/projects/[slug]/finance?modal=create-quote
```

### Invoice Generation

```
When milestone is reached:
  → Pavel clicks "Create Invoice" on the milestone
  → Invoice auto-filled from Quote data
  → Pavel reviews, can adjust
  → "Send" → email via Resend with PDF attachment
  → Client sees invoice, pays via bank transfer
  → Pavel confirms payment manually (or webhook from bank)

URL: /studio/projects/[slug]/finance?tab=invoices
```

### Client Payment Page (future)

```
pavelrapoport.com/pay/[invoice-id]

  Shows:
    - Invoice details (project, milestone, amount)
    - Payment methods (bank transfer details, card form)
    - Status (unpaid / processing / paid)

  After payment:
    - Webhook → update invoice status
    - Send receipt via Resend
    - Platform updates project finance
```

### Maintenance Billing

```
Monthly automated flow:
  1st of month → system creates maintenance invoice
  → Auto-sends to client
  → Client pays (bank transfer or card)
  → If overdue 15 days → reminder email
  → If overdue 30 days → Pavel notified, support paused
  → If overdue 60 days → contract review triggered
```

---

## Revenue Tracking

```
Per project:
  Revenue = sum of paid invoices
  Expenses = AI costs + network payments + infra
  P&L = Revenue - Expenses
  Margin = P&L / Revenue × 100

Dashboard shows:
  - This month: revenue, expenses, margin
  - By project: revenue vs budget
  - By client: total lifetime value
  - Overdue invoices: count, total amount
  - Maintenance: active contracts, monthly recurring
```

---

## Stream 2: Own Products

```
Dentour:
  Revenue model: commission per booking (% of GMV)
  Target: 500 bookings/year, €750K GMV
  Payment: Stripe (client pays clinic via platform)
  Pavel's share: equity + technical co-founder fee

VIVOD:
  Revenue model: SaaS subscription (clients of VIVOD)
  Target: pilot clients (Gishat Havalim, Euro Towers)
  Payment: Stripe subscription
  Pavel's share: equity (CTO) + salary when funded
```

These are separate financial entities with their own
Stripe accounts, managed within their organizations
in the platform.

---

## Stream 3: SaaS Tools (Future)

```
Potential products to extract from the platform:
  - Domain Map Builder (standalone tool)
  - OpenSpec Visualizer (for other developers)
  - AI Discovery Bot (Canvas as a service)
  - Brand DNA Generator

Pricing: freemium + paid tiers
Payment: Stripe subscription
Timeline: after platform is proven (6-12 months)
```

---

## Legal Structure

```
Current: Freelancer / sole proprietor in Moldova
  - Moldovan bank account
  - Local tax registration
  - Can invoice EU clients (EUR)
  - Can invoice Israeli clients (ILS/USD)

Future: Company registration
  - When: revenue > threshold or partnership requires it
  - Where: Moldova (low tax) or Israel (clients proximity)
  - Structure: affects IP ownership, tax, invoicing
```

---

## Integration with Platform

```
Quote      → created in Studio, sent via Resend
Contract   → stored in Supabase Storage, linked to project
Invoice    → generated from Quote, tracked in finance
Payment    → confirmed manually (now) or via webhook (future)
Receipt    → auto-generated PDF, sent via Resend
Maintenance → auto-billed monthly, auto-reminded on overdue

All entities have Entity Views:
  Quote.Inline:   "Dentour Build — €45,000 — Accepted"
  Invoice.Row:    "#INV-2026-003 | Milestone 2 | €13,500 | Paid"
  Payment.Card:   amount, date, method, reference
```
