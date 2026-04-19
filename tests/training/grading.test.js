import { describe, it, expect } from "vitest";
import {
  stripAccents,
  normalizeAnswer,
  gradeGapFill,
  gradeMultipleChoice,
  gradeMatchingPair,
  gradeReorder,
  isTranslationAccepted,
  isTranslationPartial,
  translationBand,
  TRANSLATION_BAND_LABELS,
  gradeShortAnswer,
  pointsToYoGrade,
} from "../../js/features/answerGrading.js";

// These tests pin the CURRENT semantics of grading helpers. If a behavior change is
// intended, update both the helper and the test, and call it out in FINDINGS.md.

describe("stripAccents / normalizeAnswer", () => {
  it("strips Spanish diacritics", () => {
    expect(stripAccents("está")).toBe("esta");
    expect(stripAccents("ñoño")).toBe("nono");
    expect(stripAccents("camión")).toBe("camion");
    expect(stripAccents("después")).toBe("despues");
  });

  it("normalizeAnswer lower-cases, strips, and trims", () => {
    expect(normalizeAnswer("  ESTÁ  ")).toBe("esta");
    expect(normalizeAnswer("Después")).toBe("despues");
    expect(normalizeAnswer(null)).toBe("");
    expect(normalizeAnswer(undefined)).toBe("");
  });
});

describe("gradeGapFill", () => {
  const answer = "está";
  const alts = ["es"];

  it("perfect match → isCorrect, no accent flag", () => {
    expect(gradeGapFill("está", answer, alts)).toEqual({ isCorrect: true, isAccentError: false });
  });

  it("case-insensitive match → isCorrect", () => {
    expect(gradeGapFill("ESTÁ", answer, alts)).toEqual({ isCorrect: true, isAccentError: false });
  });

  it("missing accent → NOT correct, but isAccentError true", () => {
    expect(gradeGapFill("esta", answer, alts)).toEqual({ isCorrect: false, isAccentError: true });
  });

  it("trailing whitespace is trimmed before comparison", () => {
    expect(gradeGapFill("  está  ", answer, alts)).toEqual({ isCorrect: true, isAccentError: false });
  });

  it("alternative answer matches as correct", () => {
    expect(gradeGapFill("es", answer, alts)).toEqual({ isCorrect: true, isAccentError: false });
  });

  it("alternative answer with accent variant counts as correct (not accent-error)", () => {
    expect(gradeGapFill("es", answer, ["és"])).toEqual({ isCorrect: true, isAccentError: false });
  });

  it("empty input → both false", () => {
    expect(gradeGapFill("", answer, alts)).toEqual({ isCorrect: false, isAccentError: false });
    expect(gradeGapFill("   ", answer, alts)).toEqual({ isCorrect: false, isAccentError: false });
  });

  it("wrong word → both false", () => {
    expect(gradeGapFill("hola", answer, alts)).toEqual({ isCorrect: false, isAccentError: false });
  });

  it("wrong gender article → currently false (NO tolerance — see FINDINGS)", () => {
    // User writes "una" when answer is "un". Today: marked wrong. A permissive pass
    // could accept with a soft warning. Pinning current behavior.
    expect(gradeGapFill("una", "un").isCorrect).toBe(false);
  });

  it("single-letter typo → currently false (NO levenshtein tolerance — FINDINGS)", () => {
    expect(gradeGapFill("esto", "esta").isCorrect).toBe(false);
  });
});

describe("gradeMultipleChoice", () => {
  it("matches letter exactly", () => {
    expect(gradeMultipleChoice("A", "A")).toBe(true);
    expect(gradeMultipleChoice("B", "A")).toBe(false);
  });
  it("trims surrounding whitespace but is case-sensitive", () => {
    expect(gradeMultipleChoice(" A ", "A")).toBe(true);
    expect(gradeMultipleChoice("a", "A")).toBe(false); // pin: case-sensitive today
  });
});

describe("gradeMatchingPair", () => {
  it("case-insensitive equality on both sides", () => {
    expect(gradeMatchingPair("Hola", "Hei", "hola", "hei")).toBe(true);
    expect(gradeMatchingPair("Hola", "Moi", "hola", "hei")).toBe(false);
  });
});

describe("gradeReorder", () => {
  it("correct word order passes", () => {
    expect(gradeReorder(["Me", "llamo", "Juan"], ["me", "llamo", "juan"])).toBe(true);
  });
  it("wrong order fails", () => {
    expect(gradeReorder(["llamo", "Me", "Juan"], ["me", "llamo", "juan"])).toBe(false);
  });
  it("length mismatch fails", () => {
    expect(gradeReorder(["Me", "llamo"], ["me", "llamo", "juan"])).toBe(false);
  });
});

describe("isTranslationAccepted", () => {
  it("accepts score >= 2", () => {
    expect(isTranslationAccepted(3)).toBe(true);
    expect(isTranslationAccepted(2)).toBe(true);
  });
  it("rejects score < 2", () => {
    expect(isTranslationAccepted(1)).toBe(false);
    expect(isTranslationAccepted(0)).toBe(false);
  });
  it("rejects non-numeric", () => {
    expect(isTranslationAccepted(null)).toBe(false);
    expect(isTranslationAccepted(undefined)).toBe(false);
    expect(isTranslationAccepted(NaN)).toBe(false);
  });
});

describe("isTranslationPartial (Commit 14)", () => {
  it("true only at score 1", () => {
    expect(isTranslationPartial(1)).toBe(true);
    expect(isTranslationPartial(0)).toBe(false);
    expect(isTranslationPartial(2)).toBe(false);
    expect(isTranslationPartial(3)).toBe(false);
  });
  it("rejects non-numeric", () => {
    expect(isTranslationPartial(null)).toBe(false);
    expect(isTranslationPartial(NaN)).toBe(false);
  });
});

describe("translationBand (Commit 14)", () => {
  it("3 → täydellinen", () => {
    expect(translationBand(3)).toBe("täydellinen");
    expect(TRANSLATION_BAND_LABELS["täydellinen"]).toBe("Täydellinen");
  });
  it("2 → ymmärrettävä", () => {
    expect(translationBand(2)).toBe("ymmärrettävä");
    expect(TRANSLATION_BAND_LABELS["ymmärrettävä"]).toBe("Ymmärrettävä");
  });
  it("0 or 1 → vielä-harjoittelua", () => {
    expect(translationBand(0)).toBe("vielä-harjoittelua");
    expect(translationBand(1)).toBe("vielä-harjoittelua");
    expect(TRANSLATION_BAND_LABELS["vielä-harjoittelua"]).toBe("Vielä harjoittelua");
  });
  it("missing score → vastaus-puuttuu", () => {
    expect(translationBand(null)).toBe("vastaus-puuttuu");
    expect(translationBand(undefined)).toBe("vastaus-puuttuu");
  });
});

describe("gradeShortAnswer (reading comprehension)", () => {
  it("accepts when user contains an accepted phrase", () => {
    expect(gradeShortAnswer("en la oficina", ["oficina"])).toBe(true);
  });
  it("accepts when accepted phrase contains the user answer (loose — see FINDINGS)", () => {
    // Server behavior at routes/exam.js:133 accepts either direction. This means a
    // 2-letter answer can match a 50-char accepted phrase. Pinning as-is.
    expect(gradeShortAnswer("ca", ["casa"])).toBe(true);
  });
  it("rejects empty input", () => {
    expect(gradeShortAnswer("", ["casa"])).toBe(false);
  });
  it("rejects total mismatch", () => {
    expect(gradeShortAnswer("perro", ["casa", "hogar"])).toBe(false);
  });
});

describe("pointsToYoGrade", () => {
  const MAX = 199;
  it("maps 80%+ → L", () => {
    expect(pointsToYoGrade(Math.round(MAX * 0.85), MAX)).toBe("L");
  });
  it("maps 65-79% → E", () => {
    expect(pointsToYoGrade(Math.round(MAX * 0.70), MAX)).toBe("E");
  });
  it("maps 50-64% → M", () => {
    expect(pointsToYoGrade(Math.round(MAX * 0.55), MAX)).toBe("M");
  });
  it("maps 35-49% → C", () => {
    expect(pointsToYoGrade(Math.round(MAX * 0.40), MAX)).toBe("C");
  });
  it("maps 20-34% → B", () => {
    expect(pointsToYoGrade(Math.round(MAX * 0.25), MAX)).toBe("B");
  });
  it("maps 10-19% → A", () => {
    expect(pointsToYoGrade(Math.round(MAX * 0.15), MAX)).toBe("A");
  });
  it("maps <10% → I", () => {
    expect(pointsToYoGrade(Math.round(MAX * 0.05), MAX)).toBe("I");
    expect(pointsToYoGrade(0, MAX)).toBe("I");
  });
  it("guards against invalid max", () => {
    expect(pointsToYoGrade(50, 0)).toBe("I");
    expect(pointsToYoGrade(NaN, MAX)).toBe("I");
  });
});
