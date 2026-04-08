"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@repo/i18n/navigation";
import { routing } from "@repo/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function handleSwitch(next: string) {
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="font-mono text-xs flex gap-1 items-center">
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center gap-1">
          {i > 0 && <span className="text-grid">/</span>}
          <button
            onClick={() => handleSwitch(loc)}
            className={
              locale === loc
                ? "text-ink font-medium"
                : "text-muted hover:text-blueprint transition-colors"
            }
          >
            {loc}
          </button>
        </span>
      ))}
    </div>
  );
}
