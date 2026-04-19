import type { ModuleConfig } from './types.js';

// ─── Worker Module ──────────────────────────────────────────

const worker: ModuleConfig = {
  name: 'worker',
  description: 'Worker mobile app — facade assignments, tasks, reports, earnings',
  agents: {
    pm: {
      globs: [
        'apps/web/src/app/[locale]/(worker)/**/*.{ts,tsx}',
        'apps/web/src/actions/assignments.ts',
        'apps/web/src/actions/blocks.ts',
        'apps/web/src/actions/facades.ts',
        'apps/web/src/actions/task-submissions.ts',
        'apps/web/src/actions/work-reports.ts',
        'apps/web/src/actions/materials.ts',
      ],
      specs: [
        'openspec/specs/worker-app/index.md',
        'openspec/specs/worker-app/spec.md',
        'openspec/specs/facade/spec.md',
      ],
      model: 'sonnet',
    },
    architect: {
      globs: [
        'apps/web/src/app/[locale]/(worker)/**/*.{ts,tsx}',
        'apps/web/src/actions/assignments.ts',
        'apps/web/src/actions/blocks.ts',
        'apps/web/src/actions/facades.ts',
        'apps/web/src/actions/task-submissions.ts',
        'apps/web/src/actions/work-reports.ts',
        'apps/web/src/actions/materials.ts',
        'packages/db/src/queries/assignments.ts',
        'packages/db/src/queries/blocks.ts',
        'packages/db/src/queries/facades.ts',
        'packages/db/src/queries/submissions.ts',
        'packages/db/src/queries/tasks.ts',
        'packages/db/src/queries/work-reports.ts',
        'packages/db/src/queries/work-report-items.ts',
        'packages/db/src/queries/materials.ts',
        'packages/domain/src/entities.ts',
        'packages/domain/src/enums.ts',
        'packages/domain/src/ids.ts',
        'packages/domain/src/task.ts',
        'packages/domain/src/facade.ts',
      ],
      specs: [
        'openspec/specs/worker-app/index.md',
        'openspec/specs/worker-app/spec.md',
        'openspec/specs/facade/spec.md',
      ],
      model: 'opus',
    },
    'tech-lead': {
      globs: [
        'apps/web/src/app/[locale]/(worker)/**/*.{ts,tsx}',
        'apps/web/src/actions/assignments.ts',
        'apps/web/src/actions/blocks.ts',
        'apps/web/src/actions/facades.ts',
        'apps/web/src/actions/task-submissions.ts',
        'apps/web/src/actions/work-reports.ts',
        'apps/web/src/actions/materials.ts',
        'packages/db/src/queries/assignments.ts',
        'packages/db/src/queries/blocks.ts',
        'packages/db/src/queries/facades.ts',
        'packages/db/src/queries/submissions.ts',
        'packages/db/src/queries/tasks.ts',
        'packages/db/src/queries/work-reports.ts',
        'packages/db/src/queries/materials.ts',
      ],
      specs: ['openspec/specs/worker-app/index.md', 'openspec/specs/worker-app/spec.md'],
      model: 'sonnet',
    },
    'ui-designer': {
      globs: [
        'apps/web/src/app/[locale]/(worker)/**/*.{ts,tsx}',
        'packages/ui/src/composed/assignment-*.tsx',
        'packages/ui/src/composed/block-*.tsx',
        'packages/ui/src/composed/facade/*.tsx',
      ],
      specs: [
        'openspec/specs/worker-app/index.md',
        'openspec/specs/worker-app/spec.md',
        'openspec/specs/design/index.md',
      ],
      model: 'sonnet',
    },
    security: {
      globs: [
        'apps/web/src/actions/_helpers.ts',
        'apps/web/src/actions/assignments.ts',
        'apps/web/src/actions/blocks.ts',
        'apps/web/src/actions/facades.ts',
        'apps/web/src/actions/task-submissions.ts',
        'apps/web/src/actions/work-reports.ts',
        'apps/web/src/actions/materials.ts',
        'packages/db/src/queries/assignments.ts',
        'packages/db/src/queries/blocks.ts',
        'packages/db/src/queries/facades.ts',
        'packages/db/src/queries/submissions.ts',
        'packages/db/src/queries/tasks.ts',
        'packages/auth/src/**/*.ts',
        'supabase/migrations/*.sql',
      ],
      specs: [
        'openspec/specs/auth/index.md',
        'openspec/specs/worker-app/index.md',
        'openspec/specs/worker-app/spec.md',
      ],
      model: 'opus',
    },
    qa: {
      globs: [
        'apps/web/src/app/[locale]/(worker)/**/*.{ts,tsx}',
        'apps/web/src/actions/assignments.ts',
        'apps/web/src/actions/blocks.ts',
        'apps/web/src/actions/facades.ts',
        'apps/web/src/actions/task-submissions.ts',
        'apps/web/src/actions/work-reports.ts',
        'packages/domain/src/__tests__/*.test.ts',
        'apps/e2e/e2e/*.spec.ts',
      ],
      specs: ['openspec/specs/worker-app/index.md', 'openspec/specs/worker-app/spec.md'],
      model: 'sonnet',
    },
    a11y: {
      globs: [
        'apps/web/src/app/[locale]/(worker)/**/*.{ts,tsx}',
        'packages/ui/src/composed/assignment-*.tsx',
        'packages/ui/src/composed/block-*.tsx',
        'packages/ui/src/composed/facade/*.tsx',
      ],
      specs: [
        'openspec/specs/worker-app/index.md',
        'openspec/specs/worker-app/spec.md',
        'openspec/specs/design/index.md',
      ],
      model: 'sonnet',
    },
    performance: {
      globs: [
        'apps/web/src/app/[locale]/(worker)/**/*.{ts,tsx}',
        'apps/web/src/actions/assignments.ts',
        'apps/web/src/actions/blocks.ts',
        'apps/web/src/actions/facades.ts',
        'apps/web/src/actions/task-submissions.ts',
        'apps/web/src/actions/work-reports.ts',
        'apps/web/src/actions/materials.ts',
        'packages/db/src/queries/assignments.ts',
        'packages/db/src/queries/blocks.ts',
        'packages/db/src/queries/facades.ts',
        'packages/db/src/queries/submissions.ts',
        'packages/db/src/queries/tasks.ts',
        'packages/db/src/queries/work-reports.ts',
        'packages/db/src/queries/materials.ts',
      ],
      specs: [],
      model: 'sonnet',
    },
    risk: {
      globs: [
        'apps/web/src/actions/_helpers.ts',
        'apps/web/src/actions/assignments.ts',
        'apps/web/src/actions/blocks.ts',
        'apps/web/src/actions/facades.ts',
        'apps/web/src/actions/task-submissions.ts',
        'apps/web/src/actions/work-reports.ts',
        'apps/web/src/actions/materials.ts',
        'packages/db/src/queries/assignments.ts',
        'packages/db/src/queries/blocks.ts',
        'packages/db/src/queries/facades.ts',
        'packages/db/src/queries/submissions.ts',
        'packages/db/src/queries/tasks.ts',
        'packages/db/src/queries/work-reports.ts',
        'packages/db/src/queries/work-report-items.ts',
        'packages/db/src/queries/materials.ts',
        'packages/auth/src/**/*.ts',
        'supabase/migrations/*.sql',
      ],
      specs: [
        'openspec/specs/worker-app/index.md',
        'openspec/specs/worker-app/spec.md',
        'openspec/specs/facade/spec.md',
      ],
      model: 'opus',
    },
  },
};

// ─── Platform Module ────────────────────────────────────────

const platform: ModuleConfig = {
  name: 'platform',
  description: 'Manager platform — projects, contracts, clients, workers, dashboard',
  agents: {
    pm: {
      globs: [
        'apps/web/src/app/[locale]/(platform)/**/*.{ts,tsx}',
        'apps/web/src/actions/projects.ts',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/contract-module.ts',
        'apps/web/src/actions/clients.ts',
        'apps/web/src/actions/workers.ts',
        'apps/web/src/actions/payments.ts',
        'apps/web/src/actions/leads.ts',
        'apps/web/src/actions/buildings.ts',
        'apps/web/src/actions/participants.ts',
        'apps/web/src/actions/monthly-counts.ts',
      ],
      specs: ['openspec/specs/platform/index.md', 'openspec/specs/contracts/index.md'],
      model: 'sonnet',
    },
    architect: {
      globs: [
        'apps/web/src/app/[locale]/(platform)/**/*.{ts,tsx}',
        'apps/web/src/actions/projects.ts',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/contract-module.ts',
        'apps/web/src/actions/clients.ts',
        'apps/web/src/actions/workers.ts',
        'apps/web/src/actions/payments.ts',
        'packages/db/src/queries/projects.ts',
        'packages/db/src/queries/contracts.ts',
        'packages/db/src/queries/clients.ts',
        'packages/db/src/queries/workers.ts',
        'packages/db/src/queries/payments.ts',
        'packages/db/src/queries/dashboard.ts',
        'packages/domain/src/entities.ts',
        'packages/domain/src/enums.ts',
        'packages/domain/src/ids.ts',
        'packages/domain/src/contract.ts',
      ],
      specs: ['openspec/specs/platform/index.md', 'openspec/specs/contracts/index.md'],
      model: 'opus',
    },
    'tech-lead': {
      globs: [
        'apps/web/src/app/[locale]/(platform)/**/*.{ts,tsx}',
        'apps/web/src/actions/projects.ts',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/contract-module.ts',
        'apps/web/src/actions/clients.ts',
        'apps/web/src/actions/workers.ts',
        'apps/web/src/actions/payments.ts',
        'packages/db/src/queries/projects.ts',
        'packages/db/src/queries/contracts.ts',
        'packages/db/src/queries/clients.ts',
        'packages/db/src/queries/workers.ts',
        'packages/db/src/queries/payments.ts',
      ],
      specs: ['openspec/specs/platform/index.md'],
      model: 'sonnet',
    },
    'ui-designer': {
      globs: [
        'apps/web/src/app/[locale]/(platform)/**/*.{ts,tsx}',
        'packages/ui/src/composed/project-*.tsx',
        'packages/ui/src/composed/contract-*.tsx',
        'packages/ui/src/composed/contract/**/*.tsx',
        'packages/ui/src/composed/worker-*.tsx',
        'packages/ui/src/composed/client-*.tsx',
        'packages/ui/src/composed/collection/**/*.tsx',
      ],
      specs: ['openspec/specs/platform/index.md', 'openspec/specs/design/index.md'],
      model: 'sonnet',
    },
    security: {
      globs: [
        'apps/web/src/actions/_helpers.ts',
        'apps/web/src/actions/projects.ts',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/contract-module.ts',
        'apps/web/src/actions/contract-pdf.ts',
        'apps/web/src/actions/clients.ts',
        'apps/web/src/actions/workers.ts',
        'apps/web/src/actions/payments.ts',
        'apps/web/src/actions/leads.ts',
        'packages/db/src/queries/projects.ts',
        'packages/db/src/queries/contracts.ts',
        'packages/db/src/queries/clients.ts',
        'packages/db/src/queries/workers.ts',
        'packages/db/src/queries/payments.ts',
        'packages/auth/src/**/*.ts',
        'supabase/migrations/*.sql',
      ],
      specs: ['openspec/specs/auth/index.md', 'openspec/specs/contracts/index.md'],
      model: 'opus',
    },
    qa: {
      globs: [
        'apps/web/src/app/[locale]/(platform)/**/*.{ts,tsx}',
        'apps/web/src/actions/projects.ts',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/clients.ts',
        'apps/web/src/actions/workers.ts',
        'packages/domain/src/__tests__/*.test.ts',
        'packages/ui/src/composed/collection/__tests__/*.test.tsx',
        'packages/ui/src/composed/contract/template/__tests__/*.test.tsx',
        'apps/e2e/e2e/*.spec.ts',
      ],
      specs: ['openspec/specs/platform/index.md'],
      model: 'sonnet',
    },
    a11y: {
      globs: [
        'apps/web/src/app/[locale]/(platform)/**/*.{ts,tsx}',
        'packages/ui/src/composed/project-*.tsx',
        'packages/ui/src/composed/contract-*.tsx',
        'packages/ui/src/composed/contract/**/*.tsx',
        'packages/ui/src/composed/worker-*.tsx',
        'packages/ui/src/composed/client-*.tsx',
        'packages/ui/src/composed/collection/**/*.tsx',
      ],
      specs: ['openspec/specs/platform/index.md', 'openspec/specs/design/index.md'],
      model: 'sonnet',
    },
    performance: {
      globs: [
        'apps/web/src/app/[locale]/(platform)/**/*.{ts,tsx}',
        'apps/web/src/actions/projects.ts',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/contract-module.ts',
        'apps/web/src/actions/clients.ts',
        'apps/web/src/actions/workers.ts',
        'apps/web/src/actions/payments.ts',
        'packages/db/src/queries/projects.ts',
        'packages/db/src/queries/contracts.ts',
        'packages/db/src/queries/clients.ts',
        'packages/db/src/queries/workers.ts',
        'packages/db/src/queries/payments.ts',
      ],
      specs: [],
      model: 'sonnet',
    },
    risk: {
      globs: [
        'apps/web/src/actions/_helpers.ts',
        'apps/web/src/actions/projects.ts',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/contract-module.ts',
        'apps/web/src/actions/contract-pdf.ts',
        'apps/web/src/actions/clients.ts',
        'apps/web/src/actions/workers.ts',
        'apps/web/src/actions/payments.ts',
        'apps/web/src/actions/leads.ts',
        'packages/db/src/queries/projects.ts',
        'packages/db/src/queries/contracts.ts',
        'packages/db/src/queries/clients.ts',
        'packages/db/src/queries/workers.ts',
        'packages/db/src/queries/payments.ts',
        'packages/auth/src/**/*.ts',
        'supabase/migrations/*.sql',
      ],
      specs: ['openspec/specs/platform/index.md', 'openspec/specs/contracts/index.md'],
      model: 'opus',
    },
  },
};

// ─── Admin Module ───────────────────────────────────────────

const admin: ModuleConfig = {
  name: 'admin',
  description: 'Admin console — user management, org settings, FORGE controls, system health',
  agents: {
    pm: {
      globs: [
        'apps/web/src/app/[locale]/(admin)/**/*.{ts,tsx}',
        'apps/web/src/actions/forge.ts',
        'apps/web/src/actions/forge-plans.ts',
        'apps/web/src/actions/forge-metrics.ts',
        'apps/web/src/actions/forge-github.ts',
        'apps/web/src/actions/system-health.ts',
      ],
      specs: ['openspec/specs/infra/index.md', 'openspec/specs/agents/index.md'],
      model: 'sonnet',
    },
    architect: {
      globs: [
        'apps/web/src/app/[locale]/(admin)/**/*.{ts,tsx}',
        'apps/web/src/actions/forge.ts',
        'apps/web/src/actions/forge-plans.ts',
        'apps/web/src/actions/forge-plan-direct.ts',
        'apps/web/src/actions/forge-metrics.ts',
        'apps/web/src/actions/system-health.ts',
        'apps/workers/forge/src/**/*.ts',
      ],
      specs: ['openspec/specs/infra/index.md', 'openspec/specs/agents/index.md'],
      model: 'opus',
    },
    'tech-lead': {
      globs: [
        'apps/web/src/app/[locale]/(admin)/**/*.{ts,tsx}',
        'apps/web/src/actions/forge.ts',
        'apps/web/src/actions/forge-plans.ts',
        'apps/web/src/actions/forge-plan-direct.ts',
        'apps/web/src/actions/forge-metrics.ts',
        'apps/web/src/actions/system-health.ts',
        'apps/workers/forge/src/**/*.ts',
      ],
      specs: ['openspec/specs/infra/index.md'],
      model: 'sonnet',
    },
    'ui-designer': {
      globs: ['apps/web/src/app/[locale]/(admin)/**/*.{ts,tsx}'],
      specs: ['openspec/specs/design/index.md'],
      model: 'sonnet',
    },
    security: {
      globs: [
        'apps/web/src/actions/_helpers.ts',
        'apps/web/src/actions/forge.ts',
        'apps/web/src/actions/forge-plans.ts',
        'apps/web/src/actions/forge-plan-direct.ts',
        'apps/web/src/actions/system-health.ts',
        'apps/workers/forge/src/**/*.ts',
        'packages/auth/src/**/*.ts',
        'supabase/migrations/*.sql',
      ],
      specs: ['openspec/specs/auth/index.md', 'openspec/specs/infra/index.md'],
      model: 'opus',
    },
    qa: {
      globs: [
        'apps/web/src/app/[locale]/(admin)/**/*.{ts,tsx}',
        'apps/web/src/actions/forge.ts',
        'apps/web/src/actions/forge-plans.ts',
        'apps/web/src/actions/system-health.ts',
        'apps/e2e/e2e/*.spec.ts',
      ],
      specs: ['openspec/specs/infra/index.md'],
      model: 'sonnet',
    },
    a11y: {
      globs: ['apps/web/src/app/[locale]/(admin)/**/*.{ts,tsx}'],
      specs: ['openspec/specs/design/index.md'],
      model: 'sonnet',
    },
    performance: {
      globs: [
        'apps/web/src/app/[locale]/(admin)/**/*.{ts,tsx}',
        'apps/web/src/actions/forge.ts',
        'apps/web/src/actions/forge-plans.ts',
        'apps/web/src/actions/forge-plan-direct.ts',
        'apps/web/src/actions/forge-metrics.ts',
        'apps/web/src/actions/system-health.ts',
        'apps/workers/forge/src/**/*.ts',
      ],
      specs: [],
      model: 'sonnet',
    },
    risk: {
      globs: [
        'apps/web/src/actions/_helpers.ts',
        'apps/web/src/actions/forge.ts',
        'apps/web/src/actions/forge-plans.ts',
        'apps/web/src/actions/forge-plan-direct.ts',
        'apps/web/src/actions/forge-metrics.ts',
        'apps/web/src/actions/system-health.ts',
        'apps/workers/forge/src/**/*.ts',
        'packages/auth/src/**/*.ts',
        'supabase/migrations/*.sql',
      ],
      specs: ['openspec/specs/infra/index.md', 'openspec/specs/agents/index.md'],
      model: 'opus',
    },
  },
};

// ─── Marketing Module ──────────────────────────────────────

const marketing: ModuleConfig = {
  name: 'marketing',
  description: 'Landing & marketing pages — SEO, conversion, performance',
  agents: {
    seo: {
      globs: [
        'apps/web/src/app/[locale]/(landing)/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/layout.tsx',
        'apps/web/src/app/sitemap.ts',
        'apps/web/src/app/robots.ts',
        'apps/web/next.config.ts',
      ],
      specs: [],
      model: 'sonnet',
    },
    growth: {
      globs: [
        'apps/web/src/app/[locale]/(landing)/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/**/*.{ts,tsx}',
      ],
      specs: [],
      model: 'sonnet',
    },
    performance: {
      globs: [
        'apps/web/src/app/[locale]/(landing)/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/**/*.{ts,tsx}',
        'apps/web/next.config.ts',
      ],
      specs: [],
      model: 'sonnet',
    },
    'ui-designer': {
      globs: [
        'apps/web/src/app/[locale]/(landing)/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/**/*.{ts,tsx}',
      ],
      specs: [],
      model: 'sonnet',
    },
    security: {
      globs: [
        'apps/web/src/app/[locale]/(marketing)/auth/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/sign-in/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/invite/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/admin-mfa/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/onboarding/**/*.{ts,tsx}',
        'packages/auth/src/**/*.ts',
      ],
      specs: [],
      model: 'opus',
    },
    a11y: {
      globs: [
        'apps/web/src/app/[locale]/(landing)/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/**/*.{ts,tsx}',
      ],
      specs: [],
      model: 'sonnet',
    },
  },
};

// ─── UI Library Module ─────────────────────────────────────

const uiLibrary: ModuleConfig = {
  name: 'UI Library (@vivod/ui)',
  description: 'UI component library — component API, exports, design tokens, bundle impact',
  agents: {
    'component-api': {
      globs: ['packages/ui/src/**/*.{ts,tsx}'],
      specs: ['openspec/specs/design/index.md'],
      model: 'sonnet',
    },
    architect: {
      globs: ['packages/ui/src/**/*.{ts,tsx}', 'packages/ui/package.json'],
      specs: ['openspec/specs/design/index.md'],
      model: 'sonnet',
    },
    'tech-lead': {
      globs: ['packages/ui/src/**/*.{ts,tsx}'],
      specs: [],
      model: 'sonnet',
    },
    'ui-designer': {
      globs: ['packages/ui/src/**/*.{ts,tsx}'],
      specs: ['openspec/specs/design/index.md'],
      model: 'sonnet',
    },
    qa: {
      globs: [
        'packages/ui/src/**/*.{ts,tsx}',
        'packages/ui/**/*.stories.tsx',
        'packages/ui/**/*.test.{ts,tsx}',
      ],
      specs: [],
      model: 'sonnet',
    },
    performance: {
      globs: ['packages/ui/src/**/*.{ts,tsx}', 'packages/ui/package.json'],
      specs: [],
      model: 'sonnet',
    },
    a11y: {
      globs: ['packages/ui/src/**/*.{ts,tsx}'],
      specs: ['openspec/specs/design/index.md'],
      model: 'sonnet',
    },
  },
};

// ─── Domain: Auth ──────────────────────────────────────────

const domainAuth: ModuleConfig = {
  name: 'auth',
  description: 'Auth, permissions, session management',
  agents: {
    architect: {
      globs: [
        'packages/auth/src/**/*.ts',
        'apps/web/src/middleware.ts',
        'apps/web/src/actions/_helpers.ts',
        'apps/web/src/app/[locale]/(marketing)/auth/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/sign-in/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/admin-mfa/**/*.{ts,tsx}',
      ],
      specs: ['openspec/specs/auth/index.md'],
      model: 'opus',
    },
    pm: {
      globs: [
        'packages/auth/src/**/*.ts',
        'apps/web/src/middleware.ts',
        'apps/web/src/actions/_helpers.ts',
      ],
      specs: ['openspec/specs/auth/index.md'],
      model: 'sonnet',
    },
    security: {
      globs: [
        'packages/auth/src/**/*.ts',
        'apps/web/src/middleware.ts',
        'apps/web/src/actions/_helpers.ts',
        'apps/web/src/app/[locale]/(marketing)/auth/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/sign-in/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(marketing)/admin-mfa/**/*.{ts,tsx}',
        'supabase/migrations/*.sql',
      ],
      specs: ['openspec/specs/auth/index.md'],
      model: 'opus',
    },
  },
};

// ─── Domain: API ───────────────────────────────────────────

const domainApi: ModuleConfig = {
  name: 'api',
  description: 'API gateway, server actions, error contracts',
  agents: {
    architect: {
      globs: ['apps/workers/api-gateway/src/**/*.ts', 'apps/web/src/actions/**/*.ts'],
      specs: ['openspec/specs/api/index.md'],
      model: 'opus',
    },
    pm: {
      globs: ['apps/workers/api-gateway/src/**/*.ts', 'apps/web/src/actions/**/*.ts'],
      specs: ['openspec/specs/api/index.md'],
      model: 'sonnet',
    },
    security: {
      globs: ['apps/workers/api-gateway/src/**/*.ts', 'apps/web/src/actions/**/*.ts'],
      specs: ['openspec/specs/api/index.md'],
      model: 'opus',
    },
  },
};

// ─── Domain: Contracts ─────────────────────────────────────

const domainContracts: ModuleConfig = {
  name: 'contracts',
  description: 'Contracts, payments, insurance, change orders',
  agents: {
    architect: {
      globs: [
        'packages/db/src/queries/contracts.ts',
        'packages/db/src/queries/payments.ts',
        'apps/web/src/app/[locale]/(platform)/contracts/**/*.{ts,tsx}',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/contract-module.ts',
        'apps/web/src/actions/contract-pdf.ts',
        'apps/web/src/actions/payments.ts',
        'packages/domain/src/contract.ts',
      ],
      specs: ['openspec/specs/contracts/index.md', 'openspec/specs/contracts/spec.md'],
      model: 'opus',
    },
    pm: {
      globs: [
        'apps/web/src/app/[locale]/(platform)/contracts/**/*.{ts,tsx}',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/contract-module.ts',
        'apps/web/src/actions/payments.ts',
      ],
      specs: ['openspec/specs/contracts/index.md', 'openspec/specs/contracts/spec.md'],
      model: 'sonnet',
    },
    security: {
      globs: [
        'packages/db/src/queries/contracts.ts',
        'packages/db/src/queries/payments.ts',
        'apps/web/src/actions/contracts.ts',
        'apps/web/src/actions/contract-module.ts',
        'apps/web/src/actions/contract-pdf.ts',
        'apps/web/src/actions/payments.ts',
      ],
      specs: ['openspec/specs/contracts/index.md'],
      model: 'opus',
    },
  },
};

// ─── Domain: Worker App ────────────────────────────────────

const domainWorkerApp: ModuleConfig = {
  name: 'worker-app',
  description: 'Worker mobile app — reports, today view, facade assignments',
  agents: {
    architect: {
      globs: [
        'apps/web/src/app/[locale]/(worker)/**/*.{ts,tsx}',
        'apps/web/src/actions/assignments.ts',
        'apps/web/src/actions/blocks.ts',
        'apps/web/src/actions/facades.ts',
        'apps/web/src/actions/task-submissions.ts',
        'apps/web/src/actions/work-reports.ts',
        'apps/web/src/actions/materials.ts',
      ],
      specs: ['openspec/specs/worker-app/index.md', 'openspec/specs/worker-app/spec.md'],
      model: 'opus',
    },
    pm: {
      globs: [
        'apps/web/src/app/[locale]/(worker)/**/*.{ts,tsx}',
        'apps/web/src/actions/assignments.ts',
        'apps/web/src/actions/blocks.ts',
        'apps/web/src/actions/facades.ts',
        'apps/web/src/actions/task-submissions.ts',
        'apps/web/src/actions/work-reports.ts',
        'apps/web/src/actions/materials.ts',
      ],
      specs: ['openspec/specs/worker-app/index.md', 'openspec/specs/worker-app/spec.md'],
      model: 'sonnet',
    },
  },
};

// ─── Domain: Agents ────────────────────────────────────────

const domainAgents: ModuleConfig = {
  name: 'agents',
  description: 'SCOPE, LEDGER, CLERK — orchestration, I/O schemas',
  agents: {
    architect: {
      globs: [
        'packages/agents/src/**/*.ts',
        'apps/workers/scope/src/**/*.ts',
        'apps/workers/ledger/src/**/*.ts',
        'apps/workers/clerk/src/**/*.ts',
      ],
      specs: ['openspec/specs/agents/index.md', 'openspec/specs/agents/spec.md'],
      model: 'opus',
    },
    pm: {
      globs: [
        'packages/agents/src/**/*.ts',
        'apps/workers/scope/src/**/*.ts',
        'apps/workers/ledger/src/**/*.ts',
        'apps/workers/clerk/src/**/*.ts',
      ],
      specs: ['openspec/specs/agents/index.md', 'openspec/specs/agents/spec.md'],
      model: 'sonnet',
    },
  },
};

// ─── Domain: Entities ──────────────────────────────────────

const domainEntities: ModuleConfig = {
  name: 'entities',
  description: '13 entity views, collection engine, navigation',
  agents: {
    architect: {
      globs: [
        'packages/domain/src/entities.ts',
        'packages/domain/src/ids.ts',
        'packages/domain/src/enums.ts',
        'packages/ui/src/composed/collection/**/*.{ts,tsx}',
        'apps/web/src/app/[locale]/(platform)/**/page.tsx',
      ],
      specs: ['openspec/specs/entities/spec.md'],
      model: 'opus',
    },
    pm: {
      globs: [
        'packages/domain/src/entities.ts',
        'packages/domain/src/ids.ts',
        'packages/ui/src/composed/collection/**/*.{ts,tsx}',
      ],
      specs: ['openspec/specs/entities/spec.md'],
      model: 'sonnet',
    },
  },
};

// ─── Domain: Facade ────────────────────────────────────────

const domainFacade: ModuleConfig = {
  name: 'facade',
  description: 'FacadeTrack grid, blocks, SVG engine',
  agents: {
    architect: {
      globs: [
        'packages/facade-engine/src/**/*.ts',
        'packages/ui/src/composed/facade-*.tsx',
        'packages/ui/src/composed/facade/**/*.{ts,tsx}',
        'apps/web/src/app/api/facades/**/*.ts',
        'apps/web/src/actions/facades.ts',
      ],
      specs: ['openspec/specs/facade/spec.md'],
      model: 'opus',
    },
    pm: {
      globs: [
        'packages/facade-engine/src/**/*.ts',
        'packages/ui/src/composed/facade-*.tsx',
        'packages/ui/src/composed/facade/**/*.{ts,tsx}',
        'apps/web/src/actions/facades.ts',
      ],
      specs: ['openspec/specs/facade/spec.md'],
      model: 'sonnet',
    },
  },
};

// ─── Domain: Design ────────────────────────────────────────

const domainDesign: ModuleConfig = {
  name: 'design',
  description: 'Design system, motion, patterns, AI UI',
  agents: {
    architect: {
      globs: [
        'packages/ui/src/**/*.{ts,tsx}',
        'packages/config/src/**/*.ts',
        'packages/ui/src/globals.css',
      ],
      specs: ['openspec/specs/design/index.md'],
      model: 'opus',
    },
    pm: {
      globs: ['packages/ui/src/**/*.{ts,tsx}', 'packages/config/src/**/*.ts'],
      specs: ['openspec/specs/design/index.md'],
      model: 'sonnet',
    },
  },
};

// ─── Domain: Infra ─────────────────────────────────────────

const domainInfra: ModuleConfig = {
  name: 'infra',
  description: 'Deployment, CI/CD, secrets, monitoring',
  agents: {
    architect: {
      globs: [
        '.github/workflows/**/*.{yml,yaml}',
        'apps/workers/*/wrangler.toml',
        'scripts/**/*.{ts,sh}',
        'supabase/migrations/*.sql',
      ],
      specs: [
        'openspec/specs/infra/index.md',
        'openspec/specs/infra/deployment/index.md',
        'openspec/specs/infra/secrets/index.md',
        'openspec/specs/infra/monitoring/index.md',
        'openspec/specs/infra/domains/index.md',
        'openspec/specs/infra/agents-infra/index.md',
      ],
      model: 'opus',
    },
    pm: {
      globs: [
        '.github/workflows/**/*.{yml,yaml}',
        'apps/workers/*/wrangler.toml',
        'scripts/**/*.{ts,sh}',
        'supabase/migrations/*.sql',
      ],
      specs: ['openspec/specs/infra/index.md'],
      model: 'sonnet',
    },
  },
};

// ─── Registry ───────────────────────────────────────────────

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  // App modules (full multi-agent audit)
  worker,
  platform,
  admin,
  marketing,
  'ui-library': uiLibrary,
  // Domain modules (spec validation)
  auth: domainAuth,
  api: domainApi,
  contracts: domainContracts,
  'worker-app': domainWorkerApp,
  agents: domainAgents,
  entities: domainEntities,
  facade: domainFacade,
  design: domainDesign,
  infra: domainInfra,
};

export function getModule(name: string): ModuleConfig | undefined {
  return MODULE_REGISTRY[name];
}

export function listModules(): string[] {
  return Object.keys(MODULE_REGISTRY);
}
