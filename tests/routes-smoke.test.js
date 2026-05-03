// Smoke + security tests for routes not yet covered: writing, exercises,
// progress, exam, email, payment placeholder. Focus:
//   1. Routes that require auth actually reject requests without a Bearer token.
//   2. Basic request-shape validation returns 400 for obviously-bad payloads.
//
// Deep happy-path coverage for AI-generation endpoints is out of scope for
// this commit — they require extensive OpenAI + Supabase orchestration mocks
// and belong in a dedicated integration suite.

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock("../supabase.js", () => ({
  default: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: { message: "no session" } })),
      admin: { getUserById: vi.fn(async () => ({ data: { user: null } })) },
    },
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      upsert: vi.fn(async () => ({ data: null, error: null })),
      update: () => ({ eq: vi.fn(async () => ({ data: null, error: null })) }),
      insert: vi.fn(async () => ({ data: null, error: null })),
    })),
  },
}));

vi.mock("../middleware/rateLimit.js", () => {
  const pass = (_req, _res, next) => next();
  return {
    authLimiter: pass,
    registerLimiter: pass,
    forgotPasswordLimiter: pass,
    aiLimiter: pass,
    aiStrictLimiter: pass,
    reportLimiter: pass,
  };
});

vi.mock("../middleware/costLimit.js", () => ({
  checkMonthlyCostLimit: (_req, _res, next) => next(),
}));

// ── App bootstrap ─────────────────────────────────────────────────────────

let request, express;
async function mount(path, routerPath) {
  const app = (await import("express")).default();
  app.use((await import("express")).default.json());
  const { default: router } = await import(routerPath);
  app.use(path, router);
  return app;
}

beforeEach(async () => {
  if (!request) {
    express = (await import("express")).default;
    request = (await import("supertest")).default;
  }
});

// ── Auth enforcement ──────────────────────────────────────────────────────

describe("auth enforcement on protected endpoints", () => {
  it("POST /api/writing/writing-task → 401 without token", async () => {
    const app = await mount("/api/writing", "../routes/writing.js");
    const res = await request(app).post("/api/writing/writing-task").send({});
    expect(res.status).toBe(401);
  });

  it("POST /api/writing/grade-writing → 401 without token", async () => {
    const app = await mount("/api/writing", "../routes/writing.js");
    const res = await request(app).post("/api/writing/grade-writing").send({});
    expect(res.status).toBe(401);
  });

  it("POST /api/exercises/generate → 401 without token", async () => {
    const app = await mount("/api/exercises", "../routes/exercises.js");
    const res = await request(app).post("/api/exercises/generate").send({});
    expect(res.status).toBe(401);
  });

  it("POST /api/progress → 401 without token", async () => {
    const app = await mount("/api", "../routes/progress.js");
    const res = await request(app).post("/api/progress").send({});
    expect(res.status).toBe(401);
  });

  it("POST /api/exam/start → 401 without token", async () => {
    const app = await mount("/api/exam", "../routes/exam.js");
    const res = await request(app).post("/api/exam/start").send({});
    expect(res.status).toBe(401);
  });

  it("GET /api/email/preferences → 401 without token", async () => {
    const app = await mount("/api/email", "../routes/email.js");
    const res = await request(app).get("/api/email/preferences");
    expect(res.status).toBe(401);
  });

  it("POST /api/stripe/create-checkout-session → 401 without token", async () => {
    const app = await mount("/api/stripe", "../routes/stripe.js");
    const res = await request(app).post("/api/stripe/create-checkout-session").send({});
    expect(res.status).toBe(401);
  });

  it("rejects malformed Authorization header", async () => {
    const app = await mount("/api/writing", "../routes/writing.js");
    const res = await request(app)
      .post("/api/writing/writing-task")
      .set("Authorization", "NotBearer abc")
      .send({});
    expect(res.status).toBe(401);
  });
});

// ── /grade/advisory now requires auth (L-SECURITY-2) ──────────────────────
// Previously this endpoint was public; anonymous callers could submit
// arbitrary `exerciseId` values and use the dispatcher response to
// enumerate seed-bank answers. Auth-gated since L-SECURITY-2.

describe("POST /api/exercises/grade/advisory — auth-gated", () => {
  it("returns 401 without a Bearer token", async () => {
    const app = await mount("/api/exercises", "../routes/exercises.js");
    const res = await request(app).post("/api/exercises/grade/advisory").send({});
    expect(res.status).toBe(401);
  });

  it("returns 401 even with a well-formed payload, when no token is sent", async () => {
    const app = await mount("/api/exercises", "../routes/exercises.js");
    const res = await request(app)
      .post("/api/exercises/grade/advisory")
      .send({ type: "aukkotehtava", studentAnswer: "hola" });
    expect(res.status).toBe(401);
  });
});

// ── Payment webhook placeholder (LemonSqueezy removed L-CLEANUP-1) ────────
// Stripe replacement lands in a future L-STRIPE-1 loop; until then the
// handler returns 410 unconditionally.

describe("handleWebhook placeholder", () => {
  it("returns 410 Gone (no signature verification while disabled)", async () => {
    const { handleWebhook } = await import("../routes/stripe.js");
    const app = express();
    app.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);
    const res = await request(app).post("/webhook").send(Buffer.from("{}"));
    expect(res.status).toBe(410);
  });
});
