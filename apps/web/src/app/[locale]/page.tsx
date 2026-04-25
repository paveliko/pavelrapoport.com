import { AboutSection } from "@/components/about/about-section";

const CURRENT_YEAR = 2026;

/**
 * Homepage. AboutSection is the primary content of pavelrapoport.com:
 * the three-act narrative (Origin → Career → Pivot) anchored at #about.
 *
 * The page passes `axisEndYear` because "the current year" is a runtime
 * concern, not i18n. Every user-facing string — including the timeline's
 * SVG aria-label and the "present" indicator for ongoing periods — is
 * resolved inside AboutSection from the web.home.about.* namespace.
 *
 * Period metadata (orgs, roles, summaries) intentionally stays English
 * across locales per the spec — proper nouns and technical terms aren't
 * translated.
 */
export default function TimelinePage() {
  // The locale layout already wraps page output in <main>; the page
  // returns the section directly so we don't end up with two main
  // landmarks.
  return <AboutSection axisEndYear={CURRENT_YEAR} />;
}
