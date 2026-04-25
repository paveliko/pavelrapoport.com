import { ArkanoidIcon } from "@repo/ui/components/arkanoid-icon";

/**
 * OriginAct — first of the three About-section acts. Frames the 1990
 * Pioneer Palace / Arkanoid moment via a stylized icon and a short
 * two-paragraph prose block.
 *
 * Strings come from `home.about.origin.*` resolved by the AboutSection
 * wrapper above. The Arkanoid icon is decorative — semantically the
 * headline + body carry the information, so the icon stays
 * aria-hidden (default behavior of ArkanoidIcon when no aria-label is
 * passed).
 *
 * Layout: stacked on mobile (icon top, prose below), side-by-side on
 * md+ (icon left, prose right). Icon size 96 — picked at §4 review for
 * hero-size legibility with the 2×6 brick density.
 */

export interface OriginActProps {
  headline: string;
  /** Body text; "\n\n" splits into <p> elements. */
  body: string;
}

export function OriginAct({ headline, body }: OriginActProps) {
  const paragraphs = body.split("\n\n");

  return (
    <div
      data-slot="origin-act-content"
      className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12"
    >
      <div className="shrink-0 text-accent-origin">
        <ArkanoidIcon size={96} />
      </div>
      <div className="flex-1 space-y-4">
        <h3 className="text-2xl font-medium leading-tight tracking-tight md:text-3xl">
          {headline}
        </h3>
        <div className="space-y-3 text-base leading-relaxed text-foreground">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
