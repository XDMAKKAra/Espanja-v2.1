import { describe, it, expect } from "vitest";
import { selectDashboardCta } from "../js/screens/dash-cta.js";

describe("selectDashboardCta", () => {
  it("returns onboarding CTA when profile incomplete (highest priority)", () => {
    const result = selectDashboardCta({
      profileComplete: false,
      srDueCount: 5,
      weakestTopic: "preterito",
    });
    expect(result.kind).toBe("onboarding");
    expect(result.title).toMatch(/Täydennä profiilisi/i);
    expect(result.target).toBe("onboarding");
  });

  it("returns SR review CTA when cards are due and profile complete", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      srDueCount: 12,
      weakestTopic: "preterito",
    });
    expect(result.kind).toBe("sr");
    expect(result.title).toMatch(/Kertaa nyt/i);
    expect(result.title).toContain("12");
    expect(result.target).toBe("sr-review");
  });

  it("returns daily drill CTA when no due cards and profile complete", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      srDueCount: 0,
      weakestTopic: "preterito",
    });
    expect(result.kind).toBe("drill");
    expect(result.title).toMatch(/Aloita päivän treeni/i);
    expect(result.meta).toMatch(/PRETERITO/i);
    expect(result.target).toBe("vocab");
  });

  it("falls back to generic drill copy when weakestTopic is missing", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      srDueCount: 0,
      weakestTopic: null,
    });
    expect(result.kind).toBe("drill");
    expect(result.meta).not.toContain("null");
    expect(result.meta).toMatch(/sanaa/i);
  });

  it("treats undefined srDueCount as zero", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      srDueCount: undefined,
      weakestTopic: "ser-vs-estar",
    });
    expect(result.kind).toBe("drill");
  });
});
