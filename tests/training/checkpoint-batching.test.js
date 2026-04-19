/**
 * /api/checkpoint/start previously made 4 sequential OpenAI calls (5 q each).
 * Commit 8: batch to 2 calls of 10 each. Assert exactly 2 invocations.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { buildApp, setOpenAIResponse, getCallOpenAIMock } from "../helpers/app.js";

// Patch Supabase mocks to return a user-level where canCheckpoint is true.
vi.mock("../../lib/levelEngine.js", () => ({
  getUserLevel: async () => ({ current_level: "L2" }),
  refreshUserLevel: async () => ({
    canCheckpoint: true,
    nextLevel: "L3",
    current_level: "L2",
  }),
  processCheckpointResult: async () => ({ passed: true }),
  progressToNextLevel: async () => ({}),
}));

// Patch the engine module used to compose prompts + scaffold.
vi.mock("../../lib/adaptiveEngine.js", () => ({
  composePrompt: () => "MOCK PROMPT",
  getMaxTokens: () => 1000,
  processAnswer: async () => ({ scaffoldLevel: 0, scaffoldChanged: false, direction: "none" }),
  describeScaffold: () => ({}),
}));

let request, app, callMock;
beforeAll(async () => {
  request = (await import("supertest")).default;
  app = await buildApp();
  callMock = getCallOpenAIMock();
});

describe("POST /api/checkpoint/start batching (Commit 8)", () => {
  it("makes exactly 2 OpenAI calls to assemble 20 questions", async () => {
    // Return 10 exercises per call so total is 20.
    const tenItems = Array.from({ length: 10 }, (_, i) => ({
      id: i, question: `q${i}`, options: ["A) a","B) b","C) c","D) d"],
      correct: "A", explanation: "x", context: "Lorem ipsum dolor sit.",
    }));
    setOpenAIResponse(tenItems);

    callMock.mockClear();
    const res = await request(app)
      .post("/api/checkpoint/start")
      .set("Authorization", "Bearer fake")
      .send({ language: "spanish" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.exercises)).toBe(true);
    expect(res.body.exercises.length).toBe(20);
    // The critical assertion — exactly 2 calls, not 4
    expect(callMock).toHaveBeenCalledTimes(2);
  });
});
