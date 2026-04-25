import { TimelineWithList } from "./timeline-with-list";

/**
 * AboutSection — page-level assembly for the homepage About region.
 *
 * Layout shell with three vertical slots: Origin act, Career block
 * (intro + strip + list), Pivot act. The Career block is wired now;
 * Origin and Pivot are empty placeholders until §6.2 / §6.4 land.
 *
 * This file is the seam between i18n / data and the @repo/ui primitives.
 * `axisLabel` and `presentLabel` arrive as props from the page above
 * (which will resolve them via next-intl in a later subsection); the
 * @repo/ui components below stay free of next-intl imports.
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
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="mx-auto w-full max-w-5xl px-6 py-16 md:px-12 md:py-24"
    >
      <h2 id="about-heading" className="sr-only">
        About Pavel
      </h2>

      {/* §6.2 — OriginAct lands here */}
      <div data-slot="origin-act" />

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
