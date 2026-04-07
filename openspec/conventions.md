# Conventions — How We Write, Ship, and Think

> Minimum code. Maximum reuse. Every entity has a visual form.

---

## Git Workflow

### Branches

```
main              → production, always deployable
staging           → pre-production, integration testing
dev               → active development, daily work

feature/<name>    → new feature (from dev)
fix/<name>        → bug fix (from dev)
chore/<name>      → maintenance, deps, configs
hotfix/<name>     → urgent prod fix (from main)
```

Flow:
```
feature/add-auth → dev → staging → main
                   ↑               ↑
                   PR + review      PR + review
                   tests pass       tests pass
```

### Conventional Commits

```
type(domain): description

Types:
  feat     → new feature
  fix      → bug fix
  refactor → restructure without behavior change
  style    → formatting, no logic change
  test     → adding or fixing tests
  docs     → documentation only
  chore    → deps, configs, tooling
  perf     → performance improvement
  ci       → CI/CD changes

Domain = OpenSpec domain or package:
  feat(auth): add WhatsApp OTP login
  fix(projects): correct RLS policy for viewer role
  chore(ui): update shadcn components
  docs(openspec): add partnership lifecycle
  feat(ai): implement Listener mode
```

### Versioning

Monorepo packages versioned independently:
```
@rapoport/ui       → 0.1.0, 0.2.0, ...
@rapoport/auth     → 0.1.0, 0.2.0, ...
@rapoport/db       → 0.1.0, 0.2.0, ...
```

Apps follow semver loosely — main milestones:
```
0.x  → building, pre-launch
1.0  → first public release
```

### PR Process

```
1. Branch from dev
2. Write code + tests
3. Self-review diff
4. openspec validate (if specs changed)
5. Push → CI runs:
   - pnpm check-types
   - pnpm test
   - pnpm build
   - pnpm lint
6. Create PR → dev
7. Review (or self-review for solo work)
8. Squash merge
9. Delete branch
```

---

## Code Philosophy

### Core Principles

1. **Minimum code.** Less code = fewer bugs = easier
   to understand. If a library does it — use it.
   If a function exists — reuse it. Don't write what
   you can import.

2. **Stateless client.** No client-side state management.
   Server is the source of truth. Client syncs with server.
   Always.

3. **CLI-first.** Think of everything as CLI + API.
   The web UI is a read-only view of what CLI produces.
   ```
   CLI → JSON output → Database → Web UI (read-only)
   ```

4. **Libraries over code.** Build reusable packages.
   If you wrote it twice, extract it. If it's useful
   outside the project, make it standalone.

5. **Entity-driven.** Every piece of data is an entity.
   Every entity has visual representations. Design the
   entity first, then the screens.

6. **URL is the state.** Everything visible on screen
   has a unique URL. Every screen, every modal, every
   filter, every tab, every selected entity. If you
   can see it — it has an address.
   ```
   Two sources of truth. Nothing else:
     Server  → data (via TanStack Query)
     URL     → UI state (via searchParams + route)

   No useState for:
     - which tab is active      → ?tab=specs
     - which modal is open      → ?modal=entity&id=abc
     - which filters are set    → ?status=active&sort=date
     - which entity is selected → /projects/dentour/entities/patient

   Test: copy URL → paste in new tab → same screen.
   Test: send URL in email → recipient sees the same thing
         (if access allows).
   ```
   Architecture starts with URL design.
   Before building a screen, write its URL.

### Data Fetching

**TanStack Query (useQuery) everywhere:**
```
- Query keys = index to endpoint
  queryKey: ['projects', projectId]
  queryKey: ['projects', projectId, 'specs']
  queryKey: ['organizations', orgId, 'members']

- No client state for server data
- No useState for things that come from API
- Prefetch on hover for navigation
- Stale time: 30s default, 5min for static data
```

### Adapter Architecture

We don't rebuild services. We consume what exists
(Supabase, Linear, GitHub, Stripe...) through **adapters**.

An adapter is a pure function: external shape in → our shape out.

```
┌──────────────┐     ┌───────────┐     ┌──────────────┐
│ External API │ ──→ │  Adapter  │ ──→ │  Our Type     │
│ (any shape)  │     │ (pure fn) │     │ (strict type) │
└──────────────┘     └───────────┘     └──────────────┘
```

**Rules:**

```
1. One adapter per external service, per entity.
   File: modules/{module}/adapters/{service}.adapter.ts

2. Adapter is a pure function. No side effects.
   Input: external API response type (typed, not any)
   Output: our domain type

3. External types live next to the adapter:
   modules/projects/adapters/linear.adapter.ts
   modules/projects/adapters/linear.types.ts  ← external shape

4. Our domain types live in types/:
   modules/projects/types/project.ts          ← our shape

5. Adapters are the ONLY place where external
   shapes touch our code. Everything else works
   with our types only.
```

**Example:**

```typescript
// adapters/linear.types.ts — external shape
interface LinearIssue {
  id: string
  title: string
  state: { name: string }
  assignee?: { name: string; email: string }
  createdAt: string
}

// adapters/linear.adapter.ts — pure transform
import type { LinearIssue } from './linear.types'
import type { Task } from '../types/task'

export function fromLinearIssue(issue: LinearIssue): Task {
  return {
    id: issue.id,
    title: issue.title,
    status: mapLinearState(issue.state.name),
    assignee: issue.assignee?.email ?? null,
    createdAt: new Date(issue.createdAt),
  }
}

function mapLinearState(state: string): Task['status'] {
  const map: Record<string, Task['status']> = {
    'In Progress': 'active',
    'Done': 'done',
    'Backlog': 'draft',
  }
  return map[state] ?? 'draft'
}

// hooks/use-tasks.ts — consumer never sees LinearIssue
export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: async () => {
      const issues = await linearClient.issues(projectId)
      return issues.map(fromLinearIssue) // ← adapter here
    },
  })
}
```

**Testing adapters:**

```typescript
// adapters/__tests__/linear.adapter.test.ts
import { fromLinearIssue } from '../linear.adapter'

test('maps Linear issue to Task', () => {
  const input: LinearIssue = { /* external shape */ }
  const output = fromLinearIssue(input)

  expect(output.status).toBe('active')
  expect(output.assignee).toBe('pavel@rapoport.com')
})

test('handles missing assignee', () => {
  const input: LinearIssue = { /* no assignee */ }
  const output = fromLinearIssue(input)

  expect(output.assignee).toBeNull()
})
```

Adapters are the easiest code to test: pure input → output.
No mocks needed.

### Optimistic Updates

Pattern: **update UI immediately, sync with server in background,
rollback on failure.**

Built into TanStack Query — not a separate module:

```typescript
// hooks/use-update-project.ts
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['projects', projectId]

  return useMutation({
    mutationFn: (patch: ProjectPatch) =>
      api.projects.update(projectId, patch),

    onMutate: async (patch) => {
      // 1. Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey })

      // 2. Snapshot current state
      const previous = queryClient.getQueryData<Project>(queryKey)

      // 3. Optimistically update cache
      queryClient.setQueryData<Project>(queryKey, (old) =>
        old ? { ...old, ...patch, updatedAt: new Date() } : old
      )

      // 4. Return snapshot for rollback
      return { previous }
    },

    onError: (_err, _patch, context) => {
      // 5. Rollback on failure
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },

    onSettled: () => {
      // 6. Always re-sync with server
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
```

**When to use optimistic updates:**

```
ALWAYS optimistic:
  - Status changes (toggle, approve, archive)
  - Text edits (name, description)
  - Reordering (drag & drop)
  - Toggling (star, pin, favorite)

NEVER optimistic:
  - Create (wait for server ID)
  - Delete (confirm first, then wait)
  - Financial operations
  - Anything that calls external APIs (Linear, GitHub)
```

**Standardized hook pattern:**

Every mutation follows this template. No exceptions.
Copy the pattern, change the types and endpoint.

### Strict React Rules

**Banned patterns:**

```
NEVER use:

  useEffect for data fetching
    → use useQuery

  useEffect for derived state
    → use useMemo or compute inline

  useEffect for event responses
    → use event handlers directly

  useEffect for syncing with URL
    → use nuqs (useQueryState / useQueryStates)

  useState for server data
    → use useQuery

  useState for URL state
    → use nuqs

  any
    → type everything. No exceptions.

  as Type (type assertions)
    → narrow with guards, parse with zod

  // @ts-ignore / @ts-expect-error
    → fix the type, not the compiler
```

**Allowed patterns:**

```
useEffect — ONLY for:
  - Third-party library init (D3, map, chart)
  - Browser API subscriptions (resize, intersection)
  - Cleanup on unmount

useState — ONLY for:
  - Truly local ephemeral UI state
  - Form input before submission
  - Animation/transition triggers
  - Hover/focus states

Everything else → server (useQuery) or URL (nuqs)
```

### Type Safety

**Every boundary is typed:**

```
1. API responses → zod schema → parsed type
   const ProjectSchema = z.object({
     id: z.string().uuid(),
     name: z.string().min(1),
     status: z.enum(['draft', 'active', 'done']),
   })
   type Project = z.infer<typeof ProjectSchema>

2. Adapter inputs → external type (never any)
3. Adapter outputs → domain type
4. Hook returns → typed, no casts
5. Component props → interface, not inline
6. Event handlers → typed event
7. Route params → zod parsed

Zero any in the codebase.
ESLint rule: @typescript-eslint/no-explicit-any → error
```

**Object conventions:**

```
- Interfaces for public contracts (props, API responses)
- Types for unions, intersections, computed types
- Zod schemas for runtime validation at boundaries
- Enums → string unions (type Status = 'draft' | 'active')
  not TypeScript enum (they compile weird)
- Const objects for maps:
  const STATUS_LABELS = {
    draft: 'Draft',
    active: 'Active',
  } as const satisfies Record<Status, string>
```

### State Machines

**XState v5 for complex flows:**
```
Use XState when:
  - Multi-step wizards (onboarding, project init)
  - Complex AI agent mode switching
  - Connection lifecycle (disconnected → connecting → ...)
  - Any flow with 3+ states and conditional transitions

Don't use XState when:
  - Simple toggle (use useState)
  - Form with no steps (use react-hook-form)
  - Binary state (open/closed)
```

### Pipeline / Task Execution

**Sequential task execution pattern:**
```
Task 1: input → process → output
  ↓ (output becomes input)
Task 2: input → process → output
  ↓
Task 3: input → process → output
  ↓
Result

Each step:
  - Has typed input/output
  - Can fail independently
  - Logs progress
  - Is retryable
```

XState is the orchestrator for multi-step pipelines:
AI Listener → classify → extract entities → create draft
→ generate specs → create task → notify.

---

## Server Architecture

### Contract-First API

**OpenAPI spec is the single source of truth for all API contracts.**

We don't write API clients by hand. We don't write types for
responses by hand. The spec generates everything.

```
OpenSpec domain specs
  ↓ (manual or AI-assisted)
OpenAPI 3.1 spec (openapi.yaml)
  ↓ (@hey-api/openapi-ts)
Generated:
  ├── TypeScript types (request/response shapes)
  ├── TanStack Query hooks (useQuery/useMutation)
  ├── Query keys (auto-generated, type-safe)
  ├── Zod schemas (runtime validation)
  └── SDK client (fetch-based, typed)
```

**Tooling:**

```
@hey-api/openapi-ts    → codegen from OpenAPI spec
                          generates types, SDK, TanStack Query hooks,
                          zod schemas. Used by Vercel, PayPal.

Output lives in:       packages/api/generated/
                       ↑ treat as dependency, never edit manually

Regenerate on change:  pnpm openapi:generate
                       reads openapi.yaml → writes generated/
```

**OpenAPI spec structure:**

```yaml
# packages/api/openapi.yaml
openapi: 3.1.0
info:
  title: Pavel Rapoport Platform API
  version: 0.1.0

tags:
  - name: projects     # ← maps to OpenSpec domain
  - name: auth
  - name: organizations
  - name: tasks

paths:
  /api/projects:
    get:
      operationId: listProjects    # ← becomes hook name
      tags: [projects]
      parameters:
        - $ref: '#/components/parameters/Status'
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Project'

components:
  schemas:
    Project:                       # ← becomes TypeScript type
      type: object
      required: [id, name, status]
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        status:
          type: string
          enum: [draft, shaping, speccing, building, delivered]
```

**What gets generated:**

```typescript
// generated/types.ts (auto)
export interface Project {
  id: string
  name: string
  status: 'draft' | 'shaping' | 'speccing' | 'building' | 'delivered'
}

// generated/queries.ts (auto)
export function listProjectsOptions(params?: ListProjectsParams) {
  return {
    queryKey: [{ _id: 'listProjects', ...params }],
    queryFn: () => client.GET('/api/projects', { params }),
  }
}

// usage in component — zero manual typing
import { listProjectsOptions } from '@rapoport/api/generated'

function ProjectList() {
  const { data } = useQuery(listProjectsOptions({ status: 'active' }))
  //      ^ typed as Project[]
}
```

**Rules:**

```
1. Every API endpoint exists in openapi.yaml BEFORE code
2. Every endpoint has operationId (becomes hook name)
3. Every endpoint is tagged with its OpenSpec domain
4. Schemas reference each other ($ref), no inline duplication
5. Generated code is never edited — only the spec
6. pnpm openapi:generate runs in CI — drift = build failure
```

### Real-Time Updates

**Supabase Realtime → TanStack Query cache invalidation.**

No Socket.io. Supabase already gives us PostgreSQL
change notifications. We just wire them to invalidate
the right query keys.

```typescript
// lib/realtime.ts
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@rapoport/db'

export function useRealtimeInvalidation(
  table: string,
  queryKey: readonly unknown[]
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, queryClient, queryKey])
}

// usage
function ProjectList() {
  const query = useQuery(listProjectsOptions())
  useRealtimeInvalidation('projects', ['listProjects'])
  return <List data={query.data} />
}
```

**When to use realtime:**

```
ALWAYS realtime:
  - Canvas sessions (client is typing, domain map updates)
  - Task status changes (pipeline progress)
  - Messages / chat

NEVER realtime:
  - Static reference data (organizations, settings)
  - Specs (edited manually, saved explicitly)
  - Creative assets (uploaded, reviewed on refresh)
```

---

## URL State Architecture

### Library: nuqs

**nuqs** — type-safe URL state for Next.js. 5.5 kB.
Like useState, but synced with the URL.

```
npm: nuqs
Why: built for Next.js App Router, type-safe parsers,
     server-side cache, shallow updates, debounce built-in.
     Used by Vercel internally.
```

### Every UI state lives in the URL

```
Route params  → identity     /projects/[slug]
Search params → UI state     ?tab=specs&modal=entity&id=abc
```

**URL state catalog — how each UI element maps:**

```
Tabs:
  ?tab=domain
  ?tab=specs
  ?tab=pipeline
  ?tab=creative

Modals / Dialogs:
  ?modal=create-project
  ?modal=entity&id=abc-123
  ?modal=confirm-delete&target=abc-123

Side panels:
  ?panel=entity-detail&id=abc-123

Filters:
  ?status=active
  ?status=active,done         (multiple values)
  ?assignee=pavel
  ?sort=created_at&order=desc

Search:
  ?q=dentour                  (debounced with nuqs)

Pagination:
  ?page=3&per_page=25

Selected items:
  ?selected=abc-123,def-456

Expanded sections:
  ?expand=visual,voice        (accordion state)
```

### Implementation patterns

**Define parsers per page:**

```typescript
// modules/projects/search-params.ts
import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
  parseAsStringEnum,
  parseAsArrayOf,
} from 'nuqs/server'

export const projectParsers = {
  tab: parseAsStringEnum(['domain', 'specs', 'pipeline', 'creative'])
    .withDefault('domain'),
  modal: parseAsString,
  panel: parseAsString,
  id: parseAsString,
  q: parseAsString.withDefault(''),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  sort: parseAsString.withDefault('created_at'),
  order: parseAsStringEnum(['asc', 'desc']).withDefault('desc'),
  page: parseAsInteger.withDefault(1),
}

export const projectParamsCache =
  createSearchParamsCache(projectParsers)
```

**Server component reads params:**

```typescript
// app/(auth)/projects/[slug]/page.tsx
import { projectParamsCache } from '@/modules/projects/search-params'

export default async function ProjectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const params = projectParamsCache.parse(await searchParams)
  const project = await getProject(params)

  return <ProjectWorkspace project={project} />
}
```

**Client component updates params:**

```typescript
// modules/projects/components/project-tabs.tsx
'use client'
import { useQueryState, parseAsStringEnum } from 'nuqs'

const tabs = ['domain', 'specs', 'pipeline', 'creative'] as const

export function ProjectTabs() {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum(tabs).withDefault('domain')
  )

  return (
    <nav>
      {tabs.map((t) => (
        <button
          key={t}
          data-active={tab === t}
          onClick={() => setTab(t)}
        >
          {t}
        </button>
      ))}
    </nav>
  )
}
```

**Dialogs and modals via URL:**

```typescript
'use client'
import { useQueryStates, parseAsString } from 'nuqs'

export function useModal() {
  const [{ modal, id }, setModal] = useQueryStates({
    modal: parseAsString,
    id: parseAsString,
  })

  return {
    isOpen: !!modal,
    modal,
    entityId: id,
    open: (name: string, entityId?: string) =>
      setModal({ modal: name, id: entityId ?? null }),
    close: () => setModal({ modal: null, id: null }),
  }
}

// usage
function Toolbar() {
  const { open } = useModal()
  return (
    <button onClick={() => open('create-project')}>
      New Project
    </button>
  )
}

function ModalHost() {
  const { isOpen, modal, entityId, close } = useModal()
  if (!isOpen) return null

  // URL: ?modal=entity-detail&id=abc-123
  switch (modal) {
    case 'create-project':
      return <CreateProjectDialog onClose={close} />
    case 'entity-detail':
      return <EntityDetailPanel id={entityId!} onClose={close} />
    case 'confirm-delete':
      return <ConfirmDeleteDialog id={entityId!} onClose={close} />
    default:
      return null
  }
}
```

**Filters with search:**

```typescript
'use client'
import { useQueryStates, parseAsString, parseAsArrayOf } from 'nuqs'

export function useFilters() {
  return useQueryStates(
    {
      q: parseAsString.withDefault(''),
      status: parseAsArrayOf(parseAsString).withDefault([]),
      sort: parseAsString.withDefault('created_at'),
      order: parseAsString.withDefault('desc'),
    },
    {
      shallow: false,       // re-run RSC with new filters
      clearOnDefault: true, // clean URL when default
    }
  )
}

// URL: ?q=dent&status=active,shaping&sort=name&order=asc
```

### URL state rules

```
1. Copy URL → new tab → identical screen (the golden test)
2. Send URL via email → recipient sees same thing (if access allows)
3. Browser back button works for every state change
4. No orphan state: if modal closes, params are cleaned
5. clearOnDefault: true — URL stays clean
6. Debounce search input (300ms) — don't flood history
7. Shallow updates for tabs/modals (no server round-trip)
8. Deep updates (shallow: false) for filters that affect data
```

---

## Entity View System

Every entity in the system has **five visual representations**.
Design all five before building any screen.

```
Entity: Project
  │
  ├── Inline    → one line of text: "Dentour Platform"
  │               used in: selects, autocomplete, breadcrumbs
  │
  ├── Option    → icon + name + subtitle
  │               used in: dropdowns, pickers, command palette
  │
  ├── Row       → full width, key fields visible
  │               used in: tables, lists, inbox
  │
  ├── Card      → compact rectangle, visual summary
  │               used in: grids, dashboards, kanban
  │
  └── Detail    → full page/panel, all information
                  used in: project page, side panel, modal
```

**Transitions between views:**

```
Inline → Row → Card → Detail

Each transition is animated:
  - Inline expands to Row (height grows, fields appear)
  - Row expands to Card (width grows, visual elements appear)
  - Card expands to Detail (fills viewport, all data loads)
  - Detail collapses back to Card → Row → Inline

Responsive behavior:
  Desktop: Detail as main view, Cards in sidebar
  Tablet: Cards as main view, Detail as overlay
  Mobile: Rows as list, Detail as full screen
```

**Every entity gets this treatment:**
Project, Client, Organization, NetworkMember, Task,
Domain, Connection, Spec, Article, Invoice, Message.

**Art scenes — entities as visual compositions:**

Each entity isn't just data in a box. It's a designed
composition with:
- Visual identity (colors, shapes, mood)
- Motion (how it appears, transforms, responds)
- Context awareness (adapts to where it lives)
- Personality (a Project feels different from a Task)

The goal: every screen feels curated, not generated.
Pavel is a director, not a template filler.

---

## Brand DNA System

Every project has a **digital brand** — a living character
described as structured data in OpenSpec. Technology-agnostic.
Renderable in any medium: web, mobile, 3D, print, motion.

### What is a Digital Brand

Not a logo file. Not a color palette PDF.
A brand is a **character** — it has personality, voice,
behavior, visual form. It lives in the network.
It reacts. It adapts. It has opinions.

### Discovery Process

```
Problem   → What pain exists in the world?
Solution  → How does this product solve it?
Character → Who IS this product as a person?
```

Pavel discovers this through conversation with AI + client:
- AI Listener captures raw ideas
- Muse Canvas extracts entities and relationships
- Pavel shapes the character, gives creative direction
- Artists and copywriters bring it to life

### Brand Spec Structure

Every project brand is described in OpenSpec:

```yaml
brand:
  # Core
  problem: "Dental patients don't trust clinics abroad"
  solution: "Verified reviews + transparent pricing + human guides"
  character: "A trusted friend who's been there before"

  # Personality
  personality:
    archetype: guide          # hero | guide | rebel | sage | ...
    tone: warm, direct, honest
    vocabulary:
      use: [journey, trust, real, verified, your]
      avoid: [cheap, discount, deal, patients (use 'people')]
    voice_examples:
      - "You'll know exactly what to expect before you fly."
      - "Real stories from real people."

  # Visual Identity
  visual:
    mood: calm confidence, medical trust, travel excitement
    palette:
      primary: "#0F766E"
      secondary: "#F0FDFA"
      accent: "#F59E0B"
      neutral: "#1E293B"
      semantic:
        success: "#10B981"
        warning: "#F59E0B"
        error: "#EF4444"
    typography:
      heading: "DM Sans"      # or font family
      body: "Inter"
      mono: "JetBrains Mono"
      scale: [12, 14, 16, 18, 20, 24, 30, 36, 48, 60]
    shapes:
      corners: rounded-lg     # sharp | rounded | pill
      borders: subtle         # none | subtle | strong
      shadows: soft           # none | soft | dramatic
    imagery:
      style: photography, natural light, real people
      avoid: stock photos, illustrations, clip art

  # Motion
  motion:
    feel: smooth, purposeful  # not bouncy, not instant
    speed: normal             # slow | normal | fast
    enter: fade-up            # how elements appear
    exit: fade-out
    transitions: ease-out
    loading: skeleton          # skeleton | spinner | shimmer

  # 2D Rendering
  render_2d:
    entity_shapes: rounded rectangles with icon + color
    relationship_lines: curved, subtle, animated on hover
    canvas_background: dot grid, light
    selection: glow + scale

  # 3D Rendering (future)
  render_3d:
    style: clean, geometric
    materials: glass, soft plastic
    lighting: studio, warm
    camera: isometric or orbit

  # Behavior in Network
  network_presence:
    avatar: generated from palette + archetype
    greeting: "Hey, I'm Dentour. Ask me anything about dental travel."
    response_style: concise, friendly, always include a link
    active_hours: "9:00-21:00 EET"
```

### How Brand Feeds the System

```
Brand Spec (OpenSpec YAML/Markdown)
  │
  ├── Entity View System
  │     CSS custom properties generated from palette
  │     Typography applied from font stack
  │     Shapes follow corners/borders/shadows
  │
  ├── Muse Prompts
  │     personality → system prompt tone
  │     vocabulary → word choice rules
  │     voice_examples → few-shot examples
  │
  ├── Component Library
  │     Tailwind theme extended from palette
  │     Motion presets from motion config
  │     Entity cards styled per brand
  │
  ├── Marketing / Content
  │     Blog voice follows personality
  │     Case studies use brand vocabulary
  │     Social posts match tone
  │
  └── Future: 3D / AR / Print
        Same spec, different renderer
```

### Pavel's Role

Pavel is the **Brand Architect**:
- Discovers the character (with AI + client)
- Shapes visual direction (mood, palette, type)
- Defines behavior rules (what the brand does and doesn't do)
- Reviews all creative output against the spec
- Evolves the brand as the product evolves

The spec is the contract between creativity and code.
AI reads it. Designers read it. Code renders it.
One source of truth for how a product looks, feels, and speaks.

---

## Styling

**Tailwind CSS as foundation** — utility-first, fast,
consistent. Good for structure and layout.

**Beyond Tailwind for art:**
- CSS animations + Framer Motion for entity transitions
- SVG + D3.js for domain maps and data visualization
- Canvas API for complex visual compositions
- CSS custom properties for entity-level theming

```
Entity theming example:
  --entity-project-color: #4F46E5
  --entity-project-bg: #EEF2FF
  --entity-client-color: #059669
  --entity-client-bg: #ECFDF5
  
  Each entity carries its own visual DNA.
```

---

## Testing

### Philosophy

Test logic, not UI. Test flows, not components.

### Stack

```
Playwright     → E2E tests (critical user flows)
Vitest         → unit tests (logic, adapters, utils)
```

### What to test

```
ALWAYS test:
  - Auth flows (login, logout, role access)
  - RLS policies (anon/user/admin see correct data)
  - XState machines (all states, transitions, guards)
  - API endpoints (input validation, response shape)
  - Adapters (external service integration logic)
  - Financial calculations (never trust math in prod)

DON'T test:
  - Component rendering (unless complex logic inside)
  - Static pages
  - Styling
  - Third-party library behavior
```

### E2E (Playwright)

```
Critical flows:
  - Login → dashboard → switch org → see correct data
  - Create project → connect services → verify
  - Client signs NDA → starts discovery → draft created
  - AI Listener → voice → draft project appears

Each flow = one test file.
Each test = independent, no shared state.
```

### CI Pipeline

```
On every PR to dev:
  1. pnpm install (cached)
  2. pnpm check-types (all packages)
  3. pnpm lint
  4. pnpm test (vitest — unit tests)
  5. pnpm build (all packages + apps)
  6. openspec validate --all --strict (if specs changed)

On PR to staging:
  + Playwright E2E tests (against staging environment)

On PR to main:
  + Full E2E suite
  + Lighthouse performance check
  + Security audit (npm audit, no high vulnerabilities)
```

---

## Terminology

```
Domain       → business area in OpenSpec (auth, projects, ai...)
               NOT code. A territory with specs, rules, entities.
               Lives in: /openspec/specs/{domain}/
               Example: "the auth domain handles access control"

Module       → code implementation of a domain (or part of it)
               Lives in: apps/{app}/modules/{module}/
               Example: modules/projects/ contains hooks, api, utils

Type         → TypeScript type/interface inside a module
               Lives in: modules/{module}/types/
               Example: ProjectStatus, OrgRole, CanvasSession

Entity       → a named thing in the domain with visual form
               Described in: OpenSpec spec (brand, behavior, views)
               Rendered as: Inline | Option | Row | Card | Detail
               Example: Project, Client, Task, Organization

Package      → shared library in the monorepo
               Lives in: packages/{name}/
               Example: @rapoport/ui, @rapoport/auth, @rapoport/db

Spec         → OpenSpec markdown describing a domain
               Lives in: /openspec/specs/{domain}/spec.md
               Example: specs/auth/spec.md
```

When talking about the system:
- "Add a field to the **projects domain**" → update spec
- "Add a type to the **projects module**" → write TypeScript
- "Create a **Project entity**" → define its 5 views + brand DNA
- "Update the **auth package**" → change @rapoport/auth code

---

## Naming

```
Files:       kebab-case     → project-card.tsx
Components:  PascalCase     → ProjectCard
Functions:   camelCase       → getProjectById
Constants:   SCREAMING_CASE  → MAX_RETRY_COUNT
Types:       PascalCase      → ProjectStatus
Enums:       PascalCase      → OrgRole
DB tables:   snake_case      → organization_members
DB columns:  snake_case      → created_at
URLs:        kebab-case      → /studio/projects/dentour-platform
Query keys:  camelCase array → ['projects', projectId, 'specs']
Packages:    @rapoport/name  → @rapoport/auth
```

---

## File Organization (per app)

```
apps/studio/
  app/
    (auth)/           → auth-required layout group
      dashboard/
      projects/
        [slug]/
          page.tsx     → server component, data fetching
          _components/ → client components for this page
      ...
    (public)/          → no auth required
      login/
    layout.tsx
    
  modules/             → domain logic per module
    projects/
      hooks/           → useProject, useProjectList
      api/             → server actions, API calls
      types/           → ProjectStatus, ProjectConfig
      utils/           → formatProjectSlug, etc.
```

---

## Error Handling

### API Error Format

Every API returns errors in one shape:

```typescript
{
  error: {
    code: 'PROJECT_NOT_FOUND',      // machine-readable
    message_key: 'errors.projects.not_found',  // i18n index
    status: 404,
    details?: { id: 'abc-123' }     // optional context
  }
}
```

**Rules:**

```
1. code is SCREAMING_SNAKE — unique per error
2. message_key is an i18n translation index
3. Never send raw error text to UI — always an i18n key
4. HTTP status codes:
   400 — validation error (bad input)
   401 — not authenticated
   403 — not authorized (RLS / role)
   404 — not found
   409 — conflict (duplicate, state mismatch)
   422 — unprocessable (business rule violation)
   500 — server error (log to Sentry, show generic message)
   429 — rate limit
```

### UI Error Display

```
Toast:         → action feedback (save failed, delete failed)
Inline:        → field validation (name required, email invalid)
Page:          → 404, 403, 500 (full error boundary)
Banner:        → connection lost, API down (top of page)
```

Each error component receives `message_key` and resolves
the translation via `@rapoport/i18n`.

### Retry Strategy

```
Network errors:  → 3 retries, exponential backoff (1s, 2s, 4s)
4xx errors:      → no retry (client error, fix the input)
5xx errors:      → 2 retries, then show error
Rate limit 429:  → respect Retry-After header
```

TanStack Query handles this via `retry` and `retryDelay` config.

---

## i18n

### Package: @rapoport/i18n

Languages: EN (default), RU, HE.
HE = RTL layout.

```
packages/i18n/
  locales/
    en/
      common.json        → shared strings (buttons, labels)
      errors.json        → error messages by scope
      projects.json      → domain-specific translations
      auth.json
    ru/
      ...
    he/
      ...
  index.ts              → exports t(), locale config
```

### Translation keys are scoped by domain:

```json
{
  "errors.projects.not_found": "Project not found",
  "errors.auth.session_expired": "Session expired, please log in",
  "projects.status.draft": "Draft",
  "projects.status.building": "In Progress",
  "common.actions.save": "Save",
  "common.actions.cancel": "Cancel"
}
```

### Rules

```
1. UI never shows hardcoded text — always t('key')
2. Error handler sends message_key → UI resolves via t()
3. Muse matches client language from first message (auto-detect)
4. RTL: use logical CSS properties (margin-inline-start, not margin-left)
5. Date/number formatting: Intl API (Intl.DateTimeFormat, Intl.NumberFormat)
6. Pluralization: ICU message format where needed
```

---

## Accessibility

### Core Rules

```
1. Every interactive element is keyboard-navigable (Tab, Enter, Escape)
2. Every image has alt text (decorative → alt="")
3. Every form field has a visible label (not just placeholder)
4. Every icon button has aria-label
5. Focus order follows visual order (no tabindex hacks)
6. Escape closes any modal/dialog/panel
7. Focus is trapped inside open modals
8. Focus returns to trigger element when modal closes
9. Color contrast: WCAG AA minimum (4.5:1 text, 3:1 large)
10. No information conveyed by color alone (use icons/text too)
```

### Component Requirements

```
Buttons:        → visible focus ring, aria-label if icon-only
Links:          → underline or clear visual distinction
Modals:         → focus trap, Escape to close, aria-modal="true"
Forms:          → labels, error messages linked via aria-describedby
Tables:         → proper <th> scope, caption where needed
Toast:          → role="alert", auto-dismiss after 5s, dismissible
Loading:        → aria-busy="true" on container, skeleton over spinner
```

### Testing

```
Playwright:     → axe-core plugin for automated a11y checks
Manual:         → keyboard-only navigation test per page
Lighthouse:     → a11y score ≥ 90
```

---

## Environment & Config

### Naming Convention

```
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_POSTHOG_KEY=

# Private (server only)
SUPABASE_SERVICE_ROLE_KEY=
CLAUDE_API_KEY=
LINEAR_API_KEY=
GITHUB_TOKEN=
SENTRY_DSN=

Prefix rule:
  NEXT_PUBLIC_ → safe to expose, no secrets
  No prefix    → server-only, never in browser bundle
```

### Where secrets live

```
Local dev:       .env.local (gitignored)
Cloudflare:      Wrangler secrets / Pages env vars
Railway:         Environment variables in dashboard
CI (GitHub):     Repository secrets

Maps to: specs/auth/secrets-registry.md
```

---

## Monorepo Rules

### Dependency Direction

```
apps/web       → can import any @rapoport/* package
apps/studio    → can import any @rapoport/* package

@rapoport/ui   → NEVER imports db, auth, ai, api
                  (pure components, no business logic)

@rapoport/auth → can import db
                  NEVER imports ui, ai, api

@rapoport/db   → NEVER imports anything else
                  (lowest level — types + client only)

@rapoport/ai   → can import db
                  NEVER imports ui, auth

@rapoport/api  → can import db, auth
                  NEVER imports ui

@rapoport/i18n → NEVER imports anything else
                  (standalone — locales + t function)
```

```
       apps (web, studio)
        ↓ ↓ ↓ ↓ ↓ ↓
  ┌─────────────────────────┐
  │  ui   auth  ai   api    │ ← feature packages
  └──────┬──────┬───────────┘
         ↓      ↓
  ┌─────────────────────────┐
  │    db        i18n        │ ← foundation packages
  └─────────────────────────┘

Arrow = "can import from"
Never go sideways. Never go up.
```

### Package Responsibilities

```
@rapoport/db     → Supabase client, generated types, RLS helpers
@rapoport/ui     → Design system, Entity Views, shadcn/ui components
@rapoport/auth   → Auth logic, session, access control, middleware
@rapoport/ai     → Muse agent, prompts, mode switching, streaming
@rapoport/api    → OpenAPI spec, generated client, query hooks
@rapoport/i18n   → Translations, locale detection, RTL support
@rapoport/config → Shared configs (ESLint, TypeScript, Tailwind)
```

---

## Logging & Monitoring

```
Sentry:    → errors, exceptions, crashes
             Every 5xx → auto-reported
             Client errors → breadcrumbs + context
             Source maps uploaded on deploy

PostHog:   → product analytics, feature usage
             Page views, feature flags, user identification
             Custom events: project_created, spec_generated, etc.

Console:   → dev only, stripped in production
             No console.log in committed code
             Use structured logger in server code
```

---

## Code Review

### AI Development Orchestrator

Planning, code writing, and code review are handled by
a dedicated AI development tool — the orchestrator.

```
OpenSpec domains
  ↓
Orchestrator reads specs
  ↓
Plans implementation (Architect mode)
  ↓
Writes code (Builder mode)
  ↓
Reviews own output against specs + conventions
  ↓
Opens PR
  ↓
Pavel reviews: intent, brand, feel
```

Pavel does NOT review code line-by-line.
Pavel reviews **intent and result**:
- Does it match the spec?
- Does the entity look and feel right?
- Is the brand respected?
- Does the URL structure make sense?
- Does the screen work as expected?

The orchestrator reviews **everything else**:
- Type safety (no any, no casts)
- Convention compliance (this document)
- Test coverage
- Bundle size impact
- Security (no secrets in code, RLS policies)
- Adapter correctness
- URL state completeness

### Merge Blockers

```
PR cannot merge if:
  ✗ Types fail (pnpm check-types)
  ✗ Tests fail (pnpm test)
  ✗ Lint errors (pnpm lint)
  ✗ Build fails (pnpm build)
  ✗ OpenSpec validation fails (if specs changed)
  ✗ No description in PR
  ✗ any found in diff
```

---

## Infrastructure

### The Problem You Hit

All apps on Railway → all DNS on Railway → Cloudflare becomes
a passthrough → no edge caching, no CDN, no Cloudflare benefits.

**The fix: frontends on Cloudflare, APIs on Railway.**

### Architecture: Who Owns What

```
Cloudflare
  ├── DNS           → all domains and subdomains
  ├── CDN / Cache   → static assets, edge caching
  ├── Pages         → frontend apps (SSR + static)
  ├── SSL           → automatic certificates
  └── Security      → DDoS, WAF, rate limiting

Railway
  ├── API services  → NestJS backends
  ├── Workers       → background jobs, queues
  └── Cron          → scheduled tasks

Supabase
  ├── PostgreSQL    → primary database
  ├── Auth          → authentication
  ├── Realtime      → WebSocket subscriptions
  └── Storage       → file uploads
```

### App → Subdomain → Cloudflare Pages Project

Each app in the monorepo = separate Cloudflare Pages project
= separate subdomain = separate build = separate deploy.

```
Monorepo                    Cloudflare Pages Project    Domain
─────────────────────────────────────────────────────────────────
apps/web/                → rapoport-web               pavelrapoport.com
apps/studio/             → rapoport-studio            studio.pavelrapoport.com
apps/client-portal/      → rapoport-portal            portal.pavelrapoport.com (future)

services/api/            → Railway service             api.pavelrapoport.com
```

**Per-project Cloudflare Pages config:**

Each Pages project connects to the SAME git repo but with
different build settings:

```
Project: rapoport-web
  Root directory:        apps/web
  Build command:         cd ../.. && pnpm turbo build --filter=web
  Build output:          apps/web/.next
  Build watch paths:
    Include: apps/web/**, packages/**
    Exclude: apps/studio/**

Project: rapoport-studio
  Root directory:        apps/studio
  Build command:         cd ../.. && pnpm turbo build --filter=studio
  Build output:          apps/studio/.next
  Build watch paths:
    Include: apps/studio/**, packages/**
    Exclude: apps/web/**
```

Cloudflare allows up to 5 Pages projects per repository.
Turborepo ensures only changed apps rebuild.

### DNS Architecture

All DNS lives in Cloudflare. Railway API gets a CNAME.

```
pavelrapoport.com          → Cloudflare Pages (rapoport-web)
studio.pavelrapoport.com   → Cloudflare Pages (rapoport-studio)
api.pavelrapoport.com      → CNAME → Railway service (proxied through CF)

dentour.eu                  → Cloudflare Pages (dentour-web)
app.dentour.eu              → Cloudflare Pages (dentour-app)
api.dentour.eu              → CNAME → Railway service

vivod.app                   → Cloudflare Pages (vivod-web)
api.vivod.app               → CNAME → Railway service
```

**Cloudflare proxy (orange cloud) stays ON for all records.**
Even API traffic goes through Cloudflare → caching headers
on GET requests, DDoS protection, WAF rules.

### Caching Strategy

```
Cloudflare caches (edge):
  Static assets:    → Cache-Control: public, max-age=31536000, immutable
                      (CSS, JS, images, fonts — hashed filenames)
  HTML pages:       → Cache-Control: no-cache
                      (SSR pages revalidate every request)
  API GET:          → Cache-Control: public, max-age=60, s-maxage=300
                      (cacheable reads — projects list, specs)
  API mutation:     → no-store (POST, PATCH, DELETE)

TanStack Query caches (client):
  staleTime: 30s    → default for dynamic data
  staleTime: 5min   → static reference data (orgs, settings)
  gcTime: 10min     → garbage collect unused cache

Supabase Realtime invalidates TanStack Query cache
when server data changes → always fresh.
```

### Builds

```
Turborepo handles all builds:
  pnpm turbo build --filter=web       → builds web + dependencies
  pnpm turbo build --filter=studio    → builds studio + dependencies
  pnpm turbo build --filter=api       → builds API service

Build caching:
  Local:       .turbo/ directory (gitignored)
  CI:          Turborepo Remote Cache (free tier)
  Result:      unchanged packages skip build entirely

Incremental builds:
  Change @rapoport/ui → rebuilds web + studio (both depend on ui)
  Change apps/web     → rebuilds web only
  Change apps/studio  → rebuilds studio only
  Change services/api → rebuilds api only
```

### Deployment Flow

```
Push to dev branch:
  → GitHub Action runs turbo build for affected apps
  → Cloudflare Pages: preview deploy (unique URL per PR)
  → Railway: preview environment (if API changed)

Merge to staging:
  → Cloudflare Pages: staging deploy
  → Railway: staging deploy
  → Playwright E2E tests run against staging

Merge to main:
  → Cloudflare Pages: production deploy (instant)
  → Railway: production deploy
  → Rollback: one click in Cloudflare / Railway dashboard
```

### Monorepo Directory Structure

```
rapoport/
  ├── apps/
  │     ├── web/              → pavelrapoport.com (Next.js)
  │     └── studio/           → studio.pavelrapoport.com (Next.js)
  │
  ├── services/
  │     └── api/              → api.pavelrapoport.com (NestJS, Railway)
  │
  ├── packages/
  │     ├── ui/               → @rapoport/ui (design system)
  │     ├── db/               → @rapoport/db (Supabase client)
  │     ├── auth/             → @rapoport/auth (access control)
  │     ├── ai/               → @rapoport/ai (Muse agent)
  │     ├── api/              → @rapoport/api (OpenAPI client, generated)
  │     ├── i18n/             → @rapoport/i18n (translations)
  │     └── config/           → @rapoport/config (shared configs)
  │
  ├── openspec/               → specs, identity, seed, conventions
  ├── turbo.json
  ├── pnpm-workspace.yaml
  └── package.json
```

### Versioning

```
Apps:        follow semver loosely (0.x = building, 1.0 = launch)
             No npm publish — deployed directly.

Packages:    versioned independently via changesets
             @rapoport/ui@0.3.0 can depend on @rapoport/db@0.1.0
             pnpm changeset → bump → publish (internal only)

Lock:        pnpm-lock.yaml committed, always.
             pnpm install --frozen-lockfile in CI.

Node.js:     pinned in .nvmrc and package.json engines
             Currently: >= 20.19.0
```

### API as Separate Service

```
API is NEVER inside the Next.js app.
API is always a standalone NestJS service on Railway.

Why:
  1. Scale independently (add Railway replicas, not rebuild frontend)
  2. Deploy independently (API fix doesn't redeploy web)
  3. Different runtime (NestJS optimized for API, not SSR)
  4. Swagger/OpenAPI served from API, consumed by frontends
  5. Any frontend (web, mobile, CLI) uses same API
  6. Railway auto-scales, Cloudflare Pages doesn't need to

API domains:
  api.pavelrapoport.com   → platform API
  api.dentour.eu           → dentour API (future)
  api.vivod.app            → vivod API (future)

All proxied through Cloudflare (CNAME, orange cloud ON).
```

### Integration Connections

**Cloudflare → project:**

```
1. Add domain to Cloudflare (nameservers)
2. Create Pages project per app (connect git repo)
3. Set build watch paths (include/exclude)
4. Add custom domain to Pages project
5. SSL: automatic (Cloudflare Universal SSL)
6. Caching rules: page rules or Cache-Control headers
7. Environment variables: per Pages project, per environment
```

**Railway → project:**

```
1. Create Railway project per API service
2. Connect git repo, set root directory (services/api/)
3. Add custom domain (api.pavelrapoport.com)
4. CNAME in Cloudflare DNS → Railway provided domain
5. Environment variables: Railway dashboard
6. Auto-deploy on push to main
7. Health check: /api/health endpoint
```

**Linear → account strategy & project lifecycle:**

```
Account:     hello@pavelrapoport.com (professional identity)
             NOT gmail. This is the business account.
Plan:        Free (1 user) → Basic ($8/mo) when Misha joins
Workspace:   VIVOD (or rename to "Pavel Rapoport")
```

**Team-per-client model:**

```
Workspace: VIVOD
  ├── Team: Studio    → pavelrapoport.com issues (personal)
  ├── Team: VIVOD     → VIVOD Platform issues (partnership)
  ├── Team: Dentour   → Dentour issues (product)
  ├── Team: ClientA   → client project (temporary)
  └── Team: ClientB   → client project (temporary)

Max 5 teams on Basic plan ($8/user/mo).
Client teams are created and archived per engagement.
```

**Who pays for what:**

```
Phase 1 — Discovery + Shaping:
  Pavel's workspace. Pavel is the only user.
  Client does NOT have Linear access.
  Client interacts via Canvas / Portal.
  Cost: $0 (Free) or $8 (Basic).

Phase 2 — Build:
  Same workspace, same team.
  AI orchestrator works with issues.
  Client sees progress through Client Portal (future).
  Cost: Pavel pays.

Phase 3 — Handoff:
  Client creates their OWN Linear workspace.
  Pavel exports issues (CSV export or Linear API).
  Client imports into their workspace.
  Client pays for their own workspace.
  Pavel joins as guest/member if ongoing support needed.
```

**Why this works:**

```
- You never pay for client seats
- Client pays only when they own the project
- Clean separation: your process stays yours
- No client access to other projects (team isolation)
- Archive client team after handoff (keeps workspace clean)
```

**Integration setup:**

```
1. API key: stored in secrets-registry (hello@pavelrapoport.com)
2. Webhook: Linear → api.pavelrapoport.com/webhooks/linear
   → auto-creates changes in pipeline
3. MCP connection: Claude uses Linear tools directly
4. Bi-directional sync:
   Linear issue created → platform change created
   Platform change completed → Linear issue closed
5. Per-project: Linear team ID stored in project settings
```

### Multi-Project Setup (Uber Model)

Each user sees only their data. Each organization has
its own dashboard. The platform routes by org + role.

```
User logs in
  ↓
Org switcher (if member of multiple orgs)
  ↓
Dashboard scoped to org
  ↓
Projects scoped to org + user role
  ↓
Each project = separate data boundary (RLS enforced)

URL reflects scope:
  /studio                        → default org dashboard
  /studio?org=vivod              → VIVOD dashboard
  /studio?org=dentour            → Dentour dashboard
  /studio/projects/vivod-platform → project scoped view
```

All apps share packages but deploy independently.
All projects share Supabase but isolate via RLS.
All domains go through Cloudflare but route to different services.
