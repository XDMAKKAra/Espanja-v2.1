/**
 * Writing grader shape + guardrails.
 *  (a) essay with a ser/estar error → corrected_text present, errors[] points at it
 *  (b) correct Spanish paragraph → errors: [] (no invented mistakes)
 *  (c) OpenAI returns 12 errors → server slices to 10
 *  (d) OpenAI returns corrected_text > 1.5× input → server truncates
 */
import { describe, it, expect, beforeAll } from "vitest";
import { buildApp, setOpenAIResponse } from "../helpers/app.js";
import { enforceGuardrails, MAX_ERRORS, CORRECTED_LENGTH_FACTOR } from "../../lib/writingGrading.js";

let request, app;
beforeAll(async () => {
  request = (await import("supertest")).default;
  app = await buildApp();
});

const task = {
  taskType: "short",
  points: 20,
  charMin: 160,
  charMax: 240,
  situation: "Kerro kaverille lomasta.",
  prompt: "Kirjoita espanjaksi.",
  requirements: ["Mihin menit", "Mitä teit"],
};

function withGraderResponse(payload) { setOpenAIResponse(payload); }

describe("POST /api/grade-writing — shape + guardrails", () => {
  it("essay with deliberate ser/estar error → corrected_text present + errors[] references it", async () => {
    withGraderResponse({
      viestinnallisyys: { score: 4, feedback_fi: "Hyvä." },
      kielen_rakenteet:  { score: 3, feedback_fi: "Ser/estar." },
      sanasto:           { score: 3, feedback_fi: "OK." },
      kokonaisuus:       { score: 3, feedback_fi: "Yhtenäinen." },
      total: 13,
      band: "E",
      overall_feedback_fi: "Muista: tunteet → estar.",
      corrected_text: "Ayer fui a Madrid. Estuve muy contento con el viaje.",
      errors: [
        { excerpt: "Era contento", corrected: "Estuve contento", category: "grammar", explanation_fi: "Estar tunnetilaan, ei ser." },
      ],
      annotations: [],
    });
    const res = await request(app)
      .post("/api/grade-writing")
      .set("Authorization", "Bearer fake")
      .send({
        task,
        studentText: "Ayer fui a Madrid. Era contento con el viaje.",
      });
    expect(res.status).toBe(200);
    expect(res.body.result).toBeDefined();
    expect(res.body.result.corrected_text).toBeTruthy();
    expect(res.body.result.corrected_text).toMatch(/Estuve/);
    expect(Array.isArray(res.body.result.errors)).toBe(true);
    expect(res.body.result.errors.length).toBeGreaterThan(0);
    expect(res.body.result.errors[0].excerpt).toMatch(/Era/);
  });

  it("correct Spanish paragraph → errors: [] (no invented mistakes)", async () => {
    withGraderResponse({
      viestinnallisyys: { score: 5, feedback_fi: "Erinomainen." },
      kielen_rakenteet:  { score: 5, feedback_fi: "Ei virheitä." },
      sanasto:           { score: 4, feedback_fi: "Hyvä." },
      kokonaisuus:       { score: 5, feedback_fi: "Sujuva." },
      total: 19,
      band: "L",
      overall_feedback_fi: "Erinomaista työtä!",
      corrected_text: "",
      errors: [],
      annotations: [],
    });
    const res = await request(app)
      .post("/api/grade-writing")
      .set("Authorization", "Bearer fake")
      .send({
        task,
        studentText: "Ayer fui a Madrid con mi amiga. Visitamos el Prado y comimos tapas en un bar del centro. Madrid tiene mucha historia y buena comida.",
      });
    expect(res.status).toBe(200);
    expect(res.body.result.errors).toEqual([]);
    // When OpenAI returns no corrected_text, processGradingResult falls back to
    // the original studentText so the UI never shows an empty "Korjattu versio".
    expect(res.body.result.corrected_text.length).toBeGreaterThan(0);
  });

  it("OpenAI returns 12 errors → server slices to MAX_ERRORS (10)", async () => {
    const twelve = Array.from({ length: 12 }, (_, i) => ({
      excerpt: `err${i}`, corrected: `fix${i}`, category: "grammar", explanation_fi: "x",
    }));
    withGraderResponse({
      viestinnallisyys: { score: 2, feedback_fi: "." },
      kielen_rakenteet:  { score: 2, feedback_fi: "." },
      sanasto:           { score: 2, feedback_fi: "." },
      kokonaisuus:       { score: 1, feedback_fi: "." },
      total: 7,
      band: "C",
      overall_feedback_fi: ".",
      corrected_text: "fixed text",
      errors: twelve,
      annotations: [],
    });
    const res = await request(app)
      .post("/api/grade-writing")
      .set("Authorization", "Bearer fake")
      .send({ task, studentText: "mi texto con muchos errores.".repeat(10) });
    expect(res.status).toBe(200);
    expect(res.body.result.errors.length).toBe(MAX_ERRORS);
    expect(res.body.result._meta.truncatedErrors).toBe(true);
  });

  it("corrected_text > 1.5× input length → server truncates", () => {
    const studentText = "Hola Juan."; // 10 chars
    const over = "x".repeat(100);     // 100 > floor(10 * 1.5) = 15
    const guarded = enforceGuardrails({ corrected_text: over, errors: [] }, studentText);
    expect(guarded.corrected_text.length).toBeLessThanOrEqual(Math.floor(studentText.length * CORRECTED_LENGTH_FACTOR));
    expect(guarded._truncatedCorrectedText).toBe(true);
  });
});
