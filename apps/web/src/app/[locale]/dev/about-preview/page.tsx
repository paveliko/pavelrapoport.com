import { TimelineWithList } from "@/components/about/timeline-with-list";

const CURRENT_YEAR = 2026;

export default function AboutPreviewPage() {
  return (
    <main className="min-h-screen bg-background p-8 text-foreground md:p-16">
      <header className="mb-8">
        <h1 className="font-mono text-sm uppercase tracking-widest">
          About — preview
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Temporary review page (gated to NODE_ENV=development).
          Renders the §5 components via the shared TimelineWithList.
        </p>
      </header>

      <TimelineWithList
        axisEndYear={CURRENT_YEAR}
        axisLabel="Career timeline 2000–2026, with 1990 origin"
        axisDescription="Sixteen career periods from 1990 to 2026. Each square represents one period. The detached square at the far left is the 1990 origin moment."
        presentLabel="present"
      />
    </main>
  );
}
