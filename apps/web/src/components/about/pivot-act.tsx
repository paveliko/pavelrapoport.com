/**
 * PivotAct — third and concluding act of the About section. The thesis:
 * the 2026 turn from hand-written code to OpenSpec authorship.
 *
 * Editorial treatment is louder than the other two acts on purpose —
 * Pivot is the section's argument peak, not just another paragraph:
 *
 *   - Headline at text-4xl/md:text-5xl (vs Origin's text-2xl/3xl), in
 *     `text-accent-current` (the green "now" token). This echoes the
 *     Own-Studio square in the strip above and Own-Studio's accent
 *     border-left in the list — same color, three places, one through-line.
 *   - A 2px left rule in the same accent-current color spans the full
 *     block. Same visual language as a highlighted period row in the list.
 *   - Body capped at max-w-3xl to match the Career intro's reading width.
 *
 * Strings come from `web.home.about.pivot.*` resolved by AboutSection.
 * Body splits on "\n\n" — the i18n keys are authored as 4 paragraph beats.
 */

export interface PivotActProps {
  headline: string;
  /** Body text; "\n\n" splits into <p> elements. */
  body: string;
}

export function PivotAct({ headline, body }: PivotActProps) {
  const paragraphs = body.split("\n\n");

  return (
    <div className="border-l-2 border-l-accent-current pl-6 md:pl-10">
      <h2 className="text-4xl font-medium leading-tight tracking-tight text-accent-current md:text-5xl">
        {headline}
      </h2>
      <div className="mt-8 max-w-3xl space-y-5 text-base leading-relaxed text-foreground md:text-lg">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
