/**
 * Shared test harness. Builds an Express app with:
 *  - auth middleware stubbed (req.user = test-user)
 *  - rate-limit + cost-limit middleware passed through
 *  - Supabase mocked as an empty-data chainable builder
 *  - OpenAI mocked via a settable response
 *
 * Usage (top of a .test.js file):
 *
 *   import { buildApp, setOpenAIResponse, getCallOpenAIMock } from "../helpers/app.js";
 *   beforeAll(async () => { app = await buildApp(); });
 *   it("...", async () => { setOpenAIResponse([{...}]); ... });
 */
import { vi } from "vitest";

vi.mock("../../supabase.js", () => {
  const auth = {
    getUser: vi.fn(async () => ({ data: { user: { id: "test-user-id", email: "test@puheo.test" } }, error: null })),
    admin: { getUserById: vi.fn(async () => ({ data: { user: { id: "test-user-id", email: "test@puheo.test" } } })) },
  };
  const fromStub = () => {
    const builder = {};
    const chain = ["select", "eq", "neq", "gt", "gte", "lt", "lte", "in", "not", "is",
                   "or", "and", "filter", "order", "range", "like", "ilike", "contains",
                   "containedBy", "textSearch", "match"];
    chain.forEach((m) => { builder[m] = vi.fn(() => builder); });
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

// Settable OpenAI response. The callOpenAI mock reads from this module-level var.
let _nextOpenAIResponse = [];
export function setOpenAIResponse(payload) { _nextOpenAIResponse = payload; }

const _callOpenAIMock = vi.fn(async () => {
  const src = _nextOpenAIResponse;
  const payload = Array.isArray(src) ? [...src] : { ...src };
  payload._usage = { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 };
  return payload;
});
export function getCallOpenAIMock() { return _callOpenAIMock; }

vi.mock("../../lib/openai.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    callOpenAI: _callOpenAIMock,
    getUserProfileContext: vi.fn(async () => ""),
  };
});

vi.mock("../../middleware/rateLimit.js", () => {
  const pass = (_req, _res, next) => next();
  return {
    aiLimiter: pass, aiStrictLimiter: pass, authLimiter: pass, registerLimiter: pass,
    forgotPasswordLimiter: pass, reportLimiter: pass, default: { aiLimiter: pass },
  };
});

vi.mock("../../middleware/costLimit.js", () => ({
  checkMonthlyCostLimit: (_req, _res, next) => next(),
}));

vi.mock("../../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => { req.user = { userId: "test-user-id", email: "test@puheo.test" }; next(); },
  requirePro: (_req, _res, next) => next(),
  isPro: async () => true,
  softProGate: (_req, _res, next) => next(),
  softReadingGate: (req, _res, next) => { req.isPro = true; next(); },
  incrementReadingPieces: async () => 1,
  FREE_READING_PIECES: 2,
}));

export async function buildApp() {
  const express = (await import("express")).default;
  const { default: exerciseRoutes } = await import("../../routes/exercises.js");
  const { default: writingRoutes } = await import("../../routes/writing.js");
  const { default: adaptiveRoutes } = await import("../../routes/adaptive.js");
  const { default: progressRoutes } = await import("../../routes/progress.js");
  const { default: examRoutes } = await import("../../routes/exam.js");
  const app = express();
  app.use(express.json());
  // Mount in the same order as api/index.js so route collision behavior matches prod
  app.use("/api", exerciseRoutes);
  app.use("/api", writingRoutes);
  app.use("/api", adaptiveRoutes);
  app.use("/api", progressRoutes);
  app.use("/api/exam", examRoutes);
  return app;
}
