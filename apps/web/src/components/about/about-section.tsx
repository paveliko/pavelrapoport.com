import { useTranslations } from "next-intl";

import { CareerBlock } from "./career-block";
import { OriginAct } from "./origin-act";
import { PivotAct } from "./pivot-act";

/**
 * AboutSection — page-level assembly for the homepage About region.
 *
 * Layout shell with three vertical slots: Origin act, Career block
 * (intro + strip + list), Pivot act.
 *
 * This file is the seam between i18n / data and the @repo/ui primitives.
 * It calls `useTranslations("web.home.about")` and resolves every
 * user-facing string here — including the SVG aria-label and the
 * "present" indicator for ongoing periods — before passing them down
 * as props. The @repo/ui components below stay free of next-intl
 * imports per spec.
 *
 * `axisEndYear` is the only prop because "the current year" is a page-
 * level runtime concern, not i18n. Everything else flows from the
 * locale's web.home.about.* namespace.
 *
 * Anchor: id="about". When the homepage gets a top-nav (separate
 * follow-up issue, not this change), the nav's "About" link targets
 * this id.
 */

export interface AboutSectionProps {
  axisEndYear: number;
}

export function AboutSection({ axisEndYear }: AboutSectionProps) {
  const t = useTranslations("web.home.about");

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="mx-auto w-full max-w-5xl px-6 py-16 md:px-12 md:py-24"
    >
      <h1 id="about-heading" className="sr-only">
        About Pavel
      </h1>

      <div data-slot="origin-act">
        <OriginAct
          headline={t("origin.headline")}
          body={t("origin.body")}
        />
      </div>

      <div data-slot="career-block" className="mt-20">
        <CareerBlock
          srHeading={t("career.srHeading")}
          intro={t("career.intro")}
          axisEndYear={axisEndYear}
          axisLabel={t("career.timeline.axisLabel")}
          axisDescription={t("career.timeline.description")}
          presentLabel={t("career.timeline.presentLabel")}
        />
      </div>

      <div data-slot="pivot-act" className="mt-20">
        <PivotAct
          headline={t("pivot.headline")}
          body={t("pivot.body")}
        />
      </div>
    </section>
  );
}
