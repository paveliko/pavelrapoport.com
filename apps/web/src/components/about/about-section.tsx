import { useTranslations } from "next-intl";

import { OriginAct } from "./origin-act";
import { TimelineWithList } from "./timeline-with-list";

/**
 * AboutSection — page-level assembly for the homepage About region.
 *
 * Layout shell with three vertical slots: Origin act (live as of §6.2),
 * Career block (intro + strip + list — intro lands in §6.3), Pivot act
 * (lands in §6.4).
 *
 * This file is the seam between i18n / data and the @repo/ui primitives.
 * It calls `useTranslations("home.about")` and passes resolved strings
 * down to its children. The @repo/ui components below stay free of
 * next-intl imports per spec.
 *
 * Anchor: id="about". When the homepage gets a top-nav (separate
 * follow-up issue, not this change), the nav's "About" link targets
 * this id.
 */

export interface AboutSectionProps {
  axisEndYear: number;
  axisLabel: string;
  presentLabel: string;
}

export function AboutSection({
  axisEndYear,
  axisLabel,
  presentLabel,
}: AboutSectionProps) {
  const t = useTranslations("web.home.about");

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="mx-auto w-full max-w-5xl px-6 py-16 md:px-12 md:py-24"
    >
      <h2 id="about-heading" className="sr-only">
        About Pavel
      </h2>

      <div data-slot="origin-act">
        <OriginAct
          headline={t("origin.headline")}
          body={t("origin.body")}
        />
      </div>

      <div data-slot="career-block" className="mt-16">
        {/* §6.3 — Career intro paragraph lands above the strip */}
        <TimelineWithList
          axisEndYear={axisEndYear}
          axisLabel={axisLabel}
          presentLabel={presentLabel}
        />
      </div>

      {/* §6.4 — PivotAct lands here */}
      <div data-slot="pivot-act" className="mt-16" />
    </section>
  );
}
