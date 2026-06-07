// L-V399 C3 — characterization test for the dashboard motivation picker
// extracted from js/screens/dashboard.js into js/features/motivation.js.
// Locks the bucket-selection thresholds so the behavior-preserving move is
// provable. pickMotivation rotates the line by UTC day, so we assert the
// returned string is a member of the bucket the thresholds select.
import { describe, it, expect } from "vitest";
import { pickMotivation, MOTIVATION } from "../js/features/motivation.js";

describe("pickMotivation bucket selection", () => {
  const cases = [
    { streak: 0, total: 0, bucket: "zero", note: "no sessions at all" },
    { streak: 5, total: 0, bucket: "zero", note: "totalSessions=0 wins over streak" },
    { streak: 0, total: 4, bucket: "zeroStreak", note: "has sessions but streak broken" },
    { streak: 1, total: 10, bucket: "ones", note: "1-2 day streak" },
    { streak: 2, total: 10, bucket: "ones" },
    { streak: 3, total: 10, bucket: "threes" },
    { streak: 6, total: 10, bucket: "threes", note: "up to 6 is still threes" },
    { streak: 7, total: 10, bucket: "weeks", note: "7-13 is weeks" },
    { streak: 13, total: 10, bucket: "weeks" },
    { streak: 14, total: 10, bucket: "months", note: "14-29 is months" },
    { streak: 29, total: 10, bucket: "months" },
    { streak: 30, total: 10, bucket: "marathon", note: "30+ is marathon" },
    { streak: 99, total: 10, bucket: "marathon" },
  ];

  for (const { streak, total, bucket, note } of cases) {
    it(`streak=${streak} total=${total} → ${bucket}${note ? ` (${note})` : ""}`, () => {
      const line = pickMotivation(streak, total);
      expect(MOTIVATION[bucket]).toContain(line);
    });
  }

  it("defaults both args to 0 → zero bucket", () => {
    expect(MOTIVATION.zero).toContain(pickMotivation());
  });

  it("always returns a non-empty string", () => {
    expect(typeof pickMotivation(3, 10)).toBe("string");
    expect(pickMotivation(3, 10).length).toBeGreaterThan(0);
  });
});
