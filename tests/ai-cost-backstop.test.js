// L-V339 P2 — DB-independent global daily backstop for authenticated AI.
// Both the Supabase rate limiter and the monthly cost limit fail OPEN on a DB
// error, so a Supabase outage would otherwise remove every AI cost ceiling for
// logged-in users. This in-memory backstop must still bite. We set a tiny cap
// via env BEFORE importing the module and prove the limiter 429s from the
// backstop, not from the per-user window (which would allow far more).

import { describe, it, expect, vi } from "vitest";

delete process.env.NODE_ENV;
delete process.env.VERCEL;
process.env.AUTHED_AI_DAILY_CAP = "3";

// Supabase mock that always "succeeds" and allows — so any blocking we observe
// can only come from the in-memory backstop, never the DB-backed limiter.
vi.mock("../supabase.js", () => ({
  default: {
    from: () => ({
      select: () => ({ eq: () => ({ gte: async () => ({ data: [], error: null }) }) }),
      upsert: async () => ({ data: null, error: null }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({ eq: () => ({ eq: async () => ({ data: null, error: null }) }) }),
    }),
    rpc: async () => ({ data: null, error: null }),
  },
}));

const mod = await import("../middleware/rateLimit.js");
// The module captured cap=3 at import; restore env so other test files that
// import rateLimit fresh in this worker get the default cap, not 3.
delete process.env.AUTHED_AI_DAILY_CAP;

function mockRes() {
  const res = { _status: 200, _headers: {}, _body: null };
  res.set = (k, v) => { res._headers[k] = v; return res; };
  res.status = (c) => { res._status = c; return res; };
  res.json = (b) => { res._body = b; return res; };
  return res;
}

describe("authed-AI daily backstop (P2)", () => {
  it("refuses authed AI calls once the global daily cap is spent, regardless of per-user window", async () => {
    const results = [];
    // 4 calls from DIFFERENT users → per-user window (20/h) would allow ALL of
    // them. Only the global backstop (cap=3) can block the 4th.
    for (let i = 0; i < 4; i++) {
      const res = mockRes();
      let nextCalled = false;
      await mod.aiLimiter(
        { ip: `10.0.0.${i}`, path: "/ai-backstop", headers: {}, user: { userId: `u-${i}` } },
        res,
        () => { nextCalled = true; },
      );
      results.push({ status: res._status, nextCalled });
    }
    expect(results.slice(0, 3).every((r) => r.nextCalled)).toBe(true);
    expect(results[3].nextCalled).toBe(false);
    expect(results[3].status).toBe(429);
  });
});
