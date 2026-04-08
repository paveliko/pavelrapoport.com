import { getRequestConfig } from "next-intl/server";
import { routing } from "@repo/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested as (typeof routing.locales)[number])
      ? requested
      : routing.defaultLocale;

  const common = (await import(`@repo/i18n/messages/${locale}/common.json`))
    .default;
  const web = (await import(`@repo/i18n/messages/${locale}/web.json`)).default;

  return {
    locale,
    messages: { common, web },
  };
});
