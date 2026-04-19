import { describe, it, expect } from "vitest";
import {
  computeCoverage,
  computeGradeEstimate,
  SECTIONS,
  MIN_PER_SECTION_FOR_FULL,
  TOTAL_THRESHOLD_PRELIMINARY,
  TOTAL_THRESHOLD_ESTIMATED,
  TOTAL_THRESHOLD_FULL,
} from "../lib/gradeThreshold.js";

// Build a log list: for each mode, `count` logs with the given ytl_grade.
function buildLogs(counts, grade = "C") {
  const logs = [];
  for (const [mode, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) logs.push({ mode, ytl_grade: grade });
  }
  return logs;
}

describe("computeCoverage", () => {
  it("counts logs per section and ignores unknown modes", () => {
    const logs = [
      { mode: "vocab" },
      { mode: "vocab" },
      { mode: "grammar" },
      { mode: "reading" },
      { mode: "writing" },
      { mode: "exam" }, // not a tracked section
    ];
    expect(computeCoverage(logs)).toEqual({
      vocab: 2, grammar: 1, reading: 1, writing: 1,
    });
  });
});

describe("computeGradeEstimate — threshold ladder", () => {
  it("returns tier:none with null grade when total < 10", () => {
    const logs = buildLogs({ vocab: 5, grammar: 4 });
    const est = computeGradeEstimate(logs);
    expect(est.tier).toBe("none");
    expect(est.grade).toBeNull();
    expect(est.total).toBe(9);
  });

  it("9 total exercises across ≤4 sections → null grade / tier none", () => {
    // Plan's ladder: < 10 exercises → null placeholder, regardless of
    // how they're distributed across sections.
    const logs = buildLogs({ vocab: 4, grammar: 5, reading: 0, writing: 0 });
    const est = computeGradeEstimate(logs);
    expect(est.grade).toBeNull();
    expect(est.tier).toBe("none");
  });

  it("returns tier:preliminary when 10 ≤ total < 30", () => {
    const logs = buildLogs({ vocab: 15, grammar: 5 });
    const est = computeGradeEstimate(logs);
    expect(est.tier).toBe("preliminary");
    expect(est.grade).toBe("C");
    expect(est.total).toBe(20);
  });

  it("returns tier:estimated for 30–99 exercises", () => {
    const logs = buildLogs({ vocab: 30, grammar: 20 });
    const est = computeGradeEstimate(logs);
    expect(est.tier).toBe("estimated");
    expect(est.grade).toBe("C");
  });

  it("returns tier:estimated at ≥100 when a section has <10 exercises", () => {
    // 200 vocab / 5 grammar / 0 reading / 0 writing — single-section dataset
    const logs = buildLogs({ vocab: 200, grammar: 5 });
    const est = computeGradeEstimate(logs);
    expect(est.tier).toBe("estimated");
    expect(est.tier).not.toBe("full");
  });

  it("explicit spec: {vocab:50, grammar:50, reading:50, writing:50} → non-null grade, confidence ≥ 3", () => {
    const logs = buildLogs({ vocab: 50, grammar: 50, reading: 50, writing: 50 });
    const est = computeGradeEstimate(logs);
    expect(est.grade).not.toBeNull();
    expect(est.confidence).toBeGreaterThanOrEqual(3);
    expect(est.tier).toBe("full"); // total 200, all sections ≥ 10
  });

  it("returns tier:full only with ≥100 total AND ≥10 in every section", () => {
    const logs = buildLogs({ vocab: 25, grammar: 25, reading: 25, writing: 25 });
    const est = computeGradeEstimate(logs);
    expect(est.tier).toBe("full");
    expect(est.confidence).toBe(5); // 4 sections + bonus for ≥100
  });

  it("confidence is 0 when total < 10", () => {
    const est = computeGradeEstimate(buildLogs({ vocab: 3 }));
    expect(est.confidence).toBe(0);
  });

  it("confidence counts only sections with ≥ 10 exercises", () => {
    // 10 vocab, 10 grammar, 9 reading, 0 writing, total = 29
    const logs = buildLogs({ vocab: 10, grammar: 10, reading: 9 });
    const est = computeGradeEstimate(logs);
    expect(est.tier).toBe("preliminary");
    // 2 sections ≥ 10; no +1 bonus (total < 100)
    expect(est.confidence).toBe(2);
  });
});

describe("computeGradeEstimate — coverage reporting", () => {
  it("always reports coverage object for every section, even if 0", () => {
    const est = computeGradeEstimate([{ mode: "vocab" }]);
    expect(Object.keys(est.coverage).sort()).toEqual(
      [...SECTIONS].sort(),
    );
    expect(est.coverage.writing).toBe(0);
  });
});

describe("computeGradeEstimate — grade averaging", () => {
  it("averages over graded logs (rounded to nearest)", () => {
    // Mix of B(2) and C(3) → avg = 2.5 → rounds to 3 → "C"
    const logs = [
      { mode: "vocab", ytl_grade: "B" },
      { mode: "vocab", ytl_grade: "B" },
      { mode: "vocab", ytl_grade: "C" },
      { mode: "vocab", ytl_grade: "C" },
      { mode: "grammar", ytl_grade: "B" },
      { mode: "grammar", ytl_grade: "C" },
      { mode: "grammar", ytl_grade: "C" },
      { mode: "grammar", ytl_grade: "C" },
      { mode: "reading", ytl_grade: "C" },
      { mode: "reading", ytl_grade: "C" },
    ];
    const est = computeGradeEstimate(logs);
    expect(est.grade).toBe("C");
  });

  it("handles logs without ytl_grade — returns null grade but non-none tier", () => {
    const logs = Array.from({ length: 15 }, () => ({ mode: "vocab" }));
    const est = computeGradeEstimate(logs);
    expect(est.tier).toBe("preliminary");
    expect(est.grade).toBeNull();
  });
});

describe("threshold constants", () => {
  it("matches the plan's ladder exactly", () => {
    expect(TOTAL_THRESHOLD_PRELIMINARY).toBe(10);
    expect(TOTAL_THRESHOLD_ESTIMATED).toBe(30);
    expect(TOTAL_THRESHOLD_FULL).toBe(100);
    expect(MIN_PER_SECTION_FOR_FULL).toBe(10);
  });
});
