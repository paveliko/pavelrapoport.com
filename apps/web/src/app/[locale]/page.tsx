import { AboutSection } from "@/components/about/about-section";

const CURRENT_YEAR = 2026;

// TEMP: replaced by full <AboutSection /> wiring (with next-intl
// resolution) in §7. Tracking: this branch's §6.
// AboutSection is the canonical wrapper; Origin / Career intro / Pivot
// fill in across §6.2–§6.4.
export default function TimelinePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AboutSection
        axisEndYear={CURRENT_YEAR}
        axisLabel="Career timeline 2000–2026, with 1990 origin"
        presentLabel="present"
      />
    </main>
  );
}
