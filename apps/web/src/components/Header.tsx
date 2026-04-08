"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { categories } from "@repo/i18n/config";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-sm border-b border-grid">
      <div className="max-w-3xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
        <Link
          href={`/${locale}`}
          className="font-sans text-sm font-semibold tracking-tight text-ink"
        >
          PAVEL RAPOPORT
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/${locale}/${cat}`}
                className="font-mono text-xs text-muted hover:text-blueprint transition-colors"
              >
                /{cat}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
