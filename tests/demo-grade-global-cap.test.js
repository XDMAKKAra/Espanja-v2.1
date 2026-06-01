// L-V332 hardening — the global daily cap on demo grades is the hard cost
// ceiling that survives IP rotation / X-Forwarded-For spoofing. Distinct IPs
// pass the per-IP limiter, so once the global cap is reached every visitor
// (even a first-timer) gets the "demo paused" message.
//
// Runs in its own file so the in-memory rate-limit buckets and the
// DEMO_GRADE_DAILY_CAP env are isolated from the per-IP test.

import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";

delete process.env.NODE_ENV;
delete process.env.VERCEL;
process.env.DEMO_GRADE_FAKE = "1";
process.env.DEMO_GRADE_DAILY_CAP = "2";

vi.mock("../supabase.js", () => {
  const builder = {};
  ["select", "eq", "gte", "order", "limit", "in"].forEach((m) => { builder[m] = vi.fn(() => builder); });
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

const TEXT =
  "Ayer fui a la playa con mi familia y comimos mucho. Hizo mucho calor y nadamos en el mar toda la tarde.";

function grade(app, ip) {
  return request(app)
    .post("/api/writing/demo-grade")
    .set("X-Forwarded-For", ip)
    .send({ lang: "es", text: TEXT });
}

describe("POST /api/writing/demo-grade — global daily cap", () => {
  let app;
  beforeAll(async () => { app = await buildApp(); });

  it("pauses the demo for everyone once the global cap (2) is reached", async () => {
    const r1 = await grade(app, "1.1.1.1");
    const r2 = await grade(app, "2.2.2.2");
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    // Third distinct visitor — passes the per-IP gate but the global budget
    // is spent.
    const r3 = await grade(app, "3.3.3.3");
    expect(r3.status).toBe(429);
    expect(r3.body.error).toMatch(/tauolla/i);
  });
});
