// L-V399 C3 — characterization test for lib/lessonContext.js pure functions.
// Locks the current behavior of the previously-uncovered happy path so any
// future split/refactor of this critical curriculum-context lib is provably
// behavior-preserving. Async DB-backed functions (resolveLessonContext,
// buildReviewTopics, fetchTargetGrade) are intentionally out of scope here —
// they need a Supabase mock; these are the deterministic pure builders.
import { describe, it, expect } from "vitest";
import {
  multiplierFor,
  passThresholdFor,
  applyTargetMultiplier,
  buildLevelDirective,
  curriculumFocusInstruction,
  curriculumTestInstruction,
  TARGET_GRADE_MULTIPLIERS,
  TARGET_GRADE_PASS_THRESHOLDS,
  VALID_TARGET_GRADES,
} from "../lib/lessonContext.js";

function ctx(overrides = {}) {
  return {
    lesson: { sort_order: 4, type: "grammar", focus: "preteriti -ar verbit", exercise_count: 8, ...overrides.lesson },
    kurssi: { key: "kurssi_2", title: "Arki ja vapaa-aika", level: "B", grammar_focus: ["preteriti", "imperfekti"], ...overrides.kurssi },
    levelDirective: overrides.levelDirective ?? "",
    isDeepen: overrides.isDeepen ?? false,
    reviewTopics: overrides.reviewTopics ?? [],
  };
}

describe("multiplier + threshold tables", () => {
  it("VALID_TARGET_GRADES is the canonical YTL ladder", () => {
    expect(VALID_TARGET_GRADES).toEqual(["I", "A", "B", "C", "M", "E", "L"]);
  });

  it("multiplierFor returns the per-grade multiplier, 1.0 fallback", () => {
    expect(multiplierFor("I")).toBe(0.7);
    expect(multiplierFor("B")).toBe(1.0);
    expect(multiplierFor("L")).toBe(1.5);
    expect(multiplierFor("X")).toBe(1.0);
    expect(multiplierFor(undefined)).toBe(1.0);
    expect(multiplierFor("M")).toBe(TARGET_GRADE_MULTIPLIERS.M);
  });

  it("passThresholdFor returns the per-grade threshold, 0.8 fallback", () => {
    expect(passThresholdFor("I")).toBe(0.7);
    expect(passThresholdFor("E")).toBe(0.9);
    expect(passThresholdFor("X")).toBe(0.8);
    expect(passThresholdFor("C")).toBe(TARGET_GRADE_PASS_THRESHOLDS.C);
  });

  it("applyTargetMultiplier rounds and clamps to >= 1", () => {
    expect(applyTargetMultiplier(8, "L")).toBe(12); // 8 * 1.5
    expect(applyTargetMultiplier(8, "I")).toBe(6);  // round(5.6)
    expect(applyTargetMultiplier(8, "B")).toBe(8);  // 1.0
    expect(applyTargetMultiplier(8, "X")).toBe(8);  // fallback 1.0
    expect(applyTargetMultiplier(0, "B")).toBe(1);  // clamp
    expect(applyTargetMultiplier(null, "L")).toBe(1);
  });
});

describe("buildLevelDirective", () => {
  it("returns empty when target == kurssi level or a side is missing", () => {
    expect(buildLevelDirective("B", "B")).toBe("");
    expect(buildLevelDirective(null, "B")).toBe("");
    expect(buildLevelDirective("B", null)).toBe("");
    expect(buildLevelDirective("ZZ", "B")).toBe(""); // unknown grade
  });

  it("ratchets difficulty up when target above kurssi level", () => {
    const d = buildLevelDirective("L", "B");
    expect(d).toContain("VAIKEUSTASO:");
    expect(d).toContain("rikkaampaa sanastoa");
    expect(d).toContain("Oppilaan tavoite on L");
  });

  it("ratchets difficulty down when target below kurssi level", () => {
    const d = buildLevelDirective("I", "C");
    expect(d).toContain("VAIKEUSTASO:");
    expect(d).toContain("yksinkertaisempana");
  });
});

describe("curriculumFocusInstruction", () => {
  it("returns empty string for falsy ctx", () => {
    expect(curriculumFocusInstruction(null)).toBe("");
  });

  it("emits the recognition→production split bounds for n=8", () => {
    const out = curriculumFocusInstruction(ctx());
    expect(out).toContain("TÄRKEÄ — KURSSI-KONTEKSTI:");
    expect(out).toContain("preteriti -ar verbit");
    expect(out).toContain("Tehtävät 1–3"); // recogEnd
    expect(out).toContain("Tehtävät 4–5"); // guided
    expect(out).toContain("Tehtävät 6–8"); // production
  });

  it("uses adjusted_exercise_count when present (L = 12 → 4/4/4)", () => {
    const out = curriculumFocusInstruction(ctx({ lesson: { adjusted_exercise_count: 12 } }));
    expect(out).toContain("Tehtävät 1–4");
    expect(out).toContain("Tehtävät 5–8");
    expect(out).toContain("Tehtävät 9–12");
  });

  it("switches to the deepen branch when isDeepen", () => {
    const out = curriculumFocusInstruction(ctx({ isDeepen: true }));
    expect(out).toContain("SYVENNYSKIERROS");
    expect(out).not.toContain("TEHTÄVÄJÄRJESTYS");
  });

  it("adds the internal/cross/sr review sections + topic_key directive", () => {
    const out = curriculumFocusInstruction(ctx({
      reviewTopics: [
        { slot: "internal", focus: "artikkelit", source: "kurssi_2_lesson_1" },
        { slot: "crossKurssi", focus: "olla-verbi", source: "kurssi_1_review" },
        { slot: "sr", focus: "lukusanat", source: "kurssi_1_lesson_3" },
      ],
    }));
    expect(out).toContain("KERTAUS — SISÄINEN");
    expect(out).toContain("KERTAUS — EDELLINEN KURSSI");
    expect(out).toContain("HENKILÖKOHTAINEN KERTAUS");
    expect(out).toContain("TOPIC-AVAIMET");
    expect(out).toContain("artikkelit");
  });

  it("omits the topic_key directive when there are no review topics", () => {
    const out = curriculumFocusInstruction(ctx());
    expect(out).not.toContain("TOPIC-AVAIMET");
  });
});

describe("curriculumTestInstruction", () => {
  it("returns empty string for falsy ctx", () => {
    expect(curriculumTestInstruction(null)).toBe("");
  });

  it("emits the item-type mix counts for n=15 and lists kurssi topics", () => {
    const out = curriculumTestInstruction(ctx({ lesson: { type: "test", exercise_count: 15 } }));
    expect(out).toContain("KERTAUSTESTI");
    expect(out).toContain("Generoi yhteensä 15 kysymystä");
    expect(out).toContain("mc (monivalinta): ~47 % → 7 kpl");
    expect(out).toContain("gap_fill");
    expect(out).toContain("preteriti, imperfekti"); // grammar_focus joined
  });

  it("defaults the typed/translate direction to fi_to_es for Spanish kurssit", () => {
    // Spanish kurssi metadata carries none of the German/French trigger
    // substrings inferKurssiLanguage() scans for, so it falls through to
    // the Spanish default. (Note: "imperfekti" would falsely match the
    // German "perfekt" substring — a known quirk of the current heuristic
    // that this characterization test deliberately documents rather than
    // asserts against.)
    const out = curriculumTestInstruction(ctx({
      lesson: { type: "test", exercise_count: 15 },
      kurssi: { title: "Arki ja vapaa-aika", grammar_focus: ["ser_estar", "presente"], level: "B" },
    }));
    expect(out).toContain('direction: "fi_to_es"');
  });

  it("infers fi_to_de from German kurssi metadata", () => {
    const out = curriculumTestInstruction(ctx({
      lesson: { type: "test", exercise_count: 15 },
      kurssi: { title: "Alltag", grammar_focus: ["praeteritum", "perfekt"], level: "B" },
    }));
    expect(out).toContain('direction: "fi_to_de"');
  });

  it("honours an explicit language argument over inference", () => {
    const out = curriculumTestInstruction(ctx({ lesson: { type: "test", exercise_count: 15 } }), "french");
    expect(out).toContain('direction: "fi_to_fr"');
  });
});
