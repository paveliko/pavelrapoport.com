import { TimelineWithList } from "@/components/about/timeline-with-list";

const CURRENT_YEAR = 2026;

// TEMP: replaced by <AboutSection /> in §7. Tracking: this branch's §6.
// Strings here are placeholders — translation resolution lands when the
// Origin / Career / Pivot acts are wired in §6.
export default function TimelinePage() {
  return (
    <main className="min-h-screen bg-background p-8 text-foreground md:p-16">
      <TimelineWithList
        axisEndYear={CURRENT_YEAR}
        axisLabel="Career timeline 2000–2026, with 1990 origin"
        presentLabel="present"
      />
    </main>
  );
}
