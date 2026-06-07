// L-V399 C3 — characterization test for the typed/translate answer-matching
// core extracted from js/screens/lessonRunner.js into js/lib/lessonAnswerMatch.js.
// Locks normalizeAnswer's transforms + answerMatches' two-pass contract so the
// behavior-preserving move is provable. The accent-tolerant second pass
// (isAcceptable) is owned + tested by lib/accentTolerance.js; here we lock the
// parts answerMatches itself decides.
import { describe, it, expect } from "vitest";
import { normalizeAnswer, answerMatches } from "../js/lib/lessonAnswerMatch.js";

describe("normalizeAnswer", () => {
  it("lowercases, trims, and collapses internal whitespace", () => {
    expect(normalizeAnswer("  Hola   Mundo  ")).toBe("hola mundo");
  });
  it("strips diacritics (NFD + combining-mark removal)", () => {
    expect(normalizeAnswer("había")).toBe("habia");
    expect(normalizeAnswer("Él comió")).toBe("el comio");
  });
  it("handles null/undefined/empty as empty string", () => {
    expect(normalizeAnswer(null)).toBe("");
    expect(normalizeAnswer(undefined)).toBe("");
    expect(normalizeAnswer("")).toBe("");
  });
});

describe("answerMatches — pass 1 (strict normalized equality)", () => {
  it("matches identical answers with no hint", () => {
    expect(answerMatches("hola", ["hola"])).toEqual({ ok: true, hint: null });
  });
  it("matches case-insensitively", () => {
    expect(answerMatches("HOLA", ["hola"])).toEqual({ ok: true, hint: null });
  });
  it("matches accent differences via normalization (no hint, since pass 1 strips diacritics)", () => {
    expect(answerMatches("habia", ["había"])).toEqual({ ok: true, hint: null });
  });
  it("matches against any entry in the accept list", () => {
    expect(answerMatches("gato", ["perro", "gato", "pez"])).toEqual({ ok: true, hint: null });
  });
  it("tolerates surrounding whitespace + casing together", () => {
    expect(answerMatches("  Gato ", ["gato"])).toEqual({ ok: true, hint: null });
  });
});

describe("answerMatches — no match + edge inputs", () => {
  it("returns ok:false, hint:null for a clearly wrong answer", () => {
    expect(answerMatches("zzqqxx", ["hola"])).toEqual({ ok: false, hint: null });
  });
  it("treats a null/undefined accept list as no candidates", () => {
    expect(answerMatches("hola", null)).toEqual({ ok: false, hint: null });
    expect(answerMatches("hola", undefined)).toEqual({ ok: false, hint: null });
  });
  it("returns an object with a boolean ok for empty input", () => {
    const r = answerMatches("", ["hola"]);
    expect(typeof r.ok).toBe("boolean");
    expect(r.ok).toBe(false);
  });
});
