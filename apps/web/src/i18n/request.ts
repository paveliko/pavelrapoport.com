import { getRequestConfig } from "next-intl/server";
import { routing } from "@repo/i18n/routing";

const messageImports = {
  en: () =>
    Promise.all([
      import("@repo/i18n/messages/en/common.json"),
      import("@repo/i18n/messages/en/web.json"),
    ]),
  ru: () =>
    Promise.all([
      import("@repo/i18n/messages/ru/common.json"),
      import("@repo/i18n/messages/ru/web.json"),
    ]),
  he: () =>
    Promise.all([
      import("@repo/i18n/messages/he/common.json"),
      import("@repo/i18n/messages/he/web.json"),
    ]),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested as (typeof routing.locales)[number])
      ? (requested as keyof typeof messageImports)
      : routing.defaultLocale;

  const [common, web] = await messageImports[locale as keyof typeof messageImports]();

  return {
    locale,
    messages: { common: common.default, web: web.default },
  };
});
