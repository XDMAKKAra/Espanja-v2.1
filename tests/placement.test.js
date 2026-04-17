import { describe, it, expect } from "vitest";
import { scorePlacementTest, suggestModeLevels } from "../lib/placement.js";
import { selectDiagnosticQuestions, PLACEMENT_QUESTIONS } from "../lib/placementQuestions.js";

describe("scorePlacementTest", () => {
  it("returns A when only A-level correct", () => {
    const answers = [
      { level: "A", correct: true },
      { level: "A", correct: true },
      { level: "B", correct: false },
      { level: "B", correct: false },
      { level: "C", correct: false },
      { level: "C", correct: false },
      { level: "M", correct: false },
      { level: "M", correct: false },
    ];
    const result = scorePlacementTest(answers);
    expect(result.placementLevel).toBe("A");
    expect(result.totalCorrect).toBe(2);
    expect(result.totalQuestions).toBe(8);
    expect(result.alternativeLevel).toBeNull();
  });

  it("returns B when A and B correct (75%+)", () => {
    const answers = [
      { level: "A", correct: true },
      { level: "A", correct: true },
      { level: "B", correct: true },
      { level: "B", correct: true },
      { level: "C", correct: false },
      { level: "C", correct: true },
      { level: "M", correct: false },
      { level: "M", correct: false },
    ];
    const result = scorePlacementTest(answers);
    expect(result.placementLevel).toBe("B");
    expect(result.alternativeLevel).toBe("A");
  });

  it("returns C when A, B, and C all >= 75%", () => {
    const answers = [
      { level: "A", correct: true },
      { level: "A", correct: true },
      { level: "B", correct: true },
      { level: "B", correct: true },
      { level: "C", correct: true },
      { level: "C", correct: true },
      { level: "M", correct: false },
      { level: "M", correct: true },
    ];
    const result = scorePlacementTest(answers);
    expect(result.placementLevel).toBe("C");
    expect(result.alternativeLevel).toBe("B");
  });

  it("returns M when all levels >= 75%", () => {
    const answers = [
      { level: "A", correct: true },
      { level: "A", correct: true },
      { level: "B", correct: true },
      { level: "B", correct: true },
      { level: "C", correct: true },
      { level: "C", correct: true },
      { level: "M", correct: true },
      { level: "M", correct: true },
    ];
    const result = scorePlacementTest(answers);
    expect(result.placementLevel).toBe("M");
    expect(result.alternativeLevel).toBe("C");
    expect(result.totalCorrect).toBe(8);
  });

  it("handles 50% at a level as not passing", () => {
    const answers = [
      { level: "A", correct: true },
      { level: "A", correct: true },
      { level: "B", correct: true },
      { level: "B", correct: false }, // 50% at B — not enough
      { level: "C", correct: false },
      { level: "C", correct: false },
      { level: "M", correct: false },
      { level: "M", correct: false },
    ];
    const result = scorePlacementTest(answers);
    expect(result.placementLevel).toBe("A");
  });

  it("calculates scoreByLevel percentages correctly", () => {
    const answers = [
      { level: "A", correct: true },
      { level: "A", correct: false },
      { level: "B", correct: true },
      { level: "B", correct: true },
      { level: "C", correct: false },
      { level: "C", correct: true },
      { level: "M", correct: false },
      { level: "M", correct: false },
    ];
    const result = scorePlacementTest(answers);
    expect(result.scoreByLevel.A.pct).toBe(50);
    expect(result.scoreByLevel.B.pct).toBe(100);
    expect(result.scoreByLevel.C.pct).toBe(50);
    expect(result.scoreByLevel.M.pct).toBe(0);
  });
});

describe("suggestModeLevels", () => {
  it("sets vocab/grammar to placement level", () => {
    const levels = suggestModeLevels("C");
    expect(levels.vocab).toBe("C");
    expect(levels.grammar).toBe("C");
  });

  it("sets reading/writing one level below placement", () => {
    const levels = suggestModeLevels("C");
    expect(levels.reading).toBe("B");
    expect(levels.writing).toBe("B");
  });

  it("clamps reading/writing at A for A placement", () => {
    const levels = suggestModeLevels("A");
    expect(levels.reading).toBe("A");
    expect(levels.writing).toBe("A");
  });
});

describe("selectDiagnosticQuestions", () => {
  it("returns 8 questions by default", () => {
    const qs = selectDiagnosticQuestions(null, 8);
    expect(qs.length).toBe(8);
  });

  it("returns questions from all 4 levels", () => {
    const qs = selectDiagnosticQuestions(null, 8);
    const levels = new Set(qs.map(q => q.level));
    expect(levels.has("A")).toBe(true);
    expect(levels.has("B")).toBe(true);
    expect(levels.has("C")).toBe(true);
    expect(levels.has("M")).toBe(true);
  });

  it("focuses around reported grade when given", () => {
    const qs = selectDiagnosticQuestions("C", 8);
    const cCount = qs.filter(q => q.level === "C").length;
    expect(cCount).toBeGreaterThanOrEqual(2);
  });

  it("has 2 per level in default distribution", () => {
    const qs = selectDiagnosticQuestions(null, 8);
    for (const level of ["A", "B", "C", "M"]) {
      expect(qs.filter(q => q.level === level).length).toBe(2);
    }
  });

  it("all questions have required fields", () => {
    for (const q of PLACEMENT_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.level).toBeDefined();
      expect(q.question).toBeDefined();
      expect(q.options).toHaveLength(4);
      expect(q.correct).toMatch(/^[ABCD]$/);
      expect(q.explanation).toBeDefined();
    }
  });

  it("has 5 questions per level in the bank", () => {
    for (const level of ["A", "B", "C", "M"]) {
      const count = PLACEMENT_QUESTIONS.filter(q => q.level === level).length;
      expect(count).toBe(5);
    }
  });
});
