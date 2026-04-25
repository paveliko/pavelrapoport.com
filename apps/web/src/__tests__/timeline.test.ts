import { describe, expect, it } from "vitest";
import {
  formatLocation,
  formatYears,
  getEndYear,
  getPeriodAccent,
  getPeriodBorderClass,
  getPeriodTextClass,
  getStartYear,
  isPeriodHighlighted,
  PeriodSchema,
  timeline,
  type Period,
} from "../types/timeline";

const basePeriod: Period = {
  id: "99",
  type: "work",
  start: "2010-01",
  end: "2011-01",
  ongoing: false,
  organization: "Acme",
  role: "Developer",
  location: { city: "Tel Aviv", country: "Israel" },
  summary: "A base fixture.",
  tech: [],
};

describe("getPeriodAccent", () => {
  it("maps formative to accent-origin", () => {
    expect(getPeriodAccent({ ...basePeriod, type: "formative" })).toBe(
      "accent-origin",
    );
  });

  it("maps founder and business to accent-founder", () => {
    expect(getPeriodAccent({ ...basePeriod, type: "founder" })).toBe(
      "accent-founder",
    );
    expect(getPeriodAccent({ ...basePeriod, type: "business" })).toBe(
      "accent-founder",
    );
  });

  it("maps military to text-quaternary", () => {
    expect(getPeriodAccent({ ...basePeriod, type: "military" })).toBe(
      "text-quaternary",
    );
  });

  it("maps work roles containing Architect or Lead to accent-architect", () => {
    expect(
      getPeriodAccent({ ...basePeriod, role: "Frontend Architect" }),
    ).toBe("accent-architect");
    expect(getPeriodAccent({ ...basePeriod, role: "Tech Lead" })).toBe(
      "accent-architect",
    );
    expect(
      getPeriodAccent({ ...basePeriod, role: "Front-End Team Leader" }),
    ).toBe("accent-architect");
  });

  it("maps other work roles to text-tertiary", () => {
    expect(
      getPeriodAccent({ ...basePeriod, role: "Frontend Developer" }),
    ).toBe("text-tertiary");
    expect(getPeriodAccent({ ...basePeriod, role: "Designer" })).toBe(
      "text-tertiary",
    );
  });

  it("ongoing periods override everything with accent-current", () => {
    expect(
      getPeriodAccent({
        ...basePeriod,
        role: "Frontend Architect",
        end: null,
        ongoing: true,
      }),
    ).toBe("accent-current");
  });
});

describe("PeriodSchema validation", () => {
  it("rejects end < start (both YYYY)", () => {
    expect(() =>
      PeriodSchema.parse({ ...basePeriod, start: "2020", end: "2010" }),
    ).toThrow();
  });

  it("rejects end < start (YYYY-MM precision)", () => {
    expect(() =>
      PeriodSchema.parse({ ...basePeriod, start: "2020-06", end: "2020-03" }),
    ).toThrow();
  });

  it("rejects ongoing with non-null end", () => {
    expect(() =>
      PeriodSchema.parse({ ...basePeriod, ongoing: true, end: "2025" }),
    ).toThrow();
  });

  it("rejects ids that are not two digits", () => {
    expect(() =>
      PeriodSchema.parse({ ...basePeriod, id: "origin-foo" }),
    ).toThrow();
    expect(() => PeriodSchema.parse({ ...basePeriod, id: "1" })).toThrow();
  });

  it("rejects dates that are not YYYY or YYYY-MM", () => {
    expect(() =>
      PeriodSchema.parse({ ...basePeriod, start: "2020-01-15" }),
    ).toThrow();
  });

  it("accepts a well-formed period", () => {
    expect(() => PeriodSchema.parse(basePeriod)).not.toThrow();
  });

  it("accepts a period with startApprox/endApprox flags", () => {
    expect(() =>
      PeriodSchema.parse({
        ...basePeriod,
        startApprox: true,
        endApprox: true,
      }),
    ).not.toThrow();
  });

  it("accepts a period with link.pivotedInto/pivotedFrom", () => {
    expect(() =>
      PeriodSchema.parse({ ...basePeriod, link: { pivotedInto: "13" } }),
    ).not.toThrow();
  });
});

describe("getStartYear / getEndYear", () => {
  it("extracts year from YYYY", () => {
    expect(getStartYear({ ...basePeriod, start: "1990" })).toBe(1990);
  });

  it("extracts year from YYYY-MM", () => {
    expect(getStartYear({ ...basePeriod, start: "2020-07" })).toBe(2020);
  });

  it("returns fallback year for null end", () => {
    expect(getEndYear({ ...basePeriod, end: null }, 2026)).toBe(2026);
  });

  it("extracts end year when present", () => {
    expect(getEndYear({ ...basePeriod, end: "2022-03" }, 9999)).toBe(2022);
  });
});

describe("formatLocation", () => {
  it("returns 'City, Country' when city is present", () => {
    expect(
      formatLocation({ city: "Herzliya", country: "Israel" }),
    ).toBe("Herzliya, Israel");
  });

  it("returns country only when city is absent (IDF)", () => {
    expect(formatLocation({ country: "Israel" })).toBe("Israel");
  });
});

describe("formatYears", () => {
  it("returns single year when start equals end", () => {
    expect(
      formatYears({ ...basePeriod, start: "1990", end: "1990" }, "present"),
    ).toBe("1990");
  });

  it("returns range with en-dash for multi-year periods", () => {
    expect(
      formatYears({ ...basePeriod, start: "2003", end: "2007" }, "present"),
    ).toBe("2003 – 2007");
  });

  it("uses present label for ongoing periods", () => {
    expect(
      formatYears(
        { ...basePeriod, start: "2026", end: null, ongoing: true },
        "present",
      ),
    ).toBe("2026 – present");
  });

  it("respects locale-specific present label", () => {
    expect(
      formatYears(
        { ...basePeriod, start: "2026", end: null, ongoing: true },
        "сейчас",
      ),
    ).toBe("2026 – сейчас");
  });
});

describe("isPeriodHighlighted", () => {
  it("highlights founder type", () => {
    expect(isPeriodHighlighted({ ...basePeriod, type: "founder" })).toBe(true);
  });

  it("highlights business type (LANFUN)", () => {
    expect(isPeriodHighlighted({ ...basePeriod, type: "business" })).toBe(true);
  });

  it("highlights ongoing periods", () => {
    expect(
      isPeriodHighlighted({ ...basePeriod, end: null, ongoing: true }),
    ).toBe(true);
  });

  it("highlights periods with notable[]", () => {
    expect(
      isPeriodHighlighted({ ...basePeriod, notable: ["Some flag"] }),
    ).toBe(true);
  });

  it("does NOT highlight plain work without notable", () => {
    expect(isPeriodHighlighted(basePeriod)).toBe(false);
  });
});

describe("class-map plumbing", () => {
  it("maps formative period to text-accent-origin / border-l-accent-origin", () => {
    const p = { ...basePeriod, type: "formative" as const };
    expect(getPeriodTextClass(p)).toBe("text-accent-origin");
    expect(getPeriodBorderClass(p)).toBe("border-l-accent-origin");
  });

  it("maps founder to accent-founder classes", () => {
    const p = { ...basePeriod, type: "founder" as const };
    expect(getPeriodTextClass(p)).toBe("text-accent-founder");
    expect(getPeriodBorderClass(p)).toBe("border-l-accent-founder");
  });

  it("maps business to accent-founder classes (LANFUN)", () => {
    const p = { ...basePeriod, type: "business" as const };
    expect(getPeriodTextClass(p)).toBe("text-accent-founder");
    expect(getPeriodBorderClass(p)).toBe("border-l-accent-founder");
  });

  it("maps military to text-quaternary classes (IDF)", () => {
    const p = { ...basePeriod, type: "military" as const };
    expect(getPeriodTextClass(p)).toBe("text-text-quaternary");
    expect(getPeriodBorderClass(p)).toBe("border-l-text-quaternary");
  });

  it("maps work + Architect role to accent-architect classes", () => {
    const p = { ...basePeriod, role: "Frontend Architect" };
    expect(getPeriodTextClass(p)).toBe("text-accent-architect");
    expect(getPeriodBorderClass(p)).toBe("border-l-accent-architect");
  });

  it("maps plain work to text-tertiary classes", () => {
    expect(getPeriodTextClass(basePeriod)).toBe("text-text-tertiary");
    expect(getPeriodBorderClass(basePeriod)).toBe("border-l-text-tertiary");
  });

  it("ongoing override returns accent-current classes", () => {
    const p = { ...basePeriod, end: null, ongoing: true };
    expect(getPeriodTextClass(p)).toBe("text-accent-current");
    expect(getPeriodBorderClass(p)).toBe("border-l-accent-current");
  });
});

describe("timeline.json (module-load validation)", () => {
  it("parses successfully", () => {
    expect(timeline.$schema).toBe("timeline-data/v1");
  });

  it("has exactly 16 periods", () => {
    expect(timeline.periods).toHaveLength(16);
  });

  it("has unique ids across all periods", () => {
    const ids = timeline.periods.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has exactly one ongoing period (own studio)", () => {
    const ongoing = timeline.periods.filter((p) => p.ongoing);
    expect(ongoing).toHaveLength(1);
    expect(ongoing[0]?.id).toBe("16");
    expect(ongoing[0]?.type).toBe("founder");
  });

  it("origin period is 01, type formative, 1990", () => {
    const origin = timeline.periods.find((p) => p.id === "01");
    expect(origin?.type).toBe("formative");
    expect(getStartYear(origin!)).toBe(1990);
  });

  it("IDF is period 02, type military", () => {
    const idf = timeline.periods.find((p) => p.id === "02");
    expect(idf?.type).toBe("military");
    expect(getPeriodAccent(idf!)).toBe("text-quaternary");
  });

  it("LANFUN is period 03, type business, mapped to accent-founder", () => {
    const lanfun = timeline.periods.find((p) => p.id === "03");
    expect(lanfun?.type).toBe("business");
    expect(getPeriodAccent(lanfun!)).toBe("accent-founder");
  });

  it("Zerto (14) and HPE (15) overlap and both end 2026-03", () => {
    const zerto = timeline.periods.find((p) => p.id === "14");
    const hpe = timeline.periods.find((p) => p.id === "15");
    expect(zerto?.end).toBe("2026-03");
    expect(hpe?.end).toBe("2026-03");
    expect(hpe!.start < zerto!.end!).toBe(true);
  });

  it("Own studio (16) is ongoing, founder, in Chișinău", () => {
    const studio = timeline.periods.find((p) => p.id === "16");
    expect(studio?.ongoing).toBe(true);
    expect(studio?.end).toBeNull();
    expect(studio?.type).toBe("founder");
    expect(studio?.location.city).toBe("Chișinău");
  });

  it("brand DNA pivots into QuickWork via link", () => {
    const brandDna = timeline.periods.find((p) => p.id === "12");
    const quickwork = timeline.periods.find((p) => p.id === "13");
    expect(brandDna?.link?.pivotedInto).toBe("13");
    expect(quickwork?.link?.pivotedFrom).toBe("12");
  });
});
