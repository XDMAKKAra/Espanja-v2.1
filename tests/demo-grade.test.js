// Backend coverage for the anonymous landing writing demo (L-V332).
// Exercises the REAL demoGradeLimiter (memory path) + input validation
// without calling OpenAI (DEMO_GRADE_FAKE=1 returns a canned grade).
//
// Note: this file does NOT mock middleware/rateLimit.js (unlike helpers/app.js)
// because the whole point is to verify the per-IP daily cap actually fires.

import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";

// Force the in-memory rate-limit path + the no-cost demo grade.
delete process.env.NODE_ENV;
delete process.env.VERCEL;
process.env.DEMO_GRADE_FAKE = "1";

vi.mock("../supabase.js", () => {
  const builder = {};
  const chain = ["select", "eq", "gte", "order", "limit", "in"];
  chain.forEach((m) => { builder[m] = vi.fn(() => builder); });
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.upsert = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.insert = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.then = (resolve) => resolve({ data: [], error: null, count: 0 });
  const client = { from: vi.fn(() => builder), rpc: vi.fn(async () => ({ data: null, error: null })) };
  return { default: client, adminClient: client };
});

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => { req.user = { userId: "u" }; next(); },
  requirePro: (_req, _res, next) => next(),
  checkFeatureAccess: async () => ({ allowed: true, tier: "mestari" }),
  incrementFreeUsage: async () => ({}),
}));

vi.mock("../middleware/costLimit.js", () => ({
  checkMonthlyCostLimit: (_req, _res, next) => next(),
}));

async function buildApp() {
  const express = (await import("express")).default;
  const { default: writingRoutes } = await import("../routes/writing.js");
  const app = express();
  app.use(express.json());
  app.use("/api", writingRoutes);
  return app;
}

const VALID_TEXT =
  "Ayer fui a la playa con mi familia y comimos mucho. Hizo mucho calor y nadamos en el mar toda la tarde.";

describe("POST /api/writing/demo-grade", () => {
  let app;
  beforeAll(async () => { app = await buildApp(); });

  it("rejects an unsupported language with 400 (and does not consume the limit)", async () => {
    const res = await request(app)
      .post("/api/writing/demo-grade")
      .send({ lang: "it", text: VALID_TEXT });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/kieli/i);
  });

  it("rejects text under 80 chars with the min-length message", async () => {
    const res = await request(app)
      .post("/api/writing/demo-grade")
      .send({ lang: "es", text: "Hola, fui a la playa." });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/80 merkkiä/);
  });

  it("grades a valid sample, then 429s the second attempt from the same IP", async () => {
    const first = await request(app)
      .post("/api/writing/demo-grade")
      .send({ lang: "es", text: VALID_TEXT });
    expect(first.status).toBe(200);
    expect(typeof first.body.score).toBe("number");
    expect(first.body.scoreMax).toBe(18);
    expect(Array.isArray(first.body.errors)).toBe(true);

    const second = await request(app)
      .post("/api/writing/demo-grade")
      .send({ lang: "es", text: VALID_TEXT });
    expect(second.status).toBe(429);
    expect(second.body.error).toMatch(/jo kokeillut/i);
  });
});
