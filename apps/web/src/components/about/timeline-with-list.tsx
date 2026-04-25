import { PeriodListItem } from "@repo/ui/components/period-list-item";
import { TimelineStrip } from "@repo/ui/components/timeline-strip";

import {
  formatLocation,
  formatYears,
  getPeriodBorderClass,
  getPeriodTextClass,
  getStartYear,
  isPeriodHighlighted,
  periods,
  type Period,
} from "@/types/timeline";

/**
 * TimelineWithList — the strip + ordered period list pair, wired to
 * the canonical timeline.json. Used by both the homepage temp mount
 * and the /dev/about-preview verification page so the two surfaces
 * never drift.
 *
 * No translation resolution here. Strings (`axisLabel`, `presentLabel`)
 * arrive as props from the consuming RSC, which is the layer allowed
 * to call `useTranslations` / `getTranslations`.
 */

export interface TimelineWithListProps {
  /** Year of the leftmost main-axis tick. Default 2000. */
  axisStartYear?: number;
  /** Year of the rightmost main-axis tick (typically the current year). */
  axisEndYear: number;
  /** SVG <title> — short label announced by screen readers. */
  axisLabel: string;
  /** SVG <desc> — longer description of what the strip shows. */
  axisDescription: string;
  /** Label used in place of an end year for ongoing periods (e.g. "present"). */
  presentLabel: string;
}

// Tooltip stays in English regardless of locale because every component
// of it (org, role, year-range) is canonical English metadata per spec.
// "present" stays English here too so the tooltip is locale-stable.
function buildTooltip(period: Period): string {
  const startYear = getStartYear(period);
  const endYear = period.ongoing
    ? "present"
    : period.end
      ? Number.parseInt(period.end.slice(0, 4), 10)
      : startYear;
  const years =
    typeof endYear === "number" && endYear === startYear
      ? `${startYear}`
      : `${startYear} – ${endYear}`;
  return `${period.role} at ${period.organization}, ${years}`;
}

export function TimelineWithList({
  axisStartYear = 2000,
  axisEndYear,
  axisLabel,
  axisDescription,
  presentLabel,
}: TimelineWithListProps) {
  // Strip: chronological order (matches tab-order requirement).
  const stripPeriods = periods.map((p) => ({
    id: p.id,
    startYear: getStartYear(p),
    tw: getPeriodTextClass(p),
    highlighted: isPeriodHighlighted(p),
    tooltip: buildTooltip(p),
  }));

  // List: newest-first per spec ("Origin at the bottom").
  const listPeriods = [...periods].reverse();

  return (
    <>
      <TimelineStrip
        periods={stripPeriods}
        axisStartYear={axisStartYear}
        axisEndYear={axisEndYear}
        axisLabel={axisLabel}
        axisDescription={axisDescription}
      />
      <ol className="flex flex-col">
        {listPeriods.map((p) => (
          <li key={p.id}>
            <PeriodListItem
              id={p.id}
              yearsLabel={formatYears(p, presentLabel)}
              organization={p.organization}
              role={p.role}
              location={formatLocation(p.location)}
              tech={p.tech}
              body={p.summary}
              highlighted={isPeriodHighlighted(p)}
              accentTw={getPeriodBorderClass(p)}
              notable={p.notable}
            />
          </li>
        ))}
      </ol>
    </>
  );
}
