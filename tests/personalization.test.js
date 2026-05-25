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

import { buildSkillProfile, selectWeightedTopic, summarizeMiniYOFromRows, __test } from "../lib/personalization.js";

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

describe("selectWeightedTopic (L-V315b Task 2)", () => {
  it("returns null for empty available topics", () => {
    expect(selectWeightedTopic({}, {}, [], "es")).toBeNull();
  });

  it("samples uniformly when profile is missing", () => {
    const topics = ["a", "b", "c"];
    const counts = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 3000; i++) counts[selectWeightedTopic(null, null, topics, "es")] += 1;
    // Each topic should land within 25-40% of 1/3 in 3000 trials (~1000 each, σ≈26)
    expect(counts.a).toBeGreaterThan(800);
    expect(counts.b).toBeGreaterThan(800);
    expect(counts.c).toBeGreaterThan(800);
  });

  it("weak topics get sampled ~10x more often than strong ones across 1000 trials", () => {
    const skillProfile = {
      subjunctive: { level: 1, confidence: 0.9, source: "diagnostic" },
      pronouns:    { level: 5, confidence: 0.9, source: "diagnostic" },
    };
    // 18 muuta topicia neutraalitasossa
    for (let i = 0; i < 18; i++) skillProfile[`mid_${i}`] = { level: 3, confidence: 0.5, source: "grade_inferred" };

    const topics = Object.keys(skillProfile);
    const counts = Object.fromEntries(topics.map(t => [t, 0]));
    for (let i = 0; i < 1000; i++) counts[selectWeightedTopic(skillProfile, {}, topics, "es")] += 1;

    // Expected freq: weak=3.0/total, strong=0.3/total, mid×18=1.0/total each
    // total = 3.0 + 0.3 + 18 = 21.3 → weak ~140, strong ~14, mid ~47 each
    expect(counts.subjunctive).toBeGreaterThan(80);
    expect(counts.pronouns).toBeLessThan(40);
    expect(counts.subjunctive / Math.max(1, counts.pronouns)).toBeGreaterThanOrEqual(4);

    // Ei "dead pools": kaikki topicit sampletaan vähintään kerran
    for (const t of topics) expect(counts[t]).toBeGreaterThan(0);
  });

  it("falls back to courseWeights when topic missing from profile", () => {
    const courseWeights = {
      kurssi_1: 1.0, kurssi_2: 1.0, kurssi_3: 1.0, kurssi_4: 1.0,
      kurssi_5: 1.0, kurssi_6: 3.0, kurssi_7: 1.0, kurssi_8: 1.0,
    };
    // subjunctive_present in es is mapped to kurssi_6 by TOPIC_TO_PUHEO_COURSE
    const topics = ["subjunctive_present", "saludos"]; // saludos hits kurssi_1
    const counts = { subjunctive_present: 0, saludos: 0 };
    for (let i = 0; i < 1000; i++) counts[selectWeightedTopic({}, courseWeights, topics, "es")] += 1;
    expect(counts.subjunctive_present).toBeGreaterThan(counts.saludos);
  });

  it("uniform random within a single deterministic call", () => {
    // RNG-injectable for deterministic test
    const fakeRng = () => 0.0; // always pick first
    expect(selectWeightedTopic({}, {}, ["x", "y", "z"], "es", fakeRng)).toBe("x");
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
