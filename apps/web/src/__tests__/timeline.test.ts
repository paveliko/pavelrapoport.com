import { describe, expect, it } from "vitest";
import {
  formatLocation,
  getEndYear,
  getPeriodAccent,
  getStartYear,
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
