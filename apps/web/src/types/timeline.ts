import { z } from "zod";
import timelineJson from "@/data/timeline.json";

export const PERIOD_TYPES = [
  "formative",
  "founder",
  "business",
  "work",
  "military",
] as const;

// Date strings are either "YYYY" or "YYYY-MM". Plain lexical comparison
// respects chronological order across both forms.
const DATE_REGEX = /^\d{4}(-\d{2})?$/;
const ID_REGEX = /^\d{2}$/;

export const LocationSchema = z.object({
  city: z.string().min(1).optional(),
  country: z.string().min(1),
});

export const LinkSchema = z.object({
  pivotedInto: z.string().regex(ID_REGEX).optional(),
  pivotedFrom: z.string().regex(ID_REGEX).optional(),
});

export const PeriodSchema = z
  .object({
    id: z.string().regex(ID_REGEX, "id must be a two-digit string (01..99)"),
    start: z.string().regex(DATE_REGEX, "start must be YYYY or YYYY-MM"),
    startApprox: z.boolean().optional(),
    end: z.string().regex(DATE_REGEX).nullable(),
    endApprox: z.boolean().optional(),
    ongoing: z.boolean(),
    organization: z.string().min(1),
    location: LocationSchema,
    role: z.string().min(1),
    type: z.enum(PERIOD_TYPES),
    summary: z.string().min(1),
    notable: z.array(z.string().min(1)).optional(),
    tech: z.array(z.string().min(1)),
    link: LinkSchema.optional(),
  })
  .refine(
    (p) => p.end === null || p.end >= p.start,
    "end must be >= start or null",
  )
  .refine(
    (p) => !p.ongoing || p.end === null,
    "ongoing periods must have end: null",
  );

export const MetaSchema = z.object({
  subject: z.string().min(1),
  generated: z.string().min(1), // ISO date string; not parsed, just a marker
  version: z.string().min(1),
  scope: z.string().min(1),
  note: z.string().optional(),
});

export const TimelineSchema = z.object({
  $schema: z.literal("timeline-data/v1"),
  meta: MetaSchema.optional(),
  periods: z.array(PeriodSchema).min(1),
});

export type Location = z.infer<typeof LocationSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type PeriodType = (typeof PERIOD_TYPES)[number];
export type Timeline = z.infer<typeof TimelineSchema>;
export type TimelineMeta = z.infer<typeof MetaSchema>;

export const ACCENT_TOKENS = [
  "accent-origin",
  "accent-founder",
  "accent-architect",
  "accent-current",
  "text-tertiary",
  "text-quaternary",
] as const;
export type AccentToken = (typeof ACCENT_TOKENS)[number];

// Leading word boundary only: matches "Lead" and "Leader" at token start
// but not "pleaded". Covers Architect / Lead / Team Leader.
const ARCHITECT_ROLE_REGEX = /\b(architect|lead)/i;

export function getPeriodAccent(period: Period): AccentToken {
  if (period.ongoing) return "accent-current";

  switch (period.type) {
    case "formative":
      return "accent-origin";
    case "founder":
    case "business":
      return "accent-founder";
    case "military":
      return "text-quaternary";
    case "work":
      return ARCHITECT_ROLE_REGEX.test(period.role)
        ? "accent-architect"
        : "text-tertiary";
  }
}

// SVG axis math needs a numeric year. Dates are "YYYY" or "YYYY-MM" —
// both start with the year, so slicing the first 4 chars is safe.
export function getStartYear(period: Period): number {
  return Number.parseInt(period.start.slice(0, 4), 10);
}

export function getEndYear(period: Period, fallbackYear: number): number {
  return period.end === null
    ? fallbackYear
    : Number.parseInt(period.end.slice(0, 4), 10);
}

export function formatLocation(loc: Location): string {
  return loc.city ? `${loc.city}, ${loc.country}` : loc.country;
}

// Validate once at module load. Throws and halts the RSC build on any
// schema violation — matches the spec requirement that the build SHALL
// fail loudly on missing or invalid timeline data.
export const timeline: Timeline = TimelineSchema.parse(timelineJson);
export const periods: readonly Period[] = timeline.periods;
