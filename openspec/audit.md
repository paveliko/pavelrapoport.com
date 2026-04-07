# OpenSpec Init Audit — Multi-Persona Review

> 6 expert reviewers. 93 findings. 3 critical blockers.
> Conducted: 2026-04-07

---

## Reviewer 1: Security Engineer (Alex Chen)

12 years in AppSec, OWASP contributor.

| # | Finding | Sev | Current State | Recommendation |
|---|---------|-----|---------------|----------------|
| 1.1 | Auth flows (email, SMS, WhatsApp OTP) | PASS | All 3 described with scenarios in auth/spec.md | — |
| 1.2 | Session management | PASS | Cookie scope `.pavelrapoport.com`, 1h access/7d refresh, rotation described | — |
| 1.3 | Stolen session handling | MEDIUM | Not explicitly addressed. Short JWT TTL helps but no session revocation endpoint described | Add `revokeSession(userId)` to @rapoport/auth, mention in auth spec |
| 1.4 | MFA for admin | HIGH | Not mentioned anywhere. Pavel is the single admin with full platform access | Require TOTP/passkey for admin role. Single point of compromise |
| 1.5 | 3-level access model | PASS | Platform->org->project well-defined, `can_access_project()` RLS function spec'd | — |
| 1.6 | Privilege escalation prevention | MEDIUM | Roles described but no explicit guard against org_role self-modification | Add RLS policy: users cannot UPDATE their own org_role |
| 1.7 | Cross-org data leakage | PASS | RLS tests defined (cross-project, cross-org isolation), CI test matrix in auth spec | — |
| 1.8 | Secrets inventory | PASS | 46 secrets cataloged in secrets-registry.md with storage locations, rotation schedule | — |
| 1.9 | Client bundle exposure | PASS | Clear NEXT_PUBLIC_ prefix rules, lint rule `no-service-key-in-client` in CI | — |
| 1.10 | Rate limiting per endpoint | MEDIUM | Cloudflare rate limit mentioned (5/min login) but per-API-endpoint limits not defined | Define rate limits for: auth endpoints, AI endpoints, webhook receivers |
| 1.11 | Input validation | PASS | Zod at every boundary, conventions.md enforces zero `any` | — |
| 1.12 | CORS policy | PASS | Whitelist: only 2 subdomains defined in auth security architecture | — |
| 1.13 | CSRF protection | PASS | Origin header verification + SameSite=Lax cookies | — |
| 1.14 | File upload security | MEDIUM | Storage RLS, type validation, size limits mentioned but no malware scanning | Add ClamAV or Cloudflare R2 scanning for uploads |
| 1.15 | Webhook signature validation | HIGH | Webhooks mentioned (Linear, GitHub) but signature verification not spec'd | Add requirement: every webhook MUST verify signature before processing |
| 1.16 | GDPR/PII handling | HIGH | Data deletion mentioned in ip-and-trust.md but no formal GDPR compliance spec | Add data processing agreement template, retention policy, right to export |
| 1.17 | Backup/recovery | CRITICAL | Not mentioned anywhere. No backup strategy, no RPO/RTO defined | Define: Supabase backup schedule, point-in-time recovery, RTO target |
| 1.18 | Audit log tamper-proofing | PASS | Append-only, only platform admin can delete with audit of deletion | — |
| 1.19 | AI prompt injection | HIGH | Canvas takes client input -> domain graph. No input sanitization before AI processing described | Add: sanitize client input before AI processing, restrict tool_use in Canvas mode |
| 1.20 | Supabase defaults | MEDIUM | "Never use `user_metadata` in RLS" -- good. But no mention of disabling public schema access for anon | Verify anon role has zero SELECT on all tables by default |

**Score: 72/100** | CRITICAL: 1 | HIGH: 4 | MEDIUM: 5 | PASS: 10

---

## Reviewer 2: Web Architect (Maria Santos)

15 years building distributed systems. Ex-Vercel.

| # | Finding | Sev | Current State | Recommendation |
|---|---------|-----|---------------|----------------|
| 2.1 | Package dependency graph | PASS | Acyclic, clearly documented in conventions.md with direction diagram | — |
| 2.2 | Supabase as sole data store | MEDIUM | All data in Supabase PostgreSQL. Domain graph as JSONB not discussed | For domain-map: evaluate if JSONB or normalized tables for entity graph |
| 2.3 | Full-text search | HIGH | Not mentioned. Studio needs search across projects, entities, specs, tasks | Define: PostgreSQL `tsvector` or external (Meilisearch). Critical for Studio UX |
| 2.4 | OpenAPI contract-first | PASS | Conventions defines @hey-api/openapi-ts codegen -> TanStack Query hooks | — |
| 2.5 | Pagination strategy | MEDIUM | Not defined. Lists (projects, tasks, members) need cursor-based pagination | Define: cursor-based for infinite lists, offset for admin tables |
| 2.6 | API versioning | MEDIUM | Not mentioned. Will matter when client portal launches | Define: URL prefix versioning (/v1/) or header-based |
| 2.7 | Server vs client components | PASS | Conventions: useQuery for data, nuqs for URL state, minimal client state | — |
| 2.8 | Bundle size risk | MEDIUM | D3.js + React Flow + XState all in studio. No code-splitting guidance beyond "per-route" | Define: lazy-load D3/React Flow only on domain-map route |
| 2.9 | Form state | MEDIUM | Not mentioned in conventions. react-hook-form implied but not specified | Add: form library choice (react-hook-form + zod resolver) |
| 2.10 | Webhook processing | HIGH | Linear/GitHub webhooks mentioned but no queue/retry architecture | Define: webhook -> queue (Railway worker) -> process. Dead letter queue for failures |
| 2.11 | Connection error recovery | PASS | Lifecycle defined: disconnected->connecting->connected->error, health checks | — |
| 2.12 | Multi-tenant RLS performance | MEDIUM | RLS-referenced columns indexed (mentioned). But no benchmark guidance | Add: index strategy doc, explain how org_id index enables RLS at scale |
| 2.13 | Realtime subscriptions at scale | MEDIUM | Supabase Realtime -> TanStack Query invalidation. No concurrency limits discussed | Define: max subscriptions per client, channel naming convention |
| 2.14 | AI API throttling | MEDIUM | Token tracking per session/project but no budget caps or queue | Add: per-org token budget, queue for AI tasks, graceful degradation |
| 2.15 | N+1 query risk | MEDIUM | Entity relationships (project->org->members->assignments) not addressed | Add: use Supabase `.select('*, organization(*)')` pattern guidance |
| 2.16 | Image optimization | MEDIUM | Not mentioned. Brand assets, avatars, portfolio need optimization | Add: Cloudflare Images or next/image with Supabase Storage |

**Score: 68/100** | CRITICAL: 0 | HIGH: 2 | MEDIUM: 11 | PASS: 4

---

## Reviewer 3: Product Owner (David Katz)

Product lead. Built 3 B2B SaaS products from 0 to Series A.

| # | Finding | Sev | Current State | Recommendation |
|---|---------|-----|---------------|----------------|
| 3.1 | Canvas->Studio->Pipeline flow | PASS | Clear in use-cases.md and studio/spec.md | — |
| 3.2 | MVP scope | HIGH | 14 domains for one person. Even with AI, this is 6-12 months. No prioritization | Define: Phase 1 domains (auth, organizations, projects, web, blog). Others are P2+ |
| 3.3 | Pricing/revenue model | CRITICAL | Not in any spec. config.yaml mentions 3 revenue streams but no pricing page, no payment flow | Add finance requirement: pricing tiers, payment flow, Stripe checkout integration |
| 3.4 | Client payment flow | HIGH | Finance tracks invoices but no spec for: generating invoice -> sending -> collecting | Add: invoice generation, payment link, payment status webhook from Stripe |
| 3.5 | Client onboarding | HIGH | AI Canvas described but first-time client experience not spec'd | Add: onboarding flow spec -- landing -> chat -> NDA -> discovery -> dashboard |
| 3.6 | Partner day-one experience | MEDIUM | Seed data creates org but no spec for partner onboarding to Studio | Add scenario: partner receives invite -> first login -> sees project |
| 3.7 | Portfolio/case studies | PASS | Blog spec covers case studies format: Problem->Solution->Result with numbers | — |
| 3.8 | Global search | HIGH | Not mentioned. Studio without search across projects/entities/tasks is painful | See 2.3 -- define search spec |
| 3.9 | Notifications system | MEDIUM | Messages spec mentions notifications but no unified notification spec | Define: notification preferences, delivery channels, batching |
| 3.10 | Competitive differentiation | PASS | OpenSpec + AI Listener + Canvas is unique. Use-cases clarify 3 personas well | — |
| 3.11 | KPIs/metrics | MEDIUM | PostHog integrated but no success metrics defined | Define: Canvas sessions->conversions, time-to-first-spec, client NPS |
| 3.12 | 14 domains for MVP | HIGH | Risk of building breadth not depth. Shallow specs (3 scenarios) won't guide implementation | Prioritize: deep spec 5 core domains, stub the rest |
| 3.13 | AI dependency | MEDIUM | What happens if Claude API is down? No fallback described | Add: graceful degradation -- show "AI unavailable" state, queue tasks |

**Score: 62/100** | CRITICAL: 1 | HIGH: 5 | MEDIUM: 4 | PASS: 3

---

## Reviewer 4: QA Engineer (Yuki Tanaka)

10 years QA, specializes in test architecture for startups.

| # | Finding | Sev | Current State | Recommendation |
|---|---------|-----|---------------|----------------|
| 4.1 | E2E critical paths | PASS | 4 critical flows defined in conventions.md testing section | — |
| 4.2 | Unit test targets | PASS | "ALWAYS test" list: auth, RLS, XState, API, adapters, finance calcs | — |
| 4.3 | Integration test layer | MEDIUM | API endpoint testing mentioned but no dedicated integration test strategy | Define: API integration tests with test Supabase instance |
| 4.4 | Adapter testability | PASS | Pure functions, example test provided in conventions.md | — |
| 4.5 | AI response testing | HIGH | Non-deterministic AI outputs not addressed. How test Canvas generates valid domain map? | Define: snapshot testing for AI adapter output shapes, not content |
| 4.6 | Realtime testing | MEDIUM | Not addressed. How test that Supabase Realtime invalidates TanStack cache? | Define: E2E test that creates record -> verify UI updates |
| 4.7 | URL state testing | PASS | "Copy URL -> paste in new tab -> same screen" -- testable pattern | — |
| 4.8 | Seed data coverage | MEDIUM | 3 orgs, but no edge cases: empty org, max entities, unicode names | Add: edge case seed data for testing |
| 4.9 | Migration testing | MEDIUM | Not mentioned. Supabase migrations need rollback testing | Define: migration test strategy (apply -> verify -> rollback) |
| 4.10 | CI pipeline budget | PASS | Defined per branch type: dev (unit+build), staging (+E2E), main (+Lighthouse+audit) | — |
| 4.11 | RLS testing | PASS | `testRLSPolicy` helper + `RLS_TEST_MATRIX` defined in auth spec | — |
| 4.12 | Multi-org state leakage | MEDIUM | Scenario described in auth spec but no explicit E2E test for org switching | Add to E2E: switch org -> verify previous org data not visible |
| 4.13 | Concurrent editing | HIGH | Not addressed. Two tabs editing same entity -- conflict resolution? | Define: last-write-wins or optimistic locking for entity edits |
| 4.14 | Load testing | MEDIUM | Not mentioned. Canvas + AI could be expensive under load | Define: k6 or Artillery load tests for auth and Canvas endpoints |

**Score: 70/100** | CRITICAL: 0 | HIGH: 2 | MEDIUM: 6 | PASS: 6

---

## Reviewer 5: UI/UX Designer (Lena Muller)

Design systems lead. 8 years, ex-Figma.

| # | Finding | Sev | Current State | Recommendation |
|---|---------|-----|---------------|----------------|
| 5.1 | Entity View System (5 levels) | PASS | Inline/Option/Row/Card/Detail well-defined with transition spec | — |
| 5.2 | Brand DNA System | PASS | YAML structure, discovery process, rendering pipeline defined | — |
| 5.3 | shadcn/ui as base | PASS | Good choice -- composable, accessible defaults, Tailwind-native | — |
| 5.4 | Dark mode | MEDIUM | Not mentioned anywhere. Tailwind makes it easy but needs design tokens | Add: dark mode support, `dark:` variant guidance |
| 5.5 | Entity-specific style overrides | MEDIUM | Brand DNA covers this conceptually but no concrete CSS variable mapping | Add: `--entity-primary`, `--entity-secondary` variable pattern |
| 5.6 | Motion (Framer Motion) | PASS | Mentioned for entity transitions. Reduced-motion support in accessibility | — |
| 5.7 | Responsive strategy | MEDIUM | Not detailed. Studio is desktop-first but mobile access for clients? | Define: Studio desktop-only, client portal responsive, web fully responsive |
| 5.8 | Empty states | MEDIUM | Not mentioned. Every list, board, dashboard needs empty state design | Add: empty state guidelines per view type |
| 5.9 | Loading states | MEDIUM | "skeleton over spinner" in accessibility rules but no detailed guidance | Add: skeleton pattern per entity view level |
| 5.10 | Drag and drop | MEDIUM | Pipeline (kanban), entity reorder implied but no implementation guidance | Define: dnd library choice, keyboard alternative for a11y |
| 5.11 | Command palette | MEDIUM | Not mentioned. Studio power users need Cmd+K | Add: cmdk library, command palette spec |
| 5.12 | Icon library | MEDIUM | Not specified. Lucide (shadcn default) assumed but not stated | Define: Lucide React as icon library |
| 5.13 | Typography scale | MEDIUM | Not defined beyond Tailwind defaults | Define: type scale for headings, body, captions, code |
| 5.14 | Spacing system | PASS | Tailwind provides this. No custom system needed | — |
| 5.15 | 3D rendering | MEDIUM | Brand DNA mentions 3D. Premature for MVP | Mark as P3/future. Don't spec now |

**Score: 66/100** | CRITICAL: 0 | HIGH: 0 | MEDIUM: 10 | PASS: 5

---

## Reviewer 6: Accessibility Specialist (Sam Brooks)

WCAG auditor, IAAP certified. Blind since birth.

| # | Finding | Sev | Current State | Recommendation |
|---|---------|-----|---------------|----------------|
| 6.1 | React Flow screen reader | CRITICAL | React Flow is not screen-reader accessible by default. Domain map is a core feature with no alternative text representation | Add: text-based entity list as alternative view, aria-live for graph changes |
| 6.2 | Chat streaming accessibility | HIGH | Not addressed. Streaming AI responses need `aria-live="polite"` regions | Add: streaming response accessibility pattern |
| 6.3 | Keyboard navigation rules | PASS | 10 core rules defined. Tab, Enter, Escape patterns specified | — |
| 6.4 | Focus management | PASS | Modal focus trap, return-to-trigger defined in component requirements | — |
| 6.5 | RTL support | MEDIUM | i18n mentions Hebrew + logical properties but mixed content (HE + code) not addressed | Add: mixed-direction content handling (code blocks always LTR in RTL context) |
| 6.6 | Color-only information | PASS | Rule 10: "No information conveyed by color alone" -- icons + text required | — |
| 6.7 | Entity status indicators | MEDIUM | Status lifecycle defined but accessible representation not mandated per entity | Add: all status badges MUST have icon + text, not just color |
| 6.8 | Kanban/pipeline keyboard | HIGH | Pipeline board is kanban-like. No keyboard drag-and-drop described | Add: arrow keys to move cards between columns, or list alternative |
| 6.9 | prefers-reduced-motion | PASS | Mentioned in accessibility section, Framer Motion respects it | — |
| 6.10 | Cognitive load (14 domains) | MEDIUM | Studio navigation with 14+ items. Progressive disclosure not discussed | Define: group nav items, show context-relevant items only |
| 6.11 | Error messages | PASS | "Actionable, not just 'something went wrong'" in error handling section | — |
| 6.12 | Form accessibility | PASS | Labels, aria-describedby for errors, no placeholder-only fields | — |
| 6.13 | Table semantics | PASS | Proper `<th>` scope, caption requirement defined | — |
| 6.14 | Screen reader testing | MEDIUM | "Manual keyboard-only navigation test per page" but no screen reader testing protocol | Add: VoiceOver testing on macOS as part of QA checklist |

**Score: 72/100** | CRITICAL: 1 | HIGH: 2 | MEDIUM: 4 | PASS: 7

---

## 1. Unified Scorecard

| Reviewer | Score | CRITICAL | HIGH | MEDIUM | PASS |
|----------|------:|--------:|-----:|-------:|-----:|
| Security Engineer | 72 | 1 | 4 | 5 | 10 |
| Web Architect | 68 | 0 | 2 | 11 | 4 |
| Product Owner | 62 | 1 | 5 | 4 | 3 |
| QA Engineer | 70 | 0 | 2 | 6 | 6 |
| UI/UX Designer | 66 | 0 | 0 | 10 | 5 |
| Accessibility | 72 | 1 | 2 | 4 | 7 |
| **TOTAL** | **68** | **3** | **15** | **40** | **35** |

---

## 2. Critical Path (must fix before any code)

| # | Finding | Reviewer | Fix |
|---|---------|----------|-----|
| 1.17 | **No backup/recovery strategy** | Security | Define Supabase backup schedule, PITR, RTO/RPO targets |
| 3.3 | **No pricing/revenue model in specs** | Product | Add pricing tiers, Stripe checkout flow, payment webhook to finance spec |
| 6.1 | **React Flow inaccessible to screen readers** | Accessibility | Add text-based entity list as alternative to domain map graph |

---

## 3. High Priority (must fix before MVP)

**Auth/Security:**
- MFA for admin account (1.4)
- Webhook signature verification requirement (1.15)
- GDPR/data processing spec (1.16)
- AI prompt injection sanitization (1.19)

**Architecture:**
- Full-text search strategy (2.3)
- Webhook queue/retry architecture (2.10)

**Product:**
- MVP domain prioritization -- build 5 deep, not 14 shallow (3.2, 3.12)
- Client payment flow spec (3.4)
- Client onboarding flow (3.5)
- Global search in Studio (3.8)

**QA:**
- AI response shape testing strategy (4.5)
- Concurrent editing conflict resolution (4.13)

**Accessibility:**
- Chat streaming `aria-live` regions (6.2)
- Kanban keyboard navigation (6.8)

---

## 4. Spec Gaps (missing content)

| Gap | Reviewer | What to add | Effort |
|-----|----------|-------------|--------|
| Backup & disaster recovery doc | Security | RPO/RTO, Supabase backup, restore procedure | S |
| Pricing/payment flow | Product | Finance spec: tiers, Stripe integration, invoice->payment | M |
| Search architecture | Architect + Product | New section in conventions.md: PostgreSQL tsvector or external | M |
| Webhook processing architecture | Architect | New section in conventions.md: queue, retry, dead letter | M |
| Client onboarding flow | Product | New requirement in web/spec.md or clients/spec.md | S |
| Notification system spec | Product | Expand messages/spec.md: channels, preferences, batching | M |
| Form library choice | Architect | Add to conventions.md: react-hook-form + zod resolver | S |
| Responsive strategy per app | UX | Add to conventions.md: desktop-only (Studio), responsive (web, portal) | S |
| Screen reader testing protocol | Accessibility | Add to conventions.md testing section | S |
| MVP phase roadmap | Product | Add to project.md: Phase 1 (5 domains), Phase 2 (5 domains), Phase 3 | M |

---

## 5. Architecture Decisions Needed

1. **Domain graph storage:** JSONB column vs normalized tables -- JSONB is simpler but harder to query/index. Normalized enables RLS per entity. **Rec: normalized tables with JSONB metadata field.**

2. **Search engine:** PostgreSQL `tsvector` vs Meilisearch -- tsvector is free, in-DB, good enough for <100K records. Meilisearch is better UX but another service. **Rec: tsvector now, extract later if needed.**

3. **Webhook processing:** Synchronous in API route vs Railway worker queue -- sync is simpler but blocks on failures. Queue is resilient. **Rec: queue from day one, Linear/GitHub webhooks are critical path.**

4. **MVP scope:** 14 domains vs 5 deep -- building all 14 shallow means nothing works end-to-end. **Rec: auth + organizations + projects + web + blog for Phase 1. Studio, tasks, integrations for Phase 2.**

5. **Concurrent editing:** Last-write-wins vs optimistic locking -- LWW is simpler but loses data. OL is safer but more complex. **Rec: LWW with `updated_at` check for MVP, upgrade to CRDT later for domain-map.**

---

## 6. Overall Assessment

**What is exceptionally well done:** The auth domain is production-grade -- 7-layer security architecture, 3-level access model (platform->org->project), secrets registry with rotation schedule, RLS test matrix, and audit trail. The conventions.md is one of the best engineering handbooks for a solo project: adapter architecture, strict React rules, URL-as-state philosophy, and infrastructure decisions are all opinionated and correct. The IP & Trust framework is rare and valuable -- most startups don't think about this until it's too late. Three real projects (Pavel, VIVOD, Dentour) grounding the seed data makes this feel lived-in, not theoretical.

**The biggest risk:** Scope. 14 domains, 24 integrations, 3 organizations, conventions covering 30 sections -- this is the spec for a 10-person engineering team, not a solo developer + AI. The danger is building everything to 20% and nothing to 100%. The shallow specs (blog: 3 scenarios, web: 3 scenarios, network: 4 scenarios) won't guide implementation -- they'll force re-speccing mid-build. The missing revenue model means there's no financial feedback loop to validate whether the platform generates income before it's fully built. Additionally, the single backup/recovery gap is a genuine launch blocker.

**Recommended next 5 actions:**
1. **Add backup/recovery spec** to auth domain -- Supabase PITR, RTO <4h, RPO <1h. This is the only true blocker.
2. **Define MVP phases** in project.md -- Phase 1: auth, organizations, projects, web, blog (the minimum to have a public site with login and project management). Phase 2: studio, tasks, integrations. Phase 3: everything else.
3. **Add pricing/payment flow** to finance spec -- even a simple "send invoice link via Stripe" unblocks revenue.
4. **Deep-spec the 5 Phase 1 domains** -- expand blog (3->10 scenarios), web (3->8 scenarios), bring each to the depth of auth.
5. **Add search and webhook architecture** to conventions.md -- these are cross-cutting concerns that affect multiple domains.
