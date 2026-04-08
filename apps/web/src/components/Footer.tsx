"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("web");

  return (
    <footer className="border-t border-grid mt-auto">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-8 font-mono text-xs text-muted">
        {t("footer")} · pavelrapoport.com · {new Date().getFullYear()}
      </div>
    </footer>
  );
}
