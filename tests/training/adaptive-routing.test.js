/**
 * Guards the canonical learning-path mastery-test route.
 * - POST /api/mastery-test/start with {topicKey} → exercises.js handler.
 * L-V392: the legacy /api/adaptive/* tasokoe was removed (it shared no screens
 * with this canonical flow), so the old routing-collision tests are gone.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { buildApp, setOpenAIResponse } from "../helpers/app.js";

let request, app;

beforeAll(async () => {
  request = (await import("supertest")).default;
  app = await buildApp();
});

describe("Mastery-test routing", () => {
  it("POST /api/mastery-test/start with {topicKey} hits the exercises handler", async () => {
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
});
