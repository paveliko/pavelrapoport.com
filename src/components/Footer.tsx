import { type Locale, getDictionary } from "@/lib/i18n";

export function Footer({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);

  return (
    <footer className="border-t border-grid mt-auto">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-8 font-mono text-xs text-muted">
        {dict.footer} · pavelrapoport.com · {new Date().getFullYear()}
      </div>
    </footer>
  );
}
