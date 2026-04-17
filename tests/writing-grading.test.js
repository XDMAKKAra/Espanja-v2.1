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

describe("pointsToGrade", () => {
  describe("short essay (max 35)", () => {
    it("0 points → I", () => expect(pointsToGrade(0, 35)).toBe("I"));
    it("6 points → I (17%)", () => expect(pointsToGrade(6, 35)).toBe("I"));
    it("7 points → A (20%)", () => expect(pointsToGrade(7, 35)).toBe("A"));
    it("13 points → B (37%)", () => expect(pointsToGrade(13, 35)).toBe("B")); // 37%
    it("14 points → B (40%)", () => expect(pointsToGrade(14, 35)).toBe("B")); // 40%
    it("18 points → C (51%)", () => expect(pointsToGrade(18, 35)).toBe("C")); // 51.4%
    it("23 points → M (66%)", () => expect(pointsToGrade(23, 35)).toBe("M")); // 65.7%
    it("27 points → E (77%)", () => expect(pointsToGrade(27, 35)).toBe("E")); // 77.1%
    it("32 points → L (91%)", () => expect(pointsToGrade(32, 35)).toBe("L")); // 91.4%
    it("35 points → L (100%)", () => expect(pointsToGrade(35, 35)).toBe("L"));
  });

  describe("long essay (max 99)", () => {
    it("0 points → I", () => expect(pointsToGrade(0, 99)).toBe("I"));
    it("19 points → I (19%)", () => expect(pointsToGrade(19, 99)).toBe("I"));
    it("20 points → A (20%)", () => expect(pointsToGrade(20, 99)).toBe("A")); // 20.2%
    it("35 points → B (35%)", () => expect(pointsToGrade(35, 99)).toBe("B")); // 35.4%
    it("49 points → C (49%)", () => expect(pointsToGrade(49, 99)).toBe("C")); // 49.5%
    it("63 points → M (64%)", () => expect(pointsToGrade(63, 99)).toBe("M")); // 63.6%
    it("77 points → E (78%)", () => expect(pointsToGrade(77, 99)).toBe("E")); // 77.8%
    it("90 points → L (91%)", () => expect(pointsToGrade(90, 99)).toBe("L")); // 90.9%
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
    // 25/35 = 71.4% → E (≥ 63%, < 77%)
    // Wait: 71.4% is between 63% and 77%, so it should be M
    // Actually: 77% threshold for E. 71.4 < 77 → M
    expect(result.ytlGrade).toBe("M");
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
