import { describe, it, expect, beforeEach, vi } from "vitest";

// Mutable supabase behaviour so each test can pick a scenario
const authState = {
  getUserResult: { data: { user: null }, error: { message: "Invalid JWT" } },
  adminUserByEmail: {},
};
const profileResult = { data: null, error: null };
const subscriptionResult = { data: null, error: null };

vi.mock("../supabase.js", () => ({
  default: {
    auth: {
      getUser: vi.fn(async (_token) => authState.getUserResult),
      admin: {
        getUserById: vi.fn(async (userId) => ({
          data: { user: authState.adminUserByEmail[userId] || null },
        })),
      },
    },
    from: (table) => {
      if (table === "user_profile") {
        return {
          select: () => ({
            eq: () => ({ single: async () => profileResult }),
          }),
        };
      }
      if (table === "subscriptions") {
        return {
          select: () => ({
            eq: () => ({ single: async () => subscriptionResult }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) };
    },
  },
}));

const { requireAuth, requirePro, softProGate, isPro } = await import("../middleware/auth.js");

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

beforeEach(() => {
  authState.getUserResult = { data: { user: null }, error: { message: "Invalid JWT" } };
  authState.adminUserByEmail = {};
  profileResult.data = null;
  profileResult.error = null;
  subscriptionResult.data = null;
  subscriptionResult.error = null;
  delete process.env.PRO_TEST_LIST;
  delete process.env.TEST_PRO_EMAILS;
  delete process.env.FREE_TEST_LIST;
  delete process.env.TEST_FREE_EMAILS;
});

describe("requireAuth", () => {
  it("rejects when no Authorization header", async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects non-Bearer schemes", async () => {
    const req = { headers: { authorization: "Basic abc123" } };
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects when supabase reports an auth error", async () => {
    authState.getUserResult = { data: { user: null }, error: { message: "expired" } };
    const req = { headers: { authorization: "Bearer expired" } };
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
  });

  it("attaches req.user and calls next() for a valid token", async () => {
    authState.getUserResult = {
      data: { user: { id: "abc", email: "x@y.com" } },
      error: null,
    };
    const req = { headers: { authorization: "Bearer good" } };
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req, res, next);
    expect(req.user).toEqual({ userId: "abc", email: "x@y.com" });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("isPro", () => {
  it("returns false by default (no sub, no file, no env)", async () => {
    authState.adminUserByEmail["u1"] = { email: "someone@example.com" };
    const ok = await isPro("u1");
    expect(ok).toBe(false);
  });

  it("returns true for an active subscription row", async () => {
    authState.adminUserByEmail["u1"] = { email: "someone@example.com" };
    subscriptionResult.data = { active: true };
    const ok = await isPro("u1");
    expect(ok).toBe(true);
  });

  it("returns true for an unexpired summer package", async () => {
    authState.adminUserByEmail["u1"] = { email: "someone@example.com" };
    profileResult.data = { summer_package_expires_at: new Date(Date.now() + 86400000).toISOString() };
    const ok = await isPro("u1");
    expect(ok).toBe(true);
  });

  it("expired summer package does not grant Pro", async () => {
    authState.adminUserByEmail["u1"] = { email: "someone@example.com" };
    profileResult.data = { summer_package_expires_at: new Date(Date.now() - 86400000).toISOString() };
    subscriptionResult.data = { active: false };
    const ok = await isPro("u1");
    expect(ok).toBe(false);
  });

  it("TEST_PRO_EMAILS env var grants Pro without a real subscription", async () => {
    process.env.TEST_PRO_EMAILS = "qa@puheo.fi, other@puheo.fi";
    authState.adminUserByEmail["u1"] = { email: "qa@puheo.fi" };
    const ok = await isPro("u1");
    expect(ok).toBe(true);
  });

  it("TEST_FREE_EMAILS env var forces free even when a subscription is active", async () => {
    process.env.TEST_FREE_EMAILS = "qa-free@puheo.fi";
    authState.adminUserByEmail["u1"] = { email: "qa-free@puheo.fi" };
    subscriptionResult.data = { active: true };
    const ok = await isPro("u1");
    expect(ok).toBe(false);
  });

  it("email match is case-insensitive", async () => {
    process.env.TEST_PRO_EMAILS = "Qa@Puheo.FI";
    authState.adminUserByEmail["u1"] = { email: "qa@puheo.fi" };
    const ok = await isPro("u1");
    expect(ok).toBe(true);
  });
});

describe("requirePro", () => {
  it("403s when the user is not Pro", async () => {
    authState.adminUserByEmail["u1"] = { email: "a@b.com" };
    subscriptionResult.data = { active: false };
    const req = { user: { userId: "u1" } };
    const res = mockRes();
    const next = vi.fn();
    await requirePro(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes through when the user is Pro", async () => {
    authState.adminUserByEmail["u1"] = { email: "a@b.com" };
    subscriptionResult.data = { active: true };
    const req = { user: { userId: "u1" } };
    const res = mockRes();
    const next = vi.fn();
    await requirePro(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("softProGate", () => {
  it("allows unauthenticated requests through", async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();
    await softProGate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("ignores invalid tokens (still passes through)", async () => {
    authState.getUserResult = { data: { user: null }, error: { message: "bad" } };
    const req = { headers: { authorization: "Bearer broken" } };
    const res = mockRes();
    const next = vi.fn();
    await softProGate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("403s an authenticated free user", async () => {
    authState.getUserResult = {
      data: { user: { id: "u1", email: "free@test.fi" } },
      error: null,
    };
    authState.adminUserByEmail["u1"] = { email: "free@test.fi" };
    subscriptionResult.data = { active: false };
    const req = { headers: { authorization: "Bearer good" } };
    const res = mockRes();
    const next = vi.fn();
    await softProGate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("passes authenticated pro users through", async () => {
    authState.getUserResult = {
      data: { user: { id: "u1", email: "pro@test.fi" } },
      error: null,
    };
    authState.adminUserByEmail["u1"] = { email: "pro@test.fi" };
    subscriptionResult.data = { active: true };
    const req = { headers: { authorization: "Bearer good" } };
    const res = mockRes();
    const next = vi.fn();
    await softProGate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toBe("u1");
  });
});
