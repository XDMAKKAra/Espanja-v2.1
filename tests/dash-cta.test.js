import { describe, it, expect } from "vitest";
import { selectDashboardCta } from "../js/screens/dash-cta.js";

describe("selectDashboardCta", () => {
  it("returns onboarding CTA when profile incomplete (highest priority)", () => {
    const result = selectDashboardCta({
      profileComplete: false,
      weakestTopic: "preterito",
    });
    expect(result.kind).toBe("onboarding");
    expect(result.title).toMatch(/Täydennä profiilisi/i);
    expect(result.target).toBe("onboarding");
  });

  it("returns writing drill CTA when profile complete", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      weakestTopic: "preterito",
    });
    expect(result.kind).toBe("drill");
    expect(result.title).toMatch(/Kirjoita päivän tehtävä/i);
    expect(result.meta).toMatch(/PRETERITO/);
    expect(result.target).toBe("writing");
  });

  it("falls back to generic drill copy when weakestTopic is missing", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      weakestTopic: null,
    });
    expect(result.kind).toBe("drill");
    expect(result.meta).not.toContain("null");
    expect(result.meta).toMatch(/LYHYT KIRJOITUS/);
  });

  it("ignores legacy srDueCount field without breaking", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      srDueCount: 99,
      weakestTopic: "ser-vs-estar",
    });
    expect(result.kind).toBe("drill");
    expect(result.target).toBe("writing");
  });

  it("handles missing input object", () => {
    const result = selectDashboardCta();
    expect(result.kind).toBe("onboarding");
  });
});
