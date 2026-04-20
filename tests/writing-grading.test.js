import { describe, it, expect } from "vitest";
import {
  SHORT_MAX, LONG_MAX,
  SHORT_CRITERIA, LONG_CRITERIA,
  calculatePenalty, sumScores, applyPenalty,
  pointsToGrade, processGradingResult,
} from "../lib/writingGrading.js";

// ─── Constants ─────────────────────────────────────────────────────────────

describe("Writing grading constants", () => {
  it("short essay max is 35", () => {
    expect(SHORT_MAX).toBe(35);
  });

  it("long essay max is 99", () => {
    expect(LONG_MAX).toBe(99);
  });

  it("short criteria sum to 35", () => {
    expect(SHORT_CRITERIA.content + SHORT_CRITERIA.vocabulary + SHORT_CRITERIA.grammar).toBe(35);
  });

  it("long criteria sum to 99", () => {
    expect(LONG_CRITERIA.content + LONG_CRITERIA.vocabulary + LONG_CRITERIA.grammar).toBe(99);
  });
});

// ─── calculatePenalty ──────────────────────────────────────────────────────

describe("calculatePenalty", () => {
  it("returns 0 when at or above minimum", () => {
    expect(calculatePenalty(200, 160)).toBe(0);
    expect(calculatePenalty(160, 160)).toBe(0);
  });

  it("returns 1 per 10 chars below minimum", () => {
    expect(calculatePenalty(150, 160)).toBe(1);  // 10 under → -1
    expect(calculatePenalty(140, 160)).toBe(2);  // 20 under → -2
    expect(calculatePenalty(100, 160)).toBe(6);  // 60 under → -6
  });

  it("rounds up partial 10s", () => {
    expect(calculatePenalty(155, 160)).toBe(1);  // 5 under → ceil(0.5) = 1
    expect(calculatePenalty(141, 160)).toBe(2);  // 19 under → ceil(1.9) = 2
  });

  it("no over-length penalty", () => {
    expect(calculatePenalty(300, 160)).toBe(0);
  });
});

// ─── sumScores ─────────────────────────────────────────────────────────────

describe("sumScores", () => {
  it("sums all three criteria", () => {
    expect(sumScores({
      content: { score: 12 },
      vocabulary: { score: 8 },
      grammar: { score: 7 },
    })).toBe(27);
  });

  it("handles missing criteria gracefully", () => {
    expect(sumScores({
      content: { score: 10 },
    })).toBe(10);
  });

  it("returns 0 for empty criteria", () => {
    expect(sumScores({})).toBe(0);
  });
});

// ─── applyPenalty ──────────────────────────────────────────────────────────

describe("applyPenalty", () => {
  it("subtracts penalty from raw score", () => {
    expect(applyPenalty(27, 3)).toBe(24);
  });

  it("never goes below 0", () => {
    expect(applyPenalty(5, 10)).toBe(0);
  });

  it("returns raw score when penalty is 0", () => {
    expect(applyPenalty(27, 0)).toBe(27);
  });
});

// ─── pointsToGrade ─────────────────────────────────────────────────────────
// Official YTL absolute thresholds: L≥80%, E≥65%, M≥50%, C≥35%, B≥20%, A≥10%, I<10%

// Thresholds from YTL lyhyt oppimäärä pisterajat (3-year avg): L≥92%, E≥84%, M≥73%, C≥60%, B≥48%, A≥39%
describe("pointsToGrade", () => {
  describe("short essay (max 35)", () => {
    it("0 points → I (0%)", () => expect(pointsToGrade(0, 35)).toBe("I"));
    it("13 points → I (37.1%)", () => expect(pointsToGrade(13, 35)).toBe("I"));    // < 39%
    it("14 points → A (40%)", () => expect(pointsToGrade(14, 35)).toBe("A"));      // ≥ 39%
    it("16 points → A (45.7%)", () => expect(pointsToGrade(16, 35)).toBe("A"));    // < 48%
    it("17 points → B (48.6%)", () => expect(pointsToGrade(17, 35)).toBe("B"));    // ≥ 48%
    it("20 points → B (57.1%)", () => expect(pointsToGrade(20, 35)).toBe("B"));    // < 60%
    it("21 points → C (60%)", () => expect(pointsToGrade(21, 35)).toBe("C"));      // ≥ 60%
    it("25 points → C (71.4%)", () => expect(pointsToGrade(25, 35)).toBe("C"));    // < 73%
    it("26 points → M (74.3%)", () => expect(pointsToGrade(26, 35)).toBe("M"));    // ≥ 73%
    it("29 points → M (82.9%)", () => expect(pointsToGrade(29, 35)).toBe("M"));    // < 84%
    it("30 points → E (85.7%)", () => expect(pointsToGrade(30, 35)).toBe("E"));    // ≥ 84%
    it("31 points → E (88.6%)", () => expect(pointsToGrade(31, 35)).toBe("E"));    // < 92%
    it("33 points → L (94.3%)", () => expect(pointsToGrade(33, 35)).toBe("L"));    // ≥ 92%
    it("35 points → L (100%)", () => expect(pointsToGrade(35, 35)).toBe("L"));
  });

  describe("long essay (max 99)", () => {
    it("0 points → I", () => expect(pointsToGrade(0, 99)).toBe("I"));
    it("38 points → I (38.4%)", () => expect(pointsToGrade(38, 99)).toBe("I"));    // < 39%
    it("39 points → A (39.4%)", () => expect(pointsToGrade(39, 99)).toBe("A"));    // ≥ 39%
    it("47 points → A (47.5%)", () => expect(pointsToGrade(47, 99)).toBe("A"));    // < 48%
    it("48 points → B (48.5%)", () => expect(pointsToGrade(48, 99)).toBe("B"));    // ≥ 48%
    it("59 points → B (59.6%)", () => expect(pointsToGrade(59, 99)).toBe("B"));    // < 60%
    it("60 points → C (60.6%)", () => expect(pointsToGrade(60, 99)).toBe("C"));    // ≥ 60%
    it("72 points → C (72.7%)", () => expect(pointsToGrade(72, 99)).toBe("C"));    // < 73%
    it("73 points → M (73.7%)", () => expect(pointsToGrade(73, 99)).toBe("M"));    // ≥ 73%
    it("83 points → M (83.8%)", () => expect(pointsToGrade(83, 99)).toBe("M"));    // < 84%
    it("84 points → E (84.8%)", () => expect(pointsToGrade(84, 99)).toBe("E"));    // ≥ 84%
    it("91 points → E (91.9%)", () => expect(pointsToGrade(91, 99)).toBe("E"));    // < 92%
    it("92 points → L (92.9%)", () => expect(pointsToGrade(92, 99)).toBe("L"));    // ≥ 92%
    it("99 points → L (100%)", () => expect(pointsToGrade(99, 99)).toBe("L"));
  });
});

// ─── processGradingResult ──────────────────────────────────────────────────

describe("processGradingResult", () => {
  const mockAiResult = {
    criteria: {
      content: { score: 12, max: 15, feedback: "Hyvä sisältö." },
      vocabulary: { score: 7, max: 10, feedback: "Riittävä sanasto." },
      grammar: { score: 6, max: 10, feedback: "Joitain virheitä." },
    },
    errors: [
      { excerpt: "estoy contento", corrected: "soy contento", category: "grammar", explanation: "ser/estar" },
    ],
    positives: ["Hyvä rakenne"],
    overallFeedback: "Jatka harjoittelua.",
  };

  it("calculates correct raw score", () => {
    const result = processGradingResult(mockAiResult, 200, 160, true);
    expect(result.rawScore).toBe(25); // 12 + 7 + 6
  });

  it("applies no penalty when above minimum", () => {
    const result = processGradingResult(mockAiResult, 200, 160, true);
    expect(result.penalty).toBe(0);
    expect(result.finalScore).toBe(25);
  });

  it("applies penalty when below minimum", () => {
    const result = processGradingResult(mockAiResult, 130, 160, true);
    expect(result.penalty).toBe(3); // ceil(30/10) = 3
    expect(result.finalScore).toBe(22); // 25 - 3
  });

  it("sets correct maxScore for short", () => {
    const result = processGradingResult(mockAiResult, 200, 160, true);
    expect(result.maxScore).toBe(35);
  });

  it("sets correct maxScore for long", () => {
    const longResult = {
      criteria: {
        content: { score: 25, max: 33, feedback: "" },
        vocabulary: { score: 20, max: 33, feedback: "" },
        grammar: { score: 22, max: 33, feedback: "" },
      },
      errors: [],
      positives: [],
      overallFeedback: "",
    };
    const result = processGradingResult(longResult, 400, 300, false);
    expect(result.maxScore).toBe(99);
    expect(result.rawScore).toBe(67);
  });

  it("maps score to correct YTL grade", () => {
    const result = processGradingResult(mockAiResult, 200, 160, true);
    // 25/35 = 71.4% → C (≥ 60%, < 73%)
    expect(result.ytlGrade).toBe("C");
  });

  it("preserves errors and positives", () => {
    const result = processGradingResult(mockAiResult, 200, 160, true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].category).toBe("grammar");
    expect(result.positives).toHaveLength(1);
  });

  it("clamps finalScore to 0 with extreme penalty", () => {
    const result = processGradingResult(mockAiResult, 10, 160, true);
    // penalty = ceil(150/10) = 15, rawScore = 25, final = 10
    expect(result.finalScore).toBe(10);

    const result2 = processGradingResult(mockAiResult, 0, 160, true);
    // penalty = ceil(160/10) = 16, rawScore = 25, final = 9
    expect(result2.finalScore).toBe(9);
  });
});
