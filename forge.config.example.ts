/**
 * Пример forge.config.ts для корня монорепо pavelrapoport.com.
 * Положить в `<repo-root>/forge.config.ts`.
 *
 * Пакет @repo/forge находит этот файл автоматически,
 * поднимаясь от process.cwd() вверх по дереву.
 */

import type { ForgeConfig } from '@repo/forge';

const config: ForgeConfig = {
  /**
   * Markdown-файл с описанием монорепо. Уходит в каждый LLM-промпт.
   * Что положить туда:
   *   - структура apps/ и packages/
   *   - технологический стек (Next.js 15, React 19, Tailwind 4, CF Workers...)
   *   - конвенции именования (локали en|ru|ro, route groups, и т.д.)
   *   - важные архитектурные инварианты (Infisical, getCloudflareContext, ...)
   *
   * Аналог VIVOD'ского packages/forge-cli/src/core/project-context.ts,
   * только как редактируемый .md вместо строки в коде.
   */
  projectContextPath: './FORGE.md',

  /**
   * Префикс Linear-issue. Берётся из Linear team identifier.
   * Для команды AI-Development-Studio → "AI".
   * Regex для парсинга строится как /\bAI-\d+\b/i.
   */
  issuePrefix: 'AI',
};

export default config;
