import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/config",
  "packages/db",
  "packages/auth",
  "packages/i18n",
  "apps/web",
]);
