import { describe, it, expect, beforeEach, vi } from "vitest";

const isProMock = vi.fn();
const checkCostLimitMock = vi.fn();

vi.mock("../middleware/auth.js", () => ({
  isPro: (...args) => isProMock(...args),
}));
vi.mock("../lib/aiCost.js", () => ({
  checkCostLimit: (...args) => checkCostLimitMock(...args),
}));
vi.mock("../supabase.js", () => ({
  default: { from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }) },
}));

const { checkMonthlyCostLimit } = await import("../middleware/costLimit.js");

function mockRes() {
  const res = { _status: 200, _body: null };
  res.status = (c) => { res._status = c; return res; };
  res.json = (b) => { res._body = b; return res; };
  return res;
}

beforeEach(() => {
  isProMock.mockReset();
  checkCostLimitMock.mockReset();
});

describe("checkMonthlyCostLimit", () => {
  it("skips the check for unauthenticated requests", async () => {
    const req = {};
    const res = mockRes();
    const next = vi.fn();
    await checkMonthlyCostLimit(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(isProMock).not.toHaveBeenCalled();
  });

  it("passes through when the user is under the limit", async () => {
    isProMock.mockResolvedValue(false);
    checkCostLimitMock.mockResolvedValue({ exceeded: false, totalCost: 0.1, limit: 0.5 });
    const req = { user: { userId: "u1" } };
    const res = mockRes();
    const next = vi.fn();
    await checkMonthlyCostLimit(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._status).toBe(200);
  });

  it("403s a free user over the free limit with a pro upsell message", async () => {
    isProMock.mockResolvedValue(false);
    checkCostLimitMock.mockResolvedValue({ exceeded: true, totalCost: 0.55, limit: 0.5 });
    const req = { user: { userId: "u1" } };
    const res = mockRes();
    const next = vi.fn();
    await checkMonthlyCostLimit(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
    expect(res._body.error).toBe("pro_required_cost_limit");
    expect(res._body.message).toMatch(/Päivitä Pro/);
  });

  it("403s a pro user over the pro limit with a support message", async () => {
    isProMock.mockResolvedValue(true);
    checkCostLimitMock.mockResolvedValue({ exceeded: true, totalCost: 5.10, limit: 5.0 });
    const req = { user: { userId: "u1" } };
    const res = mockRes();
    const next = vi.fn();
    await checkMonthlyCostLimit(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
    expect(res._body.error).toBe("pro_cost_limit");
    expect(res._body.message).toMatch(/Ota yhteyttä tukeen/);
  });

  it("fails open (calls next) when the cost check throws", async () => {
    isProMock.mockRejectedValue(new Error("network down"));
    const req = { user: { userId: "u1" } };
    const res = mockRes();
    const next = vi.fn();
    await checkMonthlyCostLimit(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
