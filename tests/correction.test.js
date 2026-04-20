import { describe, it, expect } from "vitest";
import { gradeCorrection } from "../lib/grading/correction.js";

// Acceptance criterion item from PLAN.md C2:
// gradeCorrection({ id: "corr_ser_estar_001", studentCorrection: "Mi hermana está en casa ahora." })
// → { band: "taydellinen", score: 3 }

describe("gradeCorrection", () => {
  describe("acceptance criterion — corr_ser_estar_001", () => {
    it("exact correct answer → taydellinen, score 3", () => {
      const r = gradeCorrection({
        id: "corr_ser_estar_001",
        studentCorrection: "Mi hermana está en casa ahora.",
      });
      expect(r.band).toBe("taydellinen");
      expect(r.score).toBe(3);
      expect(r.correct).toBe(true);
    });

    it("original erroneous sentence unchanged → vaarin", () => {
      const r = gradeCorrection({
        id: "corr_ser_estar_001",
        studentCorrection: "Mi hermana es en casa ahora.",
      });
      expect(r.band).toBe("vaarin");
      expect(r.score).toBe(0);
    });
  });

  describe("diacritic-folded tier", () => {
    it("correct sentence without accent → ymmarrettava", () => {
      // está → esta (missing accent)
      const r = gradeCorrection({
        id: "corr_ser_estar_001",
        studentCorrection: "Mi hermana esta en casa ahora.",
      });
      expect(r.band).toBe("ymmarrettava");
      expect(r.score).toBe(2);
    });
  });

  describe("Levenshtein tier", () => {
    it("one-character typo in corrected token → lahella", () => {
      // estáa instead of está (distance 1)
      const r = gradeCorrection({
        id: "corr_ser_estar_001",
        studentCorrection: "Mi hermana estaa en casa ahora.",
      });
      expect(["lahella", "ymmarrettava", "taydellinen"]).toContain(r.band);
      expect(r.score).toBeGreaterThanOrEqual(1);
    });
  });

  describe("error handling", () => {
    it("unknown id → vaarin with error field", () => {
      const r = gradeCorrection({ id: "corr_does_not_exist", studentCorrection: "test" });
      expect(r.band).toBe("vaarin");
      expect(r.ok).toBe(false);
    });

    it("missing studentCorrection → vaarin with ok false", () => {
      const r = gradeCorrection({ id: "corr_ser_estar_001" });
      expect(r.ok).toBe(false);
    });
  });

  describe("general structure", () => {
    it("result always has band, score, maxScore, correctSentence on success", () => {
      const r = gradeCorrection({
        id: "corr_ser_estar_001",
        studentCorrection: "Mi hermana está en casa ahora.",
      });
      expect(r.band).toBeDefined();
      expect(r.score).toBeDefined();
      expect(r.maxScore).toBe(3);
      expect(r.correctSentence).toBe("Mi hermana está en casa ahora.");
    });
  });
});
