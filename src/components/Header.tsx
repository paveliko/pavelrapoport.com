import Link from "next/link";
import { type Locale, categories } from "@/lib/i18n";

export function Header({ lang }: { lang: Locale }) {
  const otherLang = lang === "ru" ? "en" : "ru";

  return (
    <header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-sm border-b border-grid">
      <div className="max-w-3xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
        <Link
          href={`/${lang}`}
          className="font-sans text-sm font-semibold tracking-tight text-ink"
        >
          PAVEL RAPOPORT
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/${lang}/${cat}`}
                className="font-mono text-xs text-muted hover:text-blueprint transition-colors"
              >
                /{cat}
              </Link>
            ))}
          </nav>
          <div className="font-mono text-xs flex gap-1 items-center">
            <Link
              href={`/ru`}
              className={
                lang === "ru"
                  ? "text-ink font-medium"
                  : "text-muted hover:text-blueprint transition-colors"
              }
            >
              ru
            </Link>
            <span className="text-grid">/</span>
            <Link
              href={`/en`}
              className={
                lang === "en"
                  ? "text-ink font-medium"
                  : "text-muted hover:text-blueprint transition-colors"
              }
            >
              en
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
