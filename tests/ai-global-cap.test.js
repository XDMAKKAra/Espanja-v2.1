// L-V341 — global daily AI cost ceiling (aiGlobalDailyLimiter).
//
// The per-user limiters cap one user; the in-memory AUTHED_AI_DAILY_CAP
// backstop caps one serverless instance. This DB-backed limiter is the one
// true cross-instance budget, and unlike the per-user limiters it is
// fail-CLOSED. We prove two things the brief requires:
//   (a) once the global cap is spent, further calls 429 — even from a fresh
//       user on a different route (the bucket is shared via staticKey).
//   (b) when the DB check errors, the global cap DENIES (fail-closed) while a
//       per-user limiter still ALLOWS (fail-open). The wallet is protected
//       without locking an individual user out on a transient blip.
//
// Runs on the PROD path (VERCEL=1) so checkRateLimit hits the Supabase-backed
// branch; a switchable rpc mock lets us simulate both "counting" and "DB down".

import { describe, it, expect, vi } from "vitest";

process.env.VERCEL = "1";
process.env.AI_DAILY_GLOBAL_CAP = "2";
// Keep the in-memory backstop far out of the way so anything we observe comes
// from the DB-backed global limiter, never the per-instance backstop.
process.env.AUTHED_AI_DAILY_CAP = "1000000";

const state = vi.hoisted(() => ({ mode: "count", counter: 0 }));

vi.mock("../supabase.js", () => {
  const client = {
    from: () => ({
      select: () => ({ eq: () => ({ gte: async () => ({ data: [], error: null }) }) }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
    }),
    // "count" → atomic increment, returns the running sliding-window total.
    // "error" → simulate a DB failure (RPC missing / Supabase blip).
    rpc: vi.fn(async () => {
      if (state.mode === "error") return { data: null, error: { message: "db down" } };
      state.counter += 1;
      return { data: state.counter, error: null };
    }),
  };
  return { default: client, adminClient: client };
});

const mod = await import("../middleware/rateLimit.js");
// Restore env so sibling test files that import rateLimit fresh in this worker
// get the defaults, not our tiny cap / prod flag.
delete process.env.VERCEL;
delete process.env.AI_DAILY_GLOBAL_CAP;
delete process.env.AUTHED_AI_DAILY_CAP;

function mockRes() {
  const res = { _status: 200, _headers: {}, _body: null };
  res.set = (k, v) => { res._headers[k] = v; return res; };
  res.status = (c) => { res._status = c; return res; };
  res.json = (b) => { res._body = b; return res; };
  return res;
}

async function call(limiter, req) {
  const res = mockRes();
  let nextCalled = false;
  await limiter(req, res, () => { nextCalled = true; });
  return { status: res._status, nextCalled, body: res._body };
}

describe("aiGlobalDailyLimiter — shared cross-route cost ceiling", () => {
  it("blocks once the global cap (2) is spent, even for a fresh user on a different route", async () => {
    state.mode = "count";
    state.counter = 0;

    // Three calls from DIFFERENT users on DIFFERENT routes. The per-user window
    // (20/h) would allow all three; only the shared global bucket can block.
    const r1 = await call(mod.aiGlobalDailyLimiter, { path: "/generate", headers: {}, ip: "1.0.0.1", user: { userId: "a" } });
    const r2 = await call(mod.aiGlobalDailyLimiter, { path: "/reading-task", headers: {}, ip: "1.0.0.2", user: { userId: "b" } });
    const r3 = await call(mod.aiGlobalDailyLimiter, { path: "/grammar-drill", headers: {}, ip: "1.0.0.3", user: { userId: "c" } });

    expect(r1.nextCalled).toBe(true);
    expect(r2.nextCalled).toBe(true);
    expect(r3.nextCalled).toBe(false);
    expect(r3.status).toBe(429);
    expect(r3.body.error).toMatch(/tauolla/i);
  });

  it("fails CLOSED on a DB error (denies), while the per-user limiter fails OPEN", async () => {
    state.mode = "error";

    // Global cost ceiling: DB unverifiable → deny.
    const g = await call(mod.aiGlobalDailyLimiter, { path: "/generate", headers: {}, ip: "9.9.9.9", user: { userId: "x" } });
    expect(g.nextCalled).toBe(false);
    expect(g.status).toBe(429);

    // Same DB error, per-user limiter degrades to the in-memory window and
    // ALLOWS — availability for the individual user is preserved.
    const u = await call(mod.aiLimiter, { path: "/generate", headers: {}, ip: "9.9.9.9", user: { userId: "y" } });
    expect(u.nextCalled).toBe(true);
  });
});
