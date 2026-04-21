"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

const stack = ["Next.js 16", "Tailwind CSS 4", "MDX", "Cloudflare Pages"];

export function ComingSoon() {
  const t = useTranslations("web.comingSoon");

  return (
    <div className="flex-1 flex items-center justify-center py-unit-4">
      <div className="w-full max-w-md">
        {/* Construction mark — top left */}
        <div className="relative mb-unit-2">
          <div className="absolute -top-3 -left-3">
            <div className="w-3 h-[1px] bg-brand-accent" />
            <div className="w-[1px] h-3 bg-brand-accent absolute top-0 left-0" />
          </div>
          <div className="absolute -top-3 -right-3">
            <div className="w-3 h-[1px] bg-brand-accent" />
            <div className="w-[1px] h-3 bg-brand-accent absolute top-0 right-0" />
          </div>

          {/* Status line */}
          <div className="font-mono text-[10px] tracking-[0.2em] text-brand-accent mb-6">
            {t("status")}
          </div>

          {/* Blueprint line */}
          <div className="h-[2px] bg-blueprint mb-6" />

          {/* Heading */}
          <h1 className="font-sans text-[2rem] font-semibold leading-tight text-ink mb-3">
            {t("heading")}
          </h1>

          {/* Description */}
          <p className="font-serif text-base text-ink-light leading-[1.7] mb-unit-2">
            {t("description")}
          </p>

          {/* Grid divider */}
          <div className="h-[0.5px] bg-grid mb-unit" />

          {/* Tech stack */}
          <div className="mb-unit">
            <div className="font-mono text-[10px] tracking-[0.15em] text-ink-muted uppercase mb-3">
              stack
            </div>
            <div className="flex flex-wrap gap-2">
              {stack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-xs text-ink-light border border-grid px-2 py-1"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="mb-unit-2">
            <div className="font-mono text-[10px] tracking-[0.15em] text-ink-muted uppercase mb-3">
              languages
            </div>
            <LanguageSwitcher />
          </div>

          {/* Grid divider */}
          <div className="h-[0.5px] bg-grid mb-unit" />

          {/* Soon line */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 border border-blueprint relative">
              <div className="absolute inset-[3px] bg-blueprint" />
            </div>
            <span className="font-mono text-xs text-ink-muted">
              {t("soon")}
            </span>
          </div>

          {/* Construction mark — bottom right */}
          <div className="absolute -bottom-3 -right-3">
            <div className="w-3 h-[1px] bg-brand-accent absolute bottom-0 right-0" />
            <div className="w-[1px] h-3 bg-brand-accent absolute bottom-0 right-0" />
          </div>
          <div className="absolute -bottom-3 -left-3">
            <div className="w-3 h-[1px] bg-brand-accent absolute bottom-0 left-0" />
            <div className="w-[1px] h-3 bg-brand-accent absolute bottom-0 left-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
