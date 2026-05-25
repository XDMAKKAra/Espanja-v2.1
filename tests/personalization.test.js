import { describe, it, expect, vi } from "vitest";

// Stubbaa LLM-kutsu vakaan testin vuoksi. callOpenAI palauttaa "viallisen"
// vastauksen, joka pakottaa reasonerin fallback-polulle — sen voimme verifioida
// determinismisesti. Yksittäinen happy-path-LLM-testi vaatii API-avaimen,
// eikä kuulu yksikkötasolle.
vi.mock("../lib/openai.js", async () => {
  return {
    callOpenAI: vi.fn(async () => {
      throw new Error("OpenAI stubattu testissä");
    }),
  };
});

import { buildSkillProfile, summarizeMiniYOFromRows, __test } from "../lib/personalization.js";

const {
  buildBaselineProfile,
  applyMiniYOResults,
  applyBiographicalInferences,
  identifyGaps,
  identifyStrengths,
  buildFallbackPlan,
  buildTransparencyReasons,
} = __test;

describe("personalization helpers", () => {
  describe("buildBaselineProfile", () => {
    it("returns empty profile when no courses completed", () => {
      const p = buildBaselineProfile("es", "default", [], {});
      expect(p).toEqual({});
    });

    it("derives baseline from course grades for exposed topics", () => {
      const p = buildBaselineProfile("es", "default", [1, 2, 3], { 1: 8, 2: 9, 3: 7 });
      // exposed-topicit eivät ole tyhjiä K1-K3:lle
      expect(Object.keys(p).length).toBeGreaterThan(0);
      // taso pitäisi olla välillä 0-5
      for (const v of Object.values(p)) {
        expect(v.level).toBeGreaterThanOrEqual(0);
        expect(v.level).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("applyMiniYOResults", () => {
    it("overrides profile with diagnostic Part A scoresByTopic", () => {
      const profile = {
        preterite: { level: 3, confidence: 0.5, source: "grade_inferred" },
      };
      applyMiniYOResults(profile, {
        partA: { scoresByTopic: { preterite: 0.2 } },
      });
      expect(profile.preterite.source).toBe("diagnostic");
      expect(profile.preterite.confidence).toBe(0.85);
      // observed 1/5 painottaa, vanhaa 3 vain 30%
      expect(profile.preterite.level).toBeLessThanOrEqual(2);
    });

    it("uses overallAccuracy as fallback nudge if no scoresByTopic", () => {
      const profile = { preterite: { level: 4, confidence: 0.5, source: "grade_inferred" } };
      applyMiniYOResults(profile, { partA: { overallAccuracy: 0.4 } });
      expect(profile.preterite.source).toBe("diagnostic_overall");
      // tason pitäisi pudota 4 → ~3 koska overall 0.4 = obs 2
      expect(profile.preterite.level).toBeLessThanOrEqual(3);
    });

    it("writes orthography / active_grammar from Part C scores", () => {
      const profile = {};
      applyMiniYOResults(profile, {
        partC: {
          orthography_score: 0.4,
          grammar_score: 0.7,
          vocab_score: 0.8,
          used_grammar_topics: [],
        },
      });
      expect(profile.orthography.level).toBe(2);
      expect(profile.active_grammar.level).toBe(4);
      expect(profile.active_vocab.level).toBe(4);
    });
  });

  describe("applyBiographicalInferences", () => {
    it("home_usage=yes boosts oral comprehension and degrades orthography", () => {
      const profile = {
        orthography: { level: 3, confidence: 0.5, source: "grade_inferred" },
      };
      applyBiographicalInferences(profile, { home_usage: "yes" });
      expect(profile.oral_comprehension).toBeDefined();
      expect(profile.oral_comprehension.level).toBeGreaterThanOrEqual(4);
      expect(profile.orthography.level).toBe(2);
    });

    it("does not degrade orthography that was set by diagnostic", () => {
      const profile = {
        orthography: { level: 3, confidence: 0.85, source: "diagnostic" },
      };
      applyBiographicalInferences(profile, { home_usage: "yes" });
      // diagnostic-source: ortografia EI pidä laskea
      expect(profile.orthography.level).toBe(3);
      expect(profile.orthography.source).toBe("diagnostic");
    });
  });

  describe("identifyGaps / identifyStrengths", () => {
    it("identifies low-level confident topics as gaps", () => {
      const profile = {
        a: { level: 2, confidence: 0.5, source: "grade_inferred" },
        b: { level: 1, confidence: 0.85, source: "diagnostic" },
        c: { level: 4, confidence: 0.85, source: "diagnostic" },
      };
      const gaps = identifyGaps(profile);
      expect(gaps.map(g => g.topic)).toContain("a");
      expect(gaps.map(g => g.topic)).toContain("b");
      expect(gaps.map(g => g.topic)).not.toContain("c");
    });

    it("identifies high-level confident topics as strengths", () => {
      const profile = {
        a: { level: 4, confidence: 0.85, source: "diagnostic" },
        b: { level: 2, confidence: 0.85, source: "diagnostic" },
      };
      const strengths = identifyStrengths(profile);
      expect(strengths.map(s => s.topic)).toContain("a");
      expect(strengths.map(s => s.topic)).not.toContain("b");
    });
  });

  describe("buildFallbackPlan", () => {
    it("returns 3-week plan with non-empty arrays for any input", () => {
      const plan = buildFallbackPlan({ coursesCompleted: [1, 2, 3] });
      expect(plan.week1.length).toBeGreaterThan(0);
      expect(plan.week2.length).toBeGreaterThan(0);
      expect(plan.week3.length).toBeGreaterThan(0);
    });

    it("returns advanced plan when user has reached K6+", () => {
      const plan = buildFallbackPlan({ coursesCompleted: [1, 2, 3, 4, 5, 6, 7] });
      expect(plan.week1.join(" ")).toMatch(/subjunktiivi|si-lauseet/i);
    });
  });

  describe("buildTransparencyReasons", () => {
    it("explains diagnostic-sourced gaps with test reference", () => {
      const profile = { preterite: { level: 1, confidence: 0.85, source: "diagnostic" } };
      const gaps = identifyGaps(profile);
      const reasons = buildTransparencyReasons(profile, gaps, {});
      expect(reasons.preterite).toMatch(/diagnostisessa testissä/i);
    });
  });
});

describe("summarizeMiniYOFromRows", () => {
  it("returns null for empty rows", () => {
    expect(summarizeMiniYOFromRows([])).toBeNull();
    expect(summarizeMiniYOFromRows(null)).toBeNull();
  });

  it("aggregates per-part accuracy", () => {
    const rows = [
      { part: "A", question_id: "q1", is_correct: true },
      { part: "A", question_id: "q2", is_correct: false },
      { part: "A", question_id: "q3", is_correct: true },
      { part: "B", question_id: "b1", is_correct: true },
      { part: "B", question_id: "b2", is_correct: true },
    ];
    const out = summarizeMiniYOFromRows(rows);
    expect(out.partA.overallAccuracy).toBeCloseTo(2 / 3, 2);
    expect(out.partB.score).toBe(1);
  });
});

describe("buildSkillProfile (integration, fallback-plan path because LLM stubattu)", () => {
  it("produces full result shape with deterministic fields even when LLM fails", async () => {
    const result = await buildSkillProfile({
      lang: "es",
      miniYO: null,
      coursesCompleted: [1, 2, 3, 4],
      courseGrades: { 1: 7, 2: 8, 3: 8, 4: 7 },
      biography: { home_usage: "no", lived_abroad: "none", frequency: "weekly" },
      textbookKey: "default",
    });

    expect(result).toHaveProperty("skillProfile");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("gaps");
    expect(result).toHaveProperty("plan");
    expect(result).toHaveProperty("courseWeights");
    expect(result).toHaveProperty("transparencyReasons");
    expect(result.meta.planSource).toBe("fallback");
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.gaps)).toBe(true);
    expect(result.plan.week1.length).toBeGreaterThan(0);
  });

  it("Marcel scenario: heritage speaker K3+K4+K6+K7 produces strengths around suullinen + flags subjunktiivi gap when diagnostic shows it", async () => {
    const result = await buildSkillProfile({
      lang: "es",
      miniYO: {
        partA: { scoresByTopic: { subjunctive_present: 0.2, preterite: 0.9 } },
        partB: { score: 0.85 },
        partC: { orthography_score: 0.4, grammar_score: 0.7, vocab_score: 0.8, used_grammar_topics: ["preterite"] },
      },
      coursesCompleted: [3, 4, 6, 7],
      courseGrades: { 3: 8, 4: 9, 6: 7, 7: 8 },
      biography: { home_usage: "yes", lived_abroad: "none", frequency: "weekly" },
      textbookKey: "mi_mundo",
    });

    // suullinen vahvuus heritage-speakerista
    expect(result.strengths.some(s => /suullinen|kotona|ymmärrys/i.test(s))).toBe(true);

    // ortografia ja subjunktiivi puutteissa
    expect(result.gaps.some(g => /ortografia|oikeinkirj/i.test(g) || /subjunktiivi/i.test(g))).toBe(true);

    // transparency selittää subjunktiivin
    expect(result.transparencyReasons.subjunctive_present || result.transparencyReasons.subjunctive_imperfect)
      .toBeTruthy();

    // courseWeights antaa positiivisen painon edes yhdelle Puheo-kurssille
    expect(Object.keys(result.courseWeights).length).toBeGreaterThan(0);
  });
});
