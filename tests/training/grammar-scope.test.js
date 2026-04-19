import { describe, it, expect, beforeAll } from "vitest";
import { buildApp, setOpenAIResponse } from "../helpers/app.js";
import { checkGrammarItemScope, validateGrammarBatch } from "../../lib/grammarScope.js";

let request, app;
beforeAll(async () => {
  request = (await import("supertest")).default;
  app = await buildApp();
});

// ── Unit tests on the scope checker itself ──────────────────────────────────
describe("checkGrammarItemScope / validateGrammarBatch", () => {
  it("flags past-subjunctive (-iese form)", () => {
    const v = checkGrammarItemScope({
      sentence: "Si fuese rico, viajaría por el mundo.",
      explanation: "Subjuntivo imperfecto — fuese.",
    });
    expect(v).toContain("past-subjunctive-se");
  });

  it("flags conditional perfect", () => {
    const v = checkGrammarItemScope({
      sentence: "Habría hablado con ella si hubiera tenido tiempo.",
      explanation: "Habría hablado = conditional perfect.",
    });
    expect(v).toContain("conditional-perfect");
  });

  it("flags passive voice with ser + por", () => {
    const v = checkGrammarItemScope({
      sentence: "La novela fue escrita por García Márquez.",
      explanation: "Pasiva con ser + participio + por.",
    });
    expect(v).toContain("passive-voice");
  });

  it("accepts in-scope present subjunctive (ojalá + guste)", () => {
    const v = checkGrammarItemScope({
      sentence: "Ojalá te guste el regalo.",
      explanation: "Ojalá requires present subjunctive.",
    });
    expect(v).toEqual([]);
  });

  it("mixed topic requires ≥3 distinct topics", () => {
    const batch = [
      { sentence: "Él es profesor.", topic: "ser_estar" },
      { sentence: "Hay una mesa.", topic: "ser_estar" },
      { sentence: "Estoy aquí.", topic: "ser_estar" },
    ];
    const r = validateGrammarBatch(batch, { topic: "mixed" });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.startsWith("mixed-variety-insufficient"))).toBe(true);
  });
});

// ── Supertests through the full handler ─────────────────────────────────────
describe("POST /api/grammar-drill rejects + retries on out-of-scope items", () => {
  it("out-of-scope past-subjunctive item triggers retry; if retry also fails, handler filters to in-scope only", async () => {
    const badItem = {
      id: 1,
      type: "gap",
      sentence: "Si fuese rico, viajaría por el mundo.",
      instruction: "Täydennä.",
      options: ["A) fuese", "B) soy", "C) sería", "D) fui"],
      correct: "A",
      rule: "past-subjunctive",
      explanation: "fuese — imperfecto de subjuntivo.",
      topic: "subjunctive",
    };
    const goodItem = {
      id: 2,
      type: "gap",
      sentence: "Ojalá te guste el regalo.",
      instruction: "Täydennä.",
      options: ["A) guste", "B) gustará", "C) gustaba", "D) gustaría"],
      correct: "A",
      rule: "ojalá+subj.",
      explanation: "Ojalá vaatii subjunktiivin.",
      topic: "subjunctive",
    };
    // Both fixture responses include the out-of-scope item so the retry fails too;
    // handler then strips it.
    setOpenAIResponse([badItem, goodItem]);
    const res = await request(app)
      .post("/api/grammar-drill")
      .set("Authorization", "Bearer fake")
      .send({ level: "C", topic: "subjunctive", language: "spanish", count: 2 });
    expect(res.status).toBe(200);
    // Out-of-scope item stripped, only the in-scope one remains
    expect(res.body.exercises.length).toBe(1);
    expect(res.body.exercises[0].rule).toBe("ojalá+subj.");
    // Warnings present
    expect(Array.isArray(res.body.warnings)).toBe(true);
    expect(res.body.warnings.some((w) => /out-of-scope/.test(w))).toBe(true);
  });

  it("fully in-scope batch returns no warnings", async () => {
    const inScope = [
      { id: 1, type: "gap", sentence: "Cuando era pequeño, iba al parque.", instruction: "", options: ["A) iba","B) fui","C) voy","D) iré"], correct: "A", rule: "imperfekti", explanation: "Toistuva menneisyys → imperfekti.", topic: "preterite_imperfect" },
      { id: 2, type: "gap", sentence: "Ojalá te guste el regalo.",          instruction: "", options: ["A) guste","B) gustará","C) gustaba","D) gustaría"], correct: "A", rule: "ojalá+subj.", explanation: "Ojalá vaatii subjunktiivin.", topic: "subjunctive" },
    ];
    setOpenAIResponse(inScope);
    const res = await request(app)
      .post("/api/grammar-drill")
      .set("Authorization", "Bearer fake")
      .send({ level: "C", topic: "preterite_imperfect", language: "spanish", count: 2 });
    expect(res.status).toBe(200);
    expect(res.body.exercises.length).toBe(2);
    expect(res.body.warnings).toBeUndefined();
  });
});
