import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/seedBank.js", () => ({
  getSeedItemById: vi.fn(),
}));

import { getSeedItemById } from "../lib/seedBank.js";
import { gradeAukkotehtava } from "../lib/grading/aukkotehtava.js";
import { gradeMonivalinta } from "../lib/grading/monivalinta.js";
import { gradeYhdistaminen } from "../lib/grading/yhdistaminen.js";
import { gradeCorrection } from "../lib/grading/correction.js";

beforeEach(() => {
  vi.mocked(getSeedItemById).mockReset();
});

describe("gradeAukkotehtava", () => {
  const seed = {
    id: "a1",
    answer: "está",
    alt_answers: ["esta"],
    explanation_fi: "estar = tilapäinen",
  };

  it("rejects missing id", () => {
    expect(gradeAukkotehtava({})).toEqual({ ok: false, error: "id is required" });
  });

  it("rejects whitespace-only studentAnswer", () => {
    expect(gradeAukkotehtava({ id: "a1", studentAnswer: "   " }))
      .toEqual({ ok: false, error: "studentAnswer is required" });
  });

  it("returns error for unknown id", () => {
    vi.mocked(getSeedItemById).mockReturnValue(undefined);
    const r = gradeAukkotehtava({ id: "missing", studentAnswer: "x" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/unknown exercise id/);
  });

  it("exact match → täydellinen (3/3)", () => {
    vi.mocked(getSeedItemById).mockReturnValue(seed);
    const r = gradeAukkotehtava({ id: "a1", studentAnswer: "está" });
    expect(r).toMatchObject({ correct: true, band: "taydellinen", score: 3, maxScore: 3 });
  });

  it("is case-insensitive and trims whitespace", () => {
    vi.mocked(getSeedItemById).mockReturnValue(seed);
    const r = gradeAukkotehtava({ id: "a1", studentAnswer: "  ESTÁ  " });
    expect(r.band).toBe("taydellinen");
  });

  it("diacritic-folded match → ymmärrettävä (2/3)", () => {
    vi.mocked(getSeedItemById).mockReturnValue({ ...seed, alt_answers: [] });
    const r = gradeAukkotehtava({ id: "a1", studentAnswer: "esta" });
    expect(r).toMatchObject({ correct: false, band: "ymmarrettava", score: 2 });
  });

  it("alt_answers exact match treats as täydellinen", () => {
    vi.mocked(getSeedItemById).mockReturnValue(seed);
    const r = gradeAukkotehtava({ id: "a1", studentAnswer: "esta" });
    // "esta" is in alt_answers, so exact match wins
    expect(r.band).toBe("taydellinen");
  });

  it("single-char typo → lähellä (1/3)", () => {
    vi.mocked(getSeedItemById).mockReturnValue({ ...seed, alt_answers: [] });
    const r = gradeAukkotehtava({ id: "a1", studentAnswer: "stá" });
    expect(r.band).toBe("lahella");
  });

  it("completely wrong → väärin (0/3)", () => {
    vi.mocked(getSeedItemById).mockReturnValue({ ...seed, alt_answers: [] });
    const r = gradeAukkotehtava({ id: "a1", studentAnswer: "caballo" });
    expect(r.band).toBe("vaarin");
  });

  it("handles empty alt_answers via nullish coalescing", () => {
    vi.mocked(getSeedItemById).mockReturnValue({ id: "a1", answer: "hola" });
    const r = gradeAukkotehtava({ id: "a1", studentAnswer: "hola" });
    expect(r.band).toBe("taydellinen");
  });
});

describe("gradeMonivalinta", () => {
  it("rejects non-integer chosenIndex", () => {
    expect(gradeMonivalinta({ chosenIndex: "a", correctIndex: 0 }))
      .toEqual({ ok: false, error: "chosenIndex must be a non-negative integer" });
  });

  it("rejects negative chosenIndex", () => {
    expect(gradeMonivalinta({ chosenIndex: -1, correctIndex: 0 }).ok).toBe(false);
  });

  it("rejects non-integer correctIndex", () => {
    expect(gradeMonivalinta({ chosenIndex: 0, correctIndex: 1.5 }).ok).toBe(false);
  });

  it("correct → band täydellinen, 1/1", () => {
    expect(gradeMonivalinta({ chosenIndex: 2, correctIndex: 2 })).toMatchObject({
      ok: true, correct: true, band: "taydellinen", score: 1, maxScore: 1,
    });
  });

  it("wrong → band väärin, 0/1", () => {
    expect(gradeMonivalinta({ chosenIndex: 1, correctIndex: 2 })).toMatchObject({
      correct: false, band: "vaarin", score: 0,
    });
  });

  it("coerces numeric strings", () => {
    expect(gradeMonivalinta({ chosenIndex: "2", correctIndex: "2" }).correct).toBe(true);
  });
});

describe("gradeYhdistaminen", () => {
  it("rejects empty pairs", () => {
    expect(gradeYhdistaminen({ pairs: [] }).ok).toBe(false);
    expect(gradeYhdistaminen({}).ok).toBe(false);
  });

  it("rejects non-array pairs", () => {
    expect(gradeYhdistaminen({ pairs: "nope" }).ok).toBe(false);
  });

  it("rejects pair missing id", () => {
    vi.mocked(getSeedItemById).mockReturnValue({ id: "m1", fi: "koira" });
    expect(gradeYhdistaminen({ pairs: [{ studentFi: "koira" }] }).ok).toBe(false);
  });

  it("rejects unknown item id", () => {
    vi.mocked(getSeedItemById).mockReturnValue(undefined);
    const r = gradeYhdistaminen({ pairs: [{ id: "m1", studentFi: "koira" }] });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/unknown item id/);
  });

  it("all correct → täydellinen 3/3", () => {
    vi.mocked(getSeedItemById).mockImplementation(id => ({
      m1: { fi: "koira" }, m2: { fi: "kissa" }, m3: { fi: "talo" }, m4: { fi: "maa" },
    }[id]));
    const r = gradeYhdistaminen({
      pairs: [
        { id: "m1", studentFi: "koira" },
        { id: "m2", studentFi: "kissa" },
        { id: "m3", studentFi: "talo" },
        { id: "m4", studentFi: "maa" },
      ],
    });
    expect(r).toMatchObject({ correct: true, band: "taydellinen", score: 3, correctCount: 4, totalCount: 4 });
  });

  it("75% correct → ymmärrettävä 2/3", () => {
    vi.mocked(getSeedItemById).mockImplementation(id => ({
      m1: { fi: "koira" }, m2: { fi: "kissa" }, m3: { fi: "talo" }, m4: { fi: "maa" },
    }[id]));
    const r = gradeYhdistaminen({
      pairs: [
        { id: "m1", studentFi: "koira" },
        { id: "m2", studentFi: "kissa" },
        { id: "m3", studentFi: "talo" },
        { id: "m4", studentFi: "väärin" },
      ],
    });
    expect(r.band).toBe("ymmarrettava");
    expect(r.score).toBe(2);
  });

  it("50% → lähellä 1/3", () => {
    vi.mocked(getSeedItemById).mockImplementation(id => ({
      m1: { fi: "koira" }, m2: { fi: "kissa" },
    }[id]));
    const r = gradeYhdistaminen({
      pairs: [
        { id: "m1", studentFi: "koira" },
        { id: "m2", studentFi: "väärin" },
      ],
    });
    expect(r.band).toBe("lahella");
  });

  it("<50% → väärin 0/3", () => {
    vi.mocked(getSeedItemById).mockImplementation(id => ({
      m1: { fi: "koira" }, m2: { fi: "kissa" }, m3: { fi: "talo" }, m4: { fi: "maa" },
    }[id]));
    const r = gradeYhdistaminen({
      pairs: [
        { id: "m1", studentFi: "koira" },
        { id: "m2", studentFi: "väärin" },
        { id: "m3", studentFi: "väärin" },
        { id: "m4", studentFi: "väärin" },
      ],
    });
    expect(r.band).toBe("vaarin");
  });

  it("trims and compares fi exactly (not diacritic-folded)", () => {
    vi.mocked(getSeedItemById).mockReturnValue({ fi: "äiti" });
    const r = gradeYhdistaminen({ pairs: [{ id: "m1", studentFi: "  äiti  " }] });
    expect(r.correct).toBe(true);
  });
});

describe("gradeCorrection", () => {
  const seed = {
    id: "c1",
    erroneous_sentence: "Yo soy cansado.",
    correct_sentence: "Yo estoy cansado.",
    alt_corrections: [],
    errors: [{ token_index: 1 }],
    explanation_fi: "estar ilmaisee tilaa, ei pysyvää ominaisuutta.",
  };

  it("rejects missing id", () => {
    const r = gradeCorrection({ studentCorrection: "x" });
    expect(r.ok).toBe(false);
  });

  it("rejects non-string studentCorrection", () => {
    const r = gradeCorrection({ id: "c1", studentCorrection: 123 });
    expect(r.ok).toBe(false);
  });

  it("unknown id returns error", () => {
    vi.mocked(getSeedItemById).mockReturnValue(undefined);
    const r = gradeCorrection({ id: "nope", studentCorrection: "x" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Tehtävää ei löydy/);
  });

  it("student submits unchanged erroneous sentence → väärin", () => {
    vi.mocked(getSeedItemById).mockReturnValue(seed);
    const r = gradeCorrection({ id: "c1", studentCorrection: "Yo soy cansado." });
    expect(r).toMatchObject({ correct: false, band: "vaarin", score: 0 });
  });

  it("exact correction → täydellinen 3/3", () => {
    vi.mocked(getSeedItemById).mockReturnValue(seed);
    const r = gradeCorrection({ id: "c1", studentCorrection: "Yo estoy cansado." });
    expect(r).toMatchObject({ correct: true, band: "taydellinen", score: 3 });
  });

  it("diacritic-folded match → ymmärrettävä 2/3", () => {
    vi.mocked(getSeedItemById).mockReturnValue({
      ...seed,
      correct_sentence: "Él está aquí.",
      erroneous_sentence: "Él es aquí.",
    });
    const r = gradeCorrection({ id: "c1", studentCorrection: "El esta aqui." });
    expect(r.band).toBe("ymmarrettava");
  });

  it("token edit distance ≤ 2 at error position → lähellä 1/3", () => {
    vi.mocked(getSeedItemById).mockReturnValue({
      ...seed,
      correct_sentence: "Yo estoy cansado.",
      errors: [{ token_index: 1 }],
    });
    // "estoi" vs "estoy" = 1 edit at error position
    const r = gradeCorrection({ id: "c1", studentCorrection: "Yo estoi cansado." });
    expect(r.band).toBe("lahella");
  });

  it("penalises change at non-error position heavily", () => {
    vi.mocked(getSeedItemById).mockReturnValue({
      ...seed,
      correct_sentence: "Yo estoy cansado.",
      errors: [{ token_index: 1 }],
    });
    // Correct fix at token 1, but student also changed "cansado" → "feliz"
    const r = gradeCorrection({ id: "c1", studentCorrection: "Yo estoy feliz." });
    expect(r.band).toBe("vaarin");
  });

  it("alt_corrections list accepts alternative phrasing", () => {
    vi.mocked(getSeedItemById).mockReturnValue({
      ...seed,
      alt_corrections: ["Estoy cansado."],
    });
    const r = gradeCorrection({ id: "c1", studentCorrection: "Estoy cansado." });
    expect(r.band).toBe("taydellinen");
  });

  it("length mismatch falls back to full-sentence Levenshtein", () => {
    vi.mocked(getSeedItemById).mockReturnValue({
      ...seed,
      correct_sentence: "Yo estoy cansado.",
      errors: [],
    });
    // Different length → levenshtein on full strings
    const r = gradeCorrection({ id: "c1", studentCorrection: "Yo estoy muy cansado." });
    expect(r.ok).toBe(true);
  });

  it("completely different → väärin", () => {
    vi.mocked(getSeedItemById).mockReturnValue(seed);
    const r = gradeCorrection({ id: "c1", studentCorrection: "Algo totalmente diferente." });
    expect(r.band).toBe("vaarin");
  });
});
