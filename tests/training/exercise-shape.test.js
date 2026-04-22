/**
 * Supertest-based route-shape tests.
 *
 * Mocks lib/openai.js (OpenAI calls), supabase.js (auth + DB writes), and the
 * rate-limit middleware. The goal is NOT to test the AI; it's to verify that
 * — given a plausible OpenAI response — the route handler still produces the
 * response shape the frontend expects.
 *
 * Required frontend fields per exercise type are documented below each block.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loadFixture = (name) => JSON.parse(readFileSync(path.join(__dirname, "..", "fixtures", "openai", name), "utf8"));

const vocabFixture = loadFixture("vocab.json");
const grammarFixture = loadFixture("grammar.json");
const readingFixture = loadFixture("reading.json");

// Track the last fixture requested so we can tailor responses per route.
let _nextOpenAIResponse = vocabFixture;

// ── Global module mocks (must run before any route import) ──────────────────

vi.mock("../../supabase.js", () => {
  const auth = {
    getUser: vi.fn(async () => ({ data: { user: { id: "test-user-id", email: "test@puheo.test" } }, error: null })),
    admin: { getUserById: vi.fn(async () => ({ data: { user: { id: "test-user-id", email: "test@puheo.test" } } })) },
  };
  const fromStub = () => {
    const builder = {};
    const methods = ["select", "eq", "neq", "gt", "gte", "lt", "lte", "in", "not", "is",
                     "or", "and", "filter", "order", "range", "like", "ilike", "contains",
                     "containedBy", "textSearch", "match"];
    methods.forEach((m) => { builder[m] = vi.fn(() => builder); });
    builder.limit = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
    builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
    builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    builder.insert = vi.fn().mockResolvedValue({ data: null, error: null });
    builder.update = vi.fn(() => builder);
    builder.upsert = vi.fn().mockResolvedValue({ data: null, error: null });
    builder.delete = vi.fn(() => builder);
    builder.then = (resolve) => resolve({ data: [], error: null, count: 0 });
    return builder;
  };
  return {
    default: { auth, from: vi.fn(fromStub), rpc: vi.fn(async () => ({ data: null, error: null })) },
  };
});

vi.mock("../../lib/openai.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    callOpenAI: vi.fn(async () => {
      const payload = Array.isArray(_nextOpenAIResponse)
        ? [..._nextOpenAIResponse]
        : { ..._nextOpenAIResponse };
      payload._usage = { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 };
      return payload;
    }),
    getUserProfileContext: vi.fn(async () => ""),
  };
});

// Neutralise rate limiting + cost gate so tests hit the handler.
vi.mock("../../middleware/rateLimit.js", () => {
  const pass = (req, res, next) => next();
  return { aiLimiter: pass, aiStrictLimiter: pass, authLimiter: pass, registerLimiter: pass,
           forgotPasswordLimiter: pass, reportLimiter: pass, default: { aiLimiter: pass } };
});
vi.mock("../../middleware/costLimit.js", () => ({ checkMonthlyCostLimit: (req, res, next) => next() }));
vi.mock("../../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => { req.user = { userId: "test-user-id", email: "test@puheo.test" }; next(); },
  requirePro: (_req, _res, next) => next(),
  isPro: async () => true,
  softProGate: (_req, _res, next) => next(),
  softReadingGate: (req, _res, next) => { req.isPro = true; next(); },
  incrementReadingPieces: async () => 1,
  FREE_READING_PIECES: 2,
}));

let request, app, express;

beforeAll(async () => {
  express = (await import("express")).default;
  request = (await import("supertest")).default;
  const { default: exerciseRoutes } = await import("../../routes/exercises.js");
  const { default: writingRoutes } = await import("../../routes/writing.js");
  app = express();
  app.use(express.json());
  app.use("/api", exerciseRoutes);
  app.use("/api", writingRoutes);
});

function setOpenAIResponse(payload) { _nextOpenAIResponse = payload; }

describe("POST /api/generate (vocab) — response shape + Commit 4 hardening", () => {
  it("returns { exercises: [...] } with each item carrying UI-required fields + context", async () => {
    setOpenAIResponse(vocabFixture);
    const res = await request(app).post("/api/generate")
      .set("Authorization", "Bearer fake-test-token")
      .send({ level: "C", topic: "general vocabulary", language: "spanish", count: 2 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.exercises)).toBe(true);
    expect(res.body.exercises.length).toBeGreaterThan(0);
    for (const ex of res.body.exercises) {
      // fields the vocab.js renderer reads
      expect(ex).toHaveProperty("question");
      expect(ex).toHaveProperty("options");
      expect(Array.isArray(ex.options)).toBe(true);
      expect(ex.options.length).toBeGreaterThanOrEqual(2);
      expect(ex).toHaveProperty("correct");
      expect(ex).toHaveProperty("explanation");
      // Commit 4: context required + non-empty on every item
      expect(ex).toHaveProperty("context");
      expect(String(ex.context).trim().length).toBeGreaterThanOrEqual(10);
    }
    // _usage must NOT leak
    for (const ex of res.body.exercises) expect(ex).not.toHaveProperty("_usage");
    // No duplicate correct-target headwords within the batch
    const correctTexts = res.body.exercises.map((ex) =>
      String(ex.options[("ABCDEFGH").indexOf(ex.correct)] || "").toLowerCase());
    expect(new Set(correctTexts).size).toBe(correctTexts.length);
  });

  it("rejects + retries a batch with a duplicate headword, then returns warnings if retry also bad", async () => {
    const dupFixture = [
      { id: 1, type: "meaning", question: "q1", context: "El alcalde habla.", options: ["A) pormestari", "B) opettaja", "C) lääkäri", "D) poliisi"], correct: "A", explanation: "x" },
      { id: 2, type: "meaning", question: "q2", context: "Otra vez el alcalde.",          options: ["A) pormestari", "B) kuski", "C) tiilenlatoja", "D) kokki"], correct: "A", explanation: "x" },
    ];
    setOpenAIResponse(dupFixture);
    const res = await request(app).post("/api/generate")
      .set("Authorization", "Bearer fake-test-token")
      .send({ level: "C", topic: "general vocabulary", language: "spanish", count: 2 });
    expect(res.status).toBe(200);
    // With the same mock returning duplicates twice, the handler surfaces warnings
    expect(res.body.warnings).toBeTruthy();
    expect(res.body.warnings.some(w => /duplicate-headword/.test(w))).toBe(true);
  });

  it("rejects a batch missing context on an item", async () => {
    const noCtx = [
      { id: 1, type: "meaning", question: "q1", options: ["A) pormestari", "B) opettaja", "C) lääkäri", "D) poliisi"], correct: "A", explanation: "x" },
      { id: 2, type: "meaning", question: "q2", context: "Voy a la biblioteca.", options: ["A) kirjasto", "B) kahvila", "C) kauppa", "D) teatteri"], correct: "A", explanation: "x" },
    ];
    setOpenAIResponse(noCtx);
    const res = await request(app).post("/api/generate")
      .set("Authorization", "Bearer fake-test-token")
      .send({ level: "C", topic: "general vocabulary", language: "spanish", count: 2 });
    expect(res.status).toBe(200);
    expect(res.body.warnings).toBeTruthy();
    expect(res.body.warnings.some(w => /missing-context/.test(w))).toBe(true);
  });
});

describe("POST /api/grammar-drill — response shape", () => {
  it("returns each exercise with question, correct, explanation", async () => {
    setOpenAIResponse(grammarFixture);
    const res = await request(app).post("/api/grammar-drill")
      .set("Authorization", "Bearer fake-test-token")
      .send({ level: "C", topic: "ser_estar", language: "spanish", count: 1 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.exercises)).toBe(true);
    for (const ex of res.body.exercises) {
      expect(ex).toHaveProperty("sentence");
      expect(ex).toHaveProperty("choices");
      expect(ex).toHaveProperty("correct");
      expect(ex).toHaveProperty("explanation");
    }
  });
});

describe("POST /api/grade — Pure math, no AI", () => {
  it("maps correct/total to a letter grade + returns percentage", async () => {
    const res = await request(app).post("/api/grade").send({ correct: 8, total: 10, level: "C" });
    expect(res.status).toBe(200);
    // The route uses a local mapping; we assert presence, not exact grade.
    expect(res.body).toHaveProperty("grade");
    expect(typeof res.body.grade).toBe("string");
    expect(res.body).toHaveProperty("pct");
    expect(typeof res.body.pct).toBe("number");
  });

  it("handles zero correct gracefully", async () => {
    const res = await request(app).post("/api/grade").send({ correct: 0, total: 10, level: "C" });
    expect(res.status).toBe(200);
    expect(res.body.pct).toBe(0);
  });
});

describe("Regression: _usage never leaks in any response", () => {
  it("vocab payload strips _usage before sending", async () => {
    setOpenAIResponse(vocabFixture);
    const res = await request(app).post("/api/generate")
      .set("Authorization", "Bearer fake-test-token")
      .send({ level: "C", topic: "general vocabulary" });
    expect(JSON.stringify(res.body)).not.toContain("_usage");
    expect(JSON.stringify(res.body)).not.toContain("prompt_tokens");
  });
});
