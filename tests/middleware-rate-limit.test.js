// Test the in-memory path of the rate-limit middleware. The Supabase-backed
// variant only kicks in when NODE_ENV=production or VERCEL is set, so these
// tests run under the dev-path and exercise the bucket counter + sliding
// window + per-user keying.

import { describe, it, expect, beforeEach, vi } from "vitest";

// Ensure we take the memory path (NOT_PROD).
delete process.env.NODE_ENV;
delete process.env.VERCEL;

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

function mockRes() {
  const res = { _status: 200, _headers: {}, _body: null };
  res.set = (k, v) => { res._headers[k] = v; return res; };
  res.status = (c) => { res._status = c; return res; };
  res.json = (b) => { res._body = b; return res; };
  return res;
}

async function drive(limiter, reqFactory, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const req = reqFactory(i);
    const res = mockRes();
    let nextCalled = false;
    await limiter(req, res, () => { nextCalled = true; });
    results.push({ status: res._status, nextCalled, remaining: res._headers["X-RateLimit-Remaining"] });
  }
  return results;
}

describe("createLimiter — in-memory mode", () => {
  beforeEach(() => {
    // The module keeps its _memBuckets Map in closure. Use a unique path per
    // test so tests don't interfere with each other.
  });

  it("authLimiter allows up to 10 per minute per key", async () => {
    let i = 0;
    const path = `/auth-${++i}`;
    const results = await drive(
      mod.authLimiter,
      () => ({ ip: "1.1.1.1", path, headers: {} }),
      11,
    );
    const passed = results.filter(r => r.nextCalled);
    const blocked = results.filter(r => !r.nextCalled);
    expect(passed).toHaveLength(10);
    expect(blocked).toHaveLength(1);
    expect(blocked[0].status).toBe(429);
  });

  it("aiLimiter keys by userId, not by IP", async () => {
    // user A: 20 allowed, 21st blocked.
    const pathA = "/ai-shared";
    const a = await drive(mod.aiLimiter, () => ({
      ip: "9.9.9.9", path: pathA, headers: {},
      user: { userId: "user-a" },
    }), 21);
    // user B from the same IP: fresh bucket, still allowed
    const b = await drive(mod.aiLimiter, () => ({
      ip: "9.9.9.9", path: pathA, headers: {},
      user: { userId: "user-b" },
    }), 1);

    expect(a.filter(r => r.nextCalled)).toHaveLength(20);
    expect(a.filter(r => r.status === 429)).toHaveLength(1);
    expect(b[0].nextCalled).toBe(true);
  });

  it("sets X-RateLimit-Remaining header", async () => {
    const res = mockRes();
    const req = { ip: "2.2.2.2", path: "/remaining-test", headers: {} };
    let nextCalled = false;
    await mod.authLimiter(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(res._headers["X-RateLimit-Limit"]).toBe("10");
    expect(Number(res._headers["X-RateLimit-Remaining"])).toBeGreaterThanOrEqual(9);
  });

  it("forgotPasswordLimiter caps at 3 per hour", async () => {
    const results = await drive(
      mod.forgotPasswordLimiter,
      () => ({ ip: "3.3.3.3", path: "/fp", headers: {} }),
      4,
    );
    expect(results.filter(r => r.nextCalled)).toHaveLength(3);
    expect(results[3].status).toBe(429);
  });

  it("registerLimiter caps at 5 per hour", async () => {
    const results = await drive(
      mod.registerLimiter,
      () => ({ ip: "4.4.4.4", path: "/reg", headers: {} }),
      6,
    );
    expect(results.filter(r => r.nextCalled)).toHaveLength(5);
    expect(results[5].status).toBe(429);
  });

  it("aiStrictLimiter caps at 10 per hour per user", async () => {
    const results = await drive(
      mod.aiStrictLimiter,
      () => ({ ip: "5.5.5.5", path: "/ai-strict", headers: {}, user: { userId: "strict-user" } }),
      11,
    );
    expect(results.filter(r => r.nextCalled)).toHaveLength(10);
    expect(results[10].status).toBe(429);
  });

  it("reportLimiter caps at 10 per user per hour", async () => {
    const results = await drive(
      mod.reportLimiter,
      () => ({ ip: "6.6.6.6", path: "/report", headers: {}, user: { userId: "reporter" } }),
      11,
    );
    expect(results.filter(r => r.nextCalled)).toHaveLength(10);
    expect(results[10].status).toBe(429);
  });

  it("isolates buckets by request path", async () => {
    // Hit /path-a to exhaustion, /path-b should still be fresh
    const a = await drive(
      mod.authLimiter,
      () => ({ ip: "7.7.7.7", path: "/path-a", headers: {} }),
      11,
    );
    expect(a[10].status).toBe(429);

    const b = await drive(
      mod.authLimiter,
      () => ({ ip: "7.7.7.7", path: "/path-b", headers: {} }),
      1,
    );
    expect(b[0].nextCalled).toBe(true);
  });
});
