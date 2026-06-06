import { describe, it, expect } from "vitest";
import { stripLeadingSubjectPronoun } from "../../lib/grading/subjectPronoun.js";
import { gradeQuestion } from "../../js/features/miniYO.js";

// L-V397 — Spanish subject pronouns are optional; fill graders must accept a
// valid "pronoun + verb" answer while still rejecting a wrong verb form.

describe("stripLeadingSubjectPronoun", () => {
  it("strips a leading 'yo'", () => {
    expect(stripLeadingSubjectPronoun("yo caminaba")).toBe("caminaba");
  });

  it("leaves a bare verb form untouched", () => {
    expect(stripLeadingSubjectPronoun("caminaba")).toBe("caminaba");
  });

  it("trims surrounding whitespace", () => {
    expect(stripLeadingSubjectPronoun("  yo caminaba  ")).toBe("caminaba");
  });

  it("strips every unambiguous pronoun", () => {
    for (const p of ["yo", "ella", "usted", "nosotros", "ellos", "ustedes"]) {
      expect(stripLeadingSubjectPronoun(`${p} hablamos`)).toBe("hablamos");
    }
  });

  it("strips accented 'él' / 'tú'", () => {
    expect(stripLeadingSubjectPronoun("él hablaba")).toBe("hablaba");
    expect(stripLeadingSubjectPronoun("tú hablabas")).toBe("hablabas");
  });

  it("does NOT strip the article 'el' or possessive 'tu' (no accent)", () => {
    expect(stripLeadingSubjectPronoun("el coche")).toBe("el coche");
    expect(stripLeadingSubjectPronoun("tu casa")).toBe("tu casa");
  });

  it("never strips a single token (would empty the answer)", () => {
    expect(stripLeadingSubjectPronoun("yo")).toBe("yo");
  });

  it("only strips the FIRST token", () => {
    expect(stripLeadingSubjectPronoun("yo yo caminaba")).toBe("yo caminaba");
  });
});

describe("gradeQuestion (fill) — pronoun-optional", () => {
  const q = { type: "fill", answer: "caminaba", accepted_alternates: [] };

  it("accepts the bare verb form", () => {
    expect(gradeQuestion(q, "caminaba").correct).toBe(true);
  });

  it("accepts the pronoun + verb form (the L-V397 bug)", () => {
    expect(gradeQuestion(q, "yo caminaba").correct).toBe(true);
  });

  it("accepts mixed case and whitespace", () => {
    expect(gradeQuestion(q, "  Yo Caminaba ").correct).toBe(true);
  });

  it("still rejects a wrong tense — bare", () => {
    expect(gradeQuestion(q, "caminé").correct).toBe(false);
  });

  it("still rejects a wrong tense — with pronoun", () => {
    expect(gradeQuestion(q, "yo caminé").correct).toBe(false);
  });

  it("accepts a pronoun in an accepted_alternate too", () => {
    const q2 = { type: "fill", answer: "hablé", accepted_alternates: ["hable"] };
    expect(gradeQuestion(q2, "yo hable").correct).toBe(true);
  });
});
