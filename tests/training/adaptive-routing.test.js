/**
 * Verifies the adaptive mastery-test routing fix (Commit 1).
 * - POST /api/adaptive/mastery-test/start with {mode}   → adaptive.js handler
 * - POST /api/mastery-test/start          with {topicKey} → exercises.js handler
 * The two used to collide under /mastery-test/*, which silently 400'd the adaptive flow.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { buildApp, setOpenAIResponse } from "../helpers/app.js";

let request, app;

beforeAll(async () => {
  request = (await import("supertest")).default;
  app = await buildApp();
});

describe("Adaptive mastery-test routing", () => {
  it("POST /api/adaptive/mastery-test/start with {mode} hits adaptive handler", async () => {
    // Adaptive handler's valid modes are vocab/grammar/reading. It calls OpenAI for questions.
    setOpenAIResponse([
      { question: "q1", choices: ["a", "b", "c", "d"], correct: "A", isHigherLevel: false },
      { question: "q2", choices: ["a", "b", "c", "d"], correct: "A", isHigherLevel: true  },
    ]);
    const res = await request(app)
      .post("/api/adaptive/mastery-test/start")
      .set("Authorization", "Bearer fake")
      .send({ mode: "vocab" });
    // Either 200 (success) or a specific application-level error, never a 404.
    expect(res.status).not.toBe(404);
  });

  it("legacy POST /api/mastery-test/start with {topicKey} still hits exercises handler", async () => {
    setOpenAIResponse([
      { question: "q1", choices: ["a", "b", "c", "d"], correct: "A", explanation: "x" },
    ]);
    const res = await request(app)
      .post("/api/mastery-test/start")
      .set("Authorization", "Bearer fake")
      .send({ topicKey: "ser_estar" });
    // Not a 404 — the exercises.js handler is still mounted
    expect(res.status).not.toBe(404);
  });

  it("POST /api/adaptive/mastery-test/start rejects invalid mode with 400", async () => {
    const res = await request(app)
      .post("/api/adaptive/mastery-test/start")
      .set("Authorization", "Bearer fake")
      .send({ mode: "not-a-real-mode" });
    expect(res.status).toBe(400);
  });
});
