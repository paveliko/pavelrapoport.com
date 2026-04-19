# @repo/forge

Autonomous pipeline engine — project-agnostic core.

## Status

**Scaffold.** Ожидает порт кода из `packages/forge-cli` в VIVOD после закрытия end-to-end FORGE там.

## Scope

В пакет приезжает **только** содержимое VIVOD'ского `packages/forge-cli/src/` (ядро + CLI + worker-prompts).

**Не приезжает** (это VIVOD's instance of FORGE, не сам FORGE):

- `apps/workers/forge/` — Cloudflare Worker (каждый проект поднимает свой)
- `apps/web/src/actions/forge*.ts` + UI — каждый потребитель пишет свой слой
- `packages/db/src/queries/forge-*.ts` — DB queries под свою схему
- `supabase/migrations/2026040*_forge_*.sql` — миграции
- `.github/workflows/forge-*.yml` — CI pipelines
- `.forge/audits/` — persisted artifacts

**Парасайтная модель:** ядро общее, интеграция — на стороне потребителя.

## Параметризация (что было de-hardcoded)

| Было в VIVOD                              | Теперь в Forge                          |
| ----------------------------------------- | --------------------------------------- |
| `core/project-context.ts` — inline string | `config.projectContextPath` → Markdown-файл |
| `core/linear-client.ts` — literal `"VVD-"` | `config.issuePrefix` → string           |

Всё остальное из `forge-cli/src/` копируется verbatim.

## Config resolution

Precedence (выше → перебивает):

1. Explicit: `initForge({ projectContextPath, issuePrefix })`
2. File: `forge.config.{ts,mjs,js,json}` — ближайший вверх по дереву от `cwd`
3. Env: `FORGE_PROJECT_CONTEXT_PATH`, `FORGE_ISSUE_PREFIX`

Если нет — `ForgeConfigError`.

## Использование

**1. Создать `forge.config.ts` в корне монорепо:**

```ts
// forge.config.ts
import type { ForgeConfig } from '@repo/forge';

const config: ForgeConfig = {
  projectContextPath: './FORGE.md',
  issuePrefix: 'AI',
};

export default config;
```

**2. Создать `FORGE.md`** — Markdown-описание монорепо (пакеты, конвенции, стек, naming, route-groups, branded ID prefixes). Этот файл уходит в промпты.

**3. Инициализация:**

```ts
import { initForge } from '@repo/forge';

const forge = await initForge();
// forge.projectContext — строка из FORGE.md
// forge.issuePrefix   — "AI"
// forge.config        — resolved ForgeConfig
```

## Port checklist

Исполняется после того как VIVOD end-to-end FORGE закрыт.

- [ ] `cp -r <vivod>/packages/forge-cli/src/* packages/forge/src/` (перезаписывает стабы)
- [ ] В каждом файле, где был `import { PROJECT_CONTEXT }` или хардкод-строка, → `getProjectContext()` из `../core/project-context.js`
- [ ] Глобальная замена `"VVD-"` / `VVD-` → `${config.issuePrefix}-` (или через `linear.formatIssueKey(n)`)
- [ ] Перенести все `@vivod/forge-cli/*` re-exports в `src/core/index.ts` и `src/index.ts`
- [ ] Обновить импорты в `worker-prompts.ts` на новые пути
- [ ] `pnpm typecheck` в пакете — зачистить оставшиеся ссылки
- [ ] Тесты:
  - [ ] `loadConfig` precedence (explicit > file > env > throw)
  - [ ] `LinearClient.parseIssueKey` с разными префиксами ("AI", "VVD", "MOD")
  - [ ] `initProjectContext` + `getProjectContext` (throw до init)

## Отдельно от этого порта (не блокирует MVP, но решить до второго consumer'а)

- **`persist.ts`** в VIVOD пишет в конкретные таблицы (`forge_audits`, `forge_specs`, `forge_estimates`, `forge_events`) и в `.forge/audits/`. Либо параметризуем названия таблиц через config, либо выносим persist полностью наружу (engine возвращает structured result, consumer сохраняет как хочет). **Рекомендация:** второе — чище для парасайтной модели.
- **Supabase client creation** сейчас в `persist.ts`. Вынести в DI (передавать клиент снаружи) когда будем резать persist.
