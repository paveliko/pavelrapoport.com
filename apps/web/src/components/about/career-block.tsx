import { TimelineWithList } from "./timeline-with-list";

/**
 * CareerBlock — second of the three About-section acts. A short editorial
 * intro paragraph above the SVG strip and the 16-row period list.
 *
 * The intro string is resolved by AboutSection via useTranslations and
 * passed in as a prop; this component itself is a layout-only seam.
 *
 * The intro caps at max-w-3xl (~48rem) for readability — the strip and
 * list want the full max-w-5xl of the section, so the intro narrowness
 * gives the prose a breath before the dense timeline data.
 */

export interface CareerBlockProps {
  /** Screen-reader heading for the act. Visible Origin/Pivot acts get
   * heading-level prominence from their editorial h3 lines; Career has
   * only an intro paragraph, so the heading is sr-only for parity. */
  srHeading: string;
  intro: string;
  axisEndYear: number;
  axisLabel: string;
  axisDescription: string;
  presentLabel: string;
}

export function CareerBlock({
  srHeading,
  intro,
  axisEndYear,
  axisLabel,
  axisDescription,
  presentLabel,
}: CareerBlockProps) {
  return (
    <div className="space-y-12">
      <h2 className="sr-only">{srHeading}</h2>
      <p className="max-w-3xl text-lg leading-relaxed text-foreground">
        {intro}
      </p>
      <TimelineWithList
        axisEndYear={axisEndYear}
        axisLabel={axisLabel}
        axisDescription={axisDescription}
        presentLabel={presentLabel}
      />
    </div>
  );
}
