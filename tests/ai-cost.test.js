import { describe, it, expect, beforeEach, vi } from "vitest";

// Controllable Supabase mock: tests can override the insert / select chain
const insertMock = vi.fn(async () => ({ data: null, error: null }));
let selectResult = { data: [], error: null };
const fromMock = vi.fn(() => ({
  insert: (row) => insertMock(row),
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      gte: vi.fn(async () => selectResult),
    })),
  })),
}));

vi.mock("../supabase.js", () => ({
  default: { from: fromMock },
}));

const { calculateCost, logAiUsage, getMonthlyUsage, checkCostLimit } =
  await import("../lib/aiCost.js");

beforeEach(() => {
  insertMock.mockClear();
  fromMock.mockClear();
  selectResult = { data: [], error: null };
});

describe("calculateCost", () => {
  it("is zero when both token counts are zero", () => {
    expect(calculateCost(0, 0)).toBe(0);
  });

  it("prices input and output tokens per gpt-4o-mini rates", () => {
    // 1M input = $0.15, 1M output = $0.60
    expect(calculateCost(1_000_000, 0)).toBeCloseTo(0.15, 6);
    expect(calculateCost(0, 1_000_000)).toBeCloseTo(0.60, 6);
    expect(calculateCost(1_000_000, 1_000_000)).toBeCloseTo(0.75, 6);
  });

  it("rounds to six decimals", () => {
    // 1 input token = 1.5e-7 → rounds to 0.000000 (below 1e-6)
    expect(calculateCost(1, 0)).toBe(0);
    // 10 input tokens = 1.5e-6 → rounds to 0.000002
    expect(calculateCost(10, 0)).toBe(0.000002);
  });
});

describe("logAiUsage", () => {
  it("inserts a usage row using prompt_tokens/completion_tokens fields", async () => {
    await logAiUsage("user-1", "vocab", { prompt_tokens: 500, completion_tokens: 1000 });
    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertMock.mock.calls[0][0];
    expect(row.user_id).toBe("user-1");
    expect(row.endpoint).toBe("vocab");
    expect(row.input_tokens).toBe(500);
    expect(row.output_tokens).toBe(1000);
    expect(row.cost_usd).toBe(calculateCost(500, 1000));
  });

  it("also accepts inputTokens/outputTokens field names", async () => {
    await logAiUsage("user-1", "grammar", { inputTokens: 100, outputTokens: 200 });
    const row = insertMock.mock.calls[0][0];
    expect(row.input_tokens).toBe(100);
    expect(row.output_tokens).toBe(200);
  });

  it("is a no-op when usage is missing", async () => {
    await logAiUsage("user-1", "vocab", null);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("allows null user_id (unauthenticated usage)", async () => {
    await logAiUsage(null, "vocab", { prompt_tokens: 10, completion_tokens: 10 });
    expect(insertMock.mock.calls[0][0].user_id).toBeNull();
  });
});

describe("getMonthlyUsage", () => {
  it("returns zero when there are no rows", async () => {
    selectResult = { data: [], error: null };
    const r = await getMonthlyUsage("user-1");
    expect(r).toEqual({ totalCost: 0, callCount: 0 });
  });

  it("sums cost_usd across rows", async () => {
    selectResult = { data: [{ cost_usd: 0.10 }, { cost_usd: 0.05 }, { cost_usd: 0.02 }], error: null };
    const r = await getMonthlyUsage("user-1");
    expect(r.totalCost).toBeCloseTo(0.17, 6);
    expect(r.callCount).toBe(3);
  });

  it("falls back to zero on a DB error", async () => {
    selectResult = { data: null, error: { message: "boom" } };
    const r = await getMonthlyUsage("user-1");
    expect(r).toEqual({ totalCost: 0, callCount: 0 });
  });
});

describe("checkCostLimit", () => {
  it("enforces the $0.50 free-tier limit", async () => {
    selectResult = { data: [{ cost_usd: 0.50 }], error: null };
    const r = await checkCostLimit("user-1", false);
    expect(r.exceeded).toBe(true);
    expect(r.limit).toBe(0.5);
  });

  it("allows free-tier users under the limit", async () => {
    selectResult = { data: [{ cost_usd: 0.25 }], error: null };
    const r = await checkCostLimit("user-1", false);
    expect(r.exceeded).toBe(false);
  });

  it("enforces the $5.00 pro limit (not free limit) for pro users", async () => {
    selectResult = { data: [{ cost_usd: 4.99 }], error: null };
    const r = await checkCostLimit("user-1", true);
    expect(r.exceeded).toBe(false);
    expect(r.limit).toBe(5);
  });

  it("blocks pro users once they hit the pro limit", async () => {
    selectResult = { data: [{ cost_usd: 5.00 }], error: null };
    const r = await checkCostLimit("user-1", true);
    expect(r.exceeded).toBe(true);
  });
});
