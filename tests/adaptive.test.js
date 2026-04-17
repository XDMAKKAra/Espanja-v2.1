import { describe, it, expect } from "vitest";
import {
  LEVEL_ORDER, PROMOTION_THRESHOLDS,
  calculateAvg, calculateStdDev,
  isPromotionReady, isDemotionTriggered,
  computeEligibility, scoreMasteryTest,
} from "../lib/adaptive.js";

// ─── Helpers ───────────────────────────────────────────────────────────────

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function makeEligibility(overrides = {}) {
  return {
    currentLevel: "B",
    sessionPcts: [],
    questionsAtLevel: 0,
    levelStartedAt: daysAgo(1),
    masteryTestEligibleAt: null,
    lastDemotionAt: null,
    sessionsAtLevel: 0,
    adaptiveEnabled: true,
    now: new Date(),
    ...overrides,
  };
}

// ─── calculateAvg ──────────────────────────────────────────────────────────

describe("calculateAvg", () => {
  it("returns 0 for empty array", () => {
    expect(calculateAvg([])).toBe(0);
  });

  it("calculates average correctly", () => {
    expect(calculateAvg([80, 90, 70])).toBe(80);
  });
});

// ─── calculateStdDev ───────────────────────────────────────────────────────

describe("calculateStdDev", () => {
  it("returns 0 for single value", () => {
    expect(calculateStdDev([50])).toBe(0);
  });

  it("returns 0 for identical values", () => {
    expect(calculateStdDev([80, 80, 80])).toBe(0);
  });

  it("calculates standard deviation", () => {
    const sd = calculateStdDev([80, 90, 70]);
    expect(sd).toBeGreaterThan(0);
    expect(sd).toBeLessThan(10);
  });
});

// ─── Promotion ─────────────────────────────────────────────────────────────

describe("isPromotionReady", () => {
  it("returns not ready with insufficient questions", () => {
    const { ready } = isPromotionReady(
      [90, 90, 90, 90, 90],
      PROMOTION_THRESHOLDS["B→C"],
      30, // need 50
      10,
    );
    expect(ready).toBe(false);
  });

  it("returns not ready with insufficient days", () => {
    const { ready } = isPromotionReady(
      [90, 90, 90, 90, 90],
      PROMOTION_THRESHOLDS["B→C"],
      60,
      3, // need 7
    );
    expect(ready).toBe(false);
  });

  it("returns ready when all criteria met for B→C", () => {
    const { ready } = isPromotionReady(
      [90, 85, 80, 82, 88],
      PROMOTION_THRESHOLDS["B→C"],
      60,
      10,
    );
    expect(ready).toBe(true);
  });

  it("returns not ready when one session below min", () => {
    const { ready } = isPromotionReady(
      [90, 90, 90, 90, 30], // 30 < 70 min
      PROMOTION_THRESHOLDS["B→C"],
      60,
      10,
    );
    expect(ready).toBe(false);
  });

  it("returns not ready when stddev too high", () => {
    // High variance: 95, 95, 95, 95, 71 → stddev ~10, avg ~90 — all above min
    // But let's make it worse: 99, 99, 99, 99, 71 → stddev ≈ 11.2
    // Actually we need > 15: try 99, 99, 70, 99, 70 → high variance but some below min
    // Better: all above min but high stddev
    const { ready, progress } = isPromotionReady(
      [98, 72, 98, 72, 98], // avg 87.6, all >= 70, but stddev ≈ 13
      PROMOTION_THRESHOLDS["B→C"],
      60,
      10,
    );
    // stddev of [98,72,98,72,98] ≈ 12.6, under 15, so it should pass
    // Let's use values with higher variance
    const { ready: ready2, progress: prog2 } = isPromotionReady(
      [99, 70, 99, 70, 99], // stddev ≈ 14.6, borderline
      PROMOTION_THRESHOLDS["B→C"],
      60,
      10,
    );
    // With [99,70,99,70,70] → avg 81.6, stddev ≈ 14.3 — should still pass
    // Use extreme: [99, 70, 99, 70, 71] → avg 81.8
    const { ready: ready3 } = isPromotionReady(
      [100, 70, 100, 70, 100], // stddev ≈ 15
      PROMOTION_THRESHOLDS["B→C"],
      60,
      10,
    );
    // stddev is borderline ~15, test with more extreme values
    const { ready: ready4 } = isPromotionReady(
      [100, 70, 100, 70, 70], // lower avg, but test with truly high variance
      PROMOTION_THRESHOLDS["B→C"],
      60,
      10,
    );
    // Use values guaranteed > 15 stddev: [100, 60, 100, 60, 100] → stddev ≈ 20
    const { ready: ready5, progress: prog5 } = isPromotionReady(
      [99, 71, 99, 71, 99], // avg 87.8, all >= 70, stddev ≈ 14.1 → passes
      PROMOTION_THRESHOLDS["B→C"],
      60,
      10,
    );
    // Make stddev clearly > 15
    const { ready: readyFail } = isPromotionReady(
      [100, 100, 100, 72, 72], // avg 88.8, all >= 70, stddev ≈ 14.4
      PROMOTION_THRESHOLDS["B→C"],
      60,
      10,
    );
    // For I→A, minSessionPct is 60, so we can use lower values for more spread
    const { ready: readyClear } = isPromotionReady(
      [100, 100, 60, 60, 60], // stddev ≈ 19.6 > 15, all >= 60 (I→A min)
      PROMOTION_THRESHOLDS["I→A"],
      40,
      5,
    );
    expect(readyClear).toBe(false);
  });
});

// ─── computeEligibility ────────────────────────────────────────────────────

describe("computeEligibility", () => {
  it("new user at B → pending status", () => {
    const result = computeEligibility(makeEligibility());
    expect(result.currentLevel).toBe("B");
    expect(result.status).toBe("pending");
  });

  it("5 sessions 90% B-level, 30 questions → not ready (need 50 Q)", () => {
    const result = computeEligibility(makeEligibility({
      sessionPcts: [90, 90, 90, 90, 90],
      questionsAtLevel: 30,
      sessionsAtLevel: 5,
      levelStartedAt: daysAgo(10),
    }));
    expect(result.status).toBe("pending");
    expect(result.progress.questionsDone).toBe(30);
    expect(result.progress.questionsNeeded).toBe(50);
  });

  it("5 sessions 90% B-level, 60 questions, 3 days → not ready (need 7 days)", () => {
    const result = computeEligibility(makeEligibility({
      sessionPcts: [90, 90, 90, 90, 90],
      questionsAtLevel: 60,
      sessionsAtLevel: 5,
      levelStartedAt: daysAgo(3),
    }));
    expect(result.status).toBe("pending");
    expect(result.progress.daysAtLevel).toBe(3);
    expect(result.progress.daysNeeded).toBe(7);
  });

  it("5 sessions 90% B-level, 60 questions, 10 days → ready_for_mastery_test", () => {
    const result = computeEligibility(makeEligibility({
      sessionPcts: [90, 90, 90, 90, 90],
      questionsAtLevel: 60,
      sessionsAtLevel: 5,
      levelStartedAt: daysAgo(10),
    }));
    expect(result.status).toBe("ready_for_mastery_test");
    expect(result.nextLevel).toBe("C");
  });

  it("4 sessions 90% + 1 session 30% → not ready (min session % fails)", () => {
    const result = computeEligibility(makeEligibility({
      sessionPcts: [90, 90, 90, 90, 30],
      questionsAtLevel: 60,
      sessionsAtLevel: 5,
      levelStartedAt: daysAgo(10),
    }));
    expect(result.status).toBe("pending");
    expect(result.progress.minSessionPctOk).toBe(false);
  });

  it("high stddev despite high avg → not ready", () => {
    // Use I→A thresholds where minSessionPct=60, allowing wider spread
    const result = computeEligibility(makeEligibility({
      currentLevel: "I",
      sessionPcts: [100, 100, 60, 60, 60], // avg 76 >= 70, all >= 60, stddev ≈ 19.6 > 15
      questionsAtLevel: 40,
      sessionsAtLevel: 5,
      levelStartedAt: daysAgo(5),
    }));
    expect(result.status).toBe("pending");
    expect(result.progress.consistencyOk).toBe(false);
  });

  it("cooldown after failed mastery test", () => {
    const result = computeEligibility(makeEligibility({
      sessionPcts: [90, 90, 90, 90, 90],
      questionsAtLevel: 60,
      sessionsAtLevel: 5,
      levelStartedAt: daysAgo(10),
      masteryTestEligibleAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    }));
    expect(result.status).toBe("on_cooldown");
  });

  it("at L level → stable", () => {
    const result = computeEligibility(makeEligibility({
      currentLevel: "L",
      sessionPcts: [90, 90, 90],
      questionsAtLevel: 200,
      levelStartedAt: daysAgo(30),
    }));
    expect(result.status).toBe("stable");
  });

  it("adaptive disabled → stable", () => {
    const result = computeEligibility(makeEligibility({
      adaptiveEnabled: false,
    }));
    expect(result.status).toBe("stable");
  });
});

// ─── Demotion ──────────────────────────────────────────────────────────────

describe("isDemotionTriggered", () => {
  it("triggers when 8 sessions avg < 45% and 14+ days", () => {
    const pcts = [30, 40, 35, 30, 40, 35, 30, 40]; // avg 35%
    expect(isDemotionTriggered(pcts, 20, null, 10)).toBe(true);
  });

  it("does NOT trigger when level_started_at < 14 days (just promoted)", () => {
    const pcts = [30, 40, 35, 30, 40, 35, 30, 40];
    expect(isDemotionTriggered(pcts, 5, null, 10)).toBe(false);
  });

  it("does NOT trigger when lastDemotion < 14 days ago", () => {
    const pcts = [30, 40, 35, 30, 40, 35, 30, 40];
    expect(isDemotionTriggered(pcts, 20, daysAgo(5), 10)).toBe(false);
  });

  it("does NOT trigger when fewer than 5 sessions at level", () => {
    const pcts = [30, 40, 35, 30, 40, 35, 30, 40];
    expect(isDemotionTriggered(pcts, 20, null, 4)).toBe(false);
  });

  it("does NOT trigger when avg >= 45%", () => {
    const pcts = [50, 50, 50, 50, 50, 50, 50, 50]; // avg 50%
    expect(isDemotionTriggered(pcts, 20, null, 10)).toBe(false);
  });

  it("does NOT trigger when fewer than 6/8 bad sessions", () => {
    // 5 bad, 3 good → only 5 < 55% → not enough
    const pcts = [30, 30, 30, 30, 30, 80, 80, 80]; // avg 47.5 but only 5 bad
    expect(isDemotionTriggered(pcts, 20, null, 10)).toBe(false);
  });

  it("computeEligibility returns needs_demotion", () => {
    const result = computeEligibility(makeEligibility({
      currentLevel: "C",
      sessionPcts: [30, 40, 35, 30, 40, 35, 30, 40],
      questionsAtLevel: 100,
      sessionsAtLevel: 10,
      levelStartedAt: daysAgo(20),
    }));
    expect(result.status).toBe("needs_demotion");
    expect(result.nextLevel).toBe("B");
  });

  it("demotion does NOT trigger at I level", () => {
    const result = computeEligibility(makeEligibility({
      currentLevel: "I",
      sessionPcts: [30, 40, 35, 30, 40, 35, 30, 40],
      questionsAtLevel: 100,
      sessionsAtLevel: 10,
      levelStartedAt: daysAgo(20),
    }));
    // At I level, there's no lower level, so status should not be needs_demotion
    expect(result.status).not.toBe("needs_demotion");
  });
});

// ─── Parametric: M→E requires stricter criteria than B→C ───────────────────

describe("Asymmetric thresholds (parametric)", () => {
  const transitions = ["I→A", "A→B", "B→C", "C→M", "M→E", "E→L"];

  it("each transition has increasing minQuestions", () => {
    for (let i = 1; i < transitions.length; i++) {
      const prev = PROMOTION_THRESHOLDS[transitions[i - 1]];
      const curr = PROMOTION_THRESHOLDS[transitions[i]];
      expect(curr.minQuestions).toBeGreaterThan(prev.minQuestions);
    }
  });

  it("each transition has increasing minAvgPct", () => {
    for (let i = 1; i < transitions.length; i++) {
      const prev = PROMOTION_THRESHOLDS[transitions[i - 1]];
      const curr = PROMOTION_THRESHOLDS[transitions[i]];
      expect(curr.minAvgPct).toBeGreaterThanOrEqual(prev.minAvgPct);
    }
  });

  it("each transition has increasing minDays", () => {
    for (let i = 1; i < transitions.length; i++) {
      const prev = PROMOTION_THRESHOLDS[transitions[i - 1]];
      const curr = PROMOTION_THRESHOLDS[transitions[i]];
      expect(curr.minDays).toBeGreaterThan(prev.minDays);
    }
  });

  it("each transition has increasing minSessions", () => {
    for (let i = 1; i < transitions.length; i++) {
      const prev = PROMOTION_THRESHOLDS[transitions[i - 1]];
      const curr = PROMOTION_THRESHOLDS[transitions[i]];
      expect(curr.minSessions).toBeGreaterThanOrEqual(prev.minSessions);
    }
  });

  it("M→E is strictly harder than B→C", () => {
    const bc = PROMOTION_THRESHOLDS["B→C"];
    const me = PROMOTION_THRESHOLDS["M→E"];
    expect(me.minAvgPct).toBeGreaterThan(bc.minAvgPct);
    expect(me.minQuestions).toBeGreaterThan(bc.minQuestions);
    expect(me.minSessions).toBeGreaterThan(bc.minSessions);
    expect(me.minDays).toBeGreaterThan(bc.minDays);
  });

  it("E→L is strictly harder than M→E", () => {
    const me = PROMOTION_THRESHOLDS["M→E"];
    const el = PROMOTION_THRESHOLDS["E→L"];
    expect(el.minAvgPct).toBeGreaterThan(me.minAvgPct);
    expect(el.minQuestions).toBeGreaterThan(me.minQuestions);
    expect(el.minDays).toBeGreaterThan(me.minDays);
  });
});

// ─── Level never skips ─────────────────────────────────────────────────────

describe("Level never skips", () => {
  it("B cannot jump to M even with 100% score", () => {
    const result = computeEligibility(makeEligibility({
      currentLevel: "B",
      sessionPcts: [100, 100, 100, 100, 100],
      questionsAtLevel: 200,
      sessionsAtLevel: 20,
      levelStartedAt: daysAgo(30),
    }));
    // Can only go to C, never M
    expect(result.nextLevel).toBe("C");
    expect(result.status).toBe("ready_for_mastery_test");
  });
});

// ─── Mastery test scoring ──────────────────────────────────────────────────

describe("scoreMasteryTest", () => {
  it("passes when >= 70% total and >= 60% higher level", () => {
    const answers = [
      // 6 higher level: 4 correct
      { correct: true, isHigherLevel: true },
      { correct: true, isHigherLevel: true },
      { correct: true, isHigherLevel: true },
      { correct: true, isHigherLevel: true },
      { correct: false, isHigherLevel: true },
      { correct: false, isHigherLevel: true },
      // 4 current level: 4 correct
      { correct: true, isHigherLevel: false },
      { correct: true, isHigherLevel: false },
      { correct: true, isHigherLevel: false },
      { correct: true, isHigherLevel: false },
    ];
    const result = scoreMasteryTest(answers);
    expect(result.scorePct).toBe(80);
    expect(result.higherLevelPct).toBe(67); // 4/6 ≈ 67
    expect(result.passed).toBe(true);
  });

  it("fails when total < 70%", () => {
    const answers = Array(10).fill(null).map((_, i) => ({
      correct: i < 5, // 50%
      isHigherLevel: i < 6,
    }));
    const result = scoreMasteryTest(answers);
    expect(result.passed).toBe(false);
  });

  it("fails when higher level < 60%", () => {
    const answers = [
      // 6 higher: 3 correct (50%)
      ...Array(3).fill({ correct: true, isHigherLevel: true }),
      ...Array(3).fill({ correct: false, isHigherLevel: true }),
      // 4 current: all correct
      ...Array(4).fill({ correct: true, isHigherLevel: false }),
    ];
    const result = scoreMasteryTest(answers);
    expect(result.scorePct).toBe(70); // 7/10
    expect(result.higherLevelPct).toBe(50); // 3/6
    expect(result.passed).toBe(false);
  });

  it("mastery test passed → level would update", () => {
    const result = scoreMasteryTest([
      ...Array(6).fill({ correct: true, isHigherLevel: true }),
      ...Array(4).fill({ correct: true, isHigherLevel: false }),
    ]);
    expect(result.passed).toBe(true);
    expect(result.scorePct).toBe(100);
    expect(result.higherLevelPct).toBe(100);
  });
});
