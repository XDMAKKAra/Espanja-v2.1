/**
 * Writing grader shape + guardrails (Commit 6).
 *  (a) essay with a ser/estar error → correctedText present, errors[] points at it
 *  (b) correct Spanish paragraph → errors: [] (no invented mistakes)
 *  (c) OpenAI returns 12 errors → server slices to 10
 *  (d) OpenAI returns a correctedText > 1.5× input → server truncates
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
  points: 35,
  charMin: 160,
  charMax: 240,
  situation: "Kerro kaverille lomasta.",
  prompt: "Kirjoita espanjaksi.",
  requirements: ["Mihin menit", "Mitä teit"],
};

function withGraderResponse(payload) { setOpenAIResponse(payload); }

describe("POST /api/grade-writing — shape + guardrails", () => {
  it("essay with deliberate ser/estar error → correctedText present + errors[] references it", async () => {
    withGraderResponse({
      criteria: {
        content:    { score: 12, max: 15, feedback: "Hyvä." },
        vocabulary: { score: 7,  max: 10, feedback: "OK." },
        grammar:    { score: 6,  max: 10, feedback: "Ser/estar." },
      },
      correctedText: "Ayer fui a Madrid. Estuve muy contento con el viaje.",
      errors: [
        { excerpt: "Era contento", corrected: "Estuve contento", category: "grammar", explanation: "Estar tunnetilaan, ei ser." },
      ],
      annotations: [],
      positives: ["Hyvä aikamuotojen käyttö."],
      overallFeedback: "Muista: tunteet → estar.",
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
    expect(res.body.result.correctedText).toBeTruthy();
    expect(res.body.result.correctedText).toMatch(/Estuve/);
    expect(Array.isArray(res.body.result.errors)).toBe(true);
    expect(res.body.result.errors.length).toBeGreaterThan(0);
    expect(res.body.result.errors[0].excerpt).toMatch(/Era/);
  });

  it("correct Spanish paragraph → errors: [] (no invented mistakes)", async () => {
    withGraderResponse({
      criteria: {
        content:    { score: 14, max: 15, feedback: "Erinomainen." },
        vocabulary: { score: 9,  max: 10, feedback: "Hyvä." },
        grammar:    { score: 10, max: 10, feedback: "Ei virheitä." },
      },
      correctedText: "", // grader returns no corrections when input is correct
      errors: [],
      annotations: [],
      positives: ["Sujuva teksti."],
      overallFeedback: "Erinomaista työtä!",
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
    // When OpenAI returns no correctedText, processGradingResult falls back to
    // the original studentText so the UI never shows an empty "Korjattu versio".
    expect(res.body.result.correctedText.length).toBeGreaterThan(0);
  });

  it("OpenAI returns 12 errors → server slices to MAX_ERRORS (10)", async () => {
    const twelve = Array.from({ length: 12 }, (_, i) => ({
      excerpt: `err${i}`, corrected: `fix${i}`, category: "grammar", explanation: "x",
    }));
    withGraderResponse({
      criteria: {
        content:    { score: 6, max: 15, feedback: "." },
        vocabulary: { score: 4, max: 10, feedback: "." },
        grammar:    { score: 3, max: 10, feedback: "." },
      },
      correctedText: "fixed text",
      errors: twelve,
      annotations: [],
      positives: [],
      overallFeedback: ".",
    });
    const res = await request(app)
      .post("/api/grade-writing")
      .set("Authorization", "Bearer fake")
      .send({ task, studentText: "mi texto con muchos errores.".repeat(10) });
    expect(res.status).toBe(200);
    expect(res.body.result.errors.length).toBe(MAX_ERRORS);
    expect(res.body.result._meta.truncatedErrors).toBe(true);
  });

  it("correctedText > 1.5× input length → server truncates", () => {
    // Unit-test enforceGuardrails directly — easier than mocking a long OpenAI response
    const studentText = "Hola Juan."; // 10 chars
    const over = "x".repeat(100);     // 100 >> 15 = 1.5 * 10
    const guarded = enforceGuardrails({ correctedText: over, errors: [] }, studentText);
    expect(guarded.correctedText.length).toBeLessThanOrEqual(Math.floor(studentText.length * CORRECTED_LENGTH_FACTOR));
    expect(guarded._truncatedCorrectedText).toBe(true);
  });
});
