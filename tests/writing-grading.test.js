import { describe, it, expect } from "vitest";
import {
  RUBRIC_MAX, SHORT_MAX, LONG_MAX,
  calculatePenalty, sumScores, applyPenalty,
  pointsToGrade, processGradingResult,
} from "../lib/writingGrading.js";

// ─── Constants ─────────────────────────────────────────────────────────────

describe("Writing grading constants", () => {
  it("RUBRIC_MAX is 20", () => {
    expect(RUBRIC_MAX).toBe(20);
  });

  it("SHORT_MAX and LONG_MAX are both 20 (same 0–20 rubric)", () => {
    expect(SHORT_MAX).toBe(20);
    expect(LONG_MAX).toBe(20);
  });
});

// ─── calculatePenalty ──────────────────────────────────────────────────────
// 1pt per 40 chars below minimum (rescaled from old 1pt/10chars on 99-scale)

describe("calculatePenalty", () => {
  it("returns 0 when at or above minimum", () => {
    expect(calculatePenalty(200, 160)).toBe(0);
    expect(calculatePenalty(160, 160)).toBe(0);
  });

  it("returns 1 per 40 chars below minimum", () => {
    expect(calculatePenalty(120, 160)).toBe(1);  // 40 under → -1
    expect(calculatePenalty(80,  160)).toBe(2);  // 80 under → -2
    expect(calculatePenalty(0,   160)).toBe(4);  // 160 under → -4
  });

  it("rounds up partial 40s", () => {
    expect(calculatePenalty(155, 160)).toBe(1);  // 5 under → ceil(0.125) = 1
    expect(calculatePenalty(121, 160)).toBe(1);  // 39 under → ceil(0.975) = 1
    expect(calculatePenalty(119, 160)).toBe(2);  // 41 under → ceil(1.025) = 2
  });

  it("no over-length penalty", () => {
    expect(calculatePenalty(300, 160)).toBe(0);
  });
});

// ─── sumScores ─────────────────────────────────────────────────────────────

describe("sumScores", () => {
  it("sums all four dimensions", () => {
    expect(sumScores({
      viestinnallisyys: { score: 4 },
      kielen_rakenteet:  { score: 3 },
      sanasto:           { score: 4 },
      kokonaisuus:       { score: 3 },
    })).toBe(14);
  });

  it("M anchor: all-3 essay sums to 12", () => {
    expect(sumScores({
      viestinnallisyys: { score: 3 },
      kielen_rakenteet:  { score: 3 },
      sanasto:           { score: 3 },
      kokonaisuus:       { score: 3 },
    })).toBe(12);
  });

  it("handles missing dimensions gracefully", () => {
    expect(sumScores({ viestinnallisyys: { score: 5 } })).toBe(5);
  });

  it("returns 0 for empty object", () => {
    expect(sumScores({})).toBe(0);
  });
});

// ─── applyPenalty ──────────────────────────────────────────────────────────

describe("applyPenalty", () => {
  it("subtracts penalty from raw score", () => {
    expect(applyPenalty(14, 2)).toBe(12);
  });

  it("never goes below 0", () => {
    expect(applyPenalty(3, 10)).toBe(0);
  });

  it("returns raw score when penalty is 0", () => {
    expect(applyPenalty(15, 0)).toBe(15);
  });
});

// ─── pointsToGrade ─────────────────────────────────────────────────────────
// Absolute thresholds on 0–20 scale: 16/13/10/7/4/2
// YTL lyhyt oppimäärä 100-scale values (80/65/50/35/20/10) ÷ 5 = these values.

describe("pointsToGrade", () => {
  it("0 → I",  () => expect(pointsToGrade(0)).toBe("I"));
  it("1 → I",  () => expect(pointsToGrade(1)).toBe("I"));
  it("2 → A",  () => expect(pointsToGrade(2)).toBe("A"));
  it("3 → A",  () => expect(pointsToGrade(3)).toBe("A"));
  it("4 → B",  () => expect(pointsToGrade(4)).toBe("B"));
  it("6 → B",  () => expect(pointsToGrade(6)).toBe("B"));
  it("7 → C",  () => expect(pointsToGrade(7)).toBe("C"));
  it("9 → C",  () => expect(pointsToGrade(9)).toBe("C"));
  it("10 → M", () => expect(pointsToGrade(10)).toBe("M"));
  it("12 → M (M anchor: all-3 essay)", () => expect(pointsToGrade(12)).toBe("M"));
  it("13 → E", () => expect(pointsToGrade(13)).toBe("E"));
  it("15 → E", () => expect(pointsToGrade(15)).toBe("E"));
  it("16 → L", () => expect(pointsToGrade(16)).toBe("L"));
  it("20 → L", () => expect(pointsToGrade(20)).toBe("L"));
});

// ─── processGradingResult ──────────────────────────────────────────────────

const mockAiResult = {
  viestinnallisyys: { score: 4, feedback_fi: "Tehtävä täytetty." },
  kielen_rakenteet:  { score: 3, feedback_fi: "Virheitä esiintyy." },
  sanasto:           { score: 3, feedback_fi: "Riittävä sanasto." },
  kokonaisuus:       { score: 3, feedback_fi: "Yhtenäinen teksti." },
  total: 99,        // model's value — ignored server-side
  band: "L",        // model's value — ignored server-side
  overall_feedback_fi: "Jatka harjoittelua.",
  corrected_text: "Texto corregido.",
  errors: [
    { excerpt: "estoy contento", corrected: "soy contento", category: "grammar", explanation_fi: "ser/estar" },
  ],
  annotations: [
    { excerpt: "hace mucho que", comment_fi: "Hyvä rakenne.", type: "positive" },
  ],
};

describe("processGradingResult", () => {
  it("recomputes rawScore from 4 dimensions (ignores model total)", () => {
    const result = processGradingResult(mockAiResult, 200, 160, true);
    expect(result.rawScore).toBe(13); // 4+3+3+3
  });

  it("applies no penalty when at or above minimum", () => {
    const result = processGradingResult(mockAiResult, 200, 160, true);
    expect(result.penalty).toBe(0);
    expect(result.finalScore).toBe(13);
  });

  it("applies penalty when below minimum (40-char rule)", () => {
    // 120 chars, min 160 → deficit 40 → ceil(40/40) = 1
    const result = processGradingResult(mockAiResult, 120, 160, true);
    expect(result.penalty).toBe(1);
    expect(result.finalScore).toBe(12);
  });

  it("maxScore is always RUBRIC_MAX (20)", () => {
    const rShort = processGradingResult(mockAiResult, 200, 160, true);
    const rLong  = processGradingResult(mockAiResult, 400, 300, false);
    expect(rShort.maxScore).toBe(20);
    expect(rLong.maxScore).toBe(20);
  });

  it("computes ytlGrade server-side (ignores model band)", () => {
    // rawScore=13, penalty=0, finalScore=13 → E
    const result = processGradingResult(mockAiResult, 200, 160, true);
    expect(result.ytlGrade).toBe("E");
  });

  it("M anchor: all-3 essay → M regardless of model output", () => {
    const allThree = {
      ...mockAiResult,
      viestinnallisyys: { score: 3, feedback_fi: "" },
      kielen_rakenteet:  { score: 3, feedback_fi: "" },
      sanasto:           { score: 3, feedback_fi: "" },
      kokonaisuus:       { score: 3, feedback_fi: "" },
      total: 0, band: "I",
    };
    const result = processGradingResult(allThree, 200, 160, true);
    expect(result.rawScore).toBe(12);
    expect(result.ytlGrade).toBe("M");
  });

  it("returns all four dimension objects", () => {
    const result = processGradingResult(mockAiResult, 200, 160, true);
    expect(result.viestinnallisyys.score).toBe(4);
    expect(result.kielen_rakenteet.score).toBe(3);
    expect(result.sanasto.score).toBe(3);
    expect(result.kokonaisuus.score).toBe(3);
  });

  it("passes through corrected_text, errors, annotations, overall_feedback_fi", () => {
    const result = processGradingResult(mockAiResult, 200, 160, true);
    expect(result.corrected_text).toBe("Texto corregido.");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].explanation_fi).toBe("ser/estar");
    expect(result.annotations).toHaveLength(1);
    expect(result.overall_feedback_fi).toBe("Jatka harjoittelua.");
  });

  it("clamps finalScore to 0 with extreme under-length", () => {
    // 0 chars, min 160 → deficit 160 → ceil(160/40) = 4. rawScore=13 → final=9
    const result = processGradingResult(mockAiResult, 0, 160, true);
    expect(result.penalty).toBe(4);
    expect(result.finalScore).toBe(9);
  });

  it("clamps to 0, never negative", () => {
    const lowScore = {
      ...mockAiResult,
      viestinnallisyys: { score: 1, feedback_fi: "" },
      kielen_rakenteet:  { score: 0, feedback_fi: "" },
      sanasto:           { score: 0, feedback_fi: "" },
      kokonaisuus:       { score: 0, feedback_fi: "" },
    };
    // rawScore=1, penalty=4 → should clamp to 0
    const result = processGradingResult(lowScore, 0, 160, true);
    expect(result.finalScore).toBe(0);
  });
});
