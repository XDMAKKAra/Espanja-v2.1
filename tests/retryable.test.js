// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { retryable } from "../js/api.js";

beforeEach(() => vi.clearAllMocks());

describe("retryable", () => {
  it("returns the first successful response without retrying", async () => {
    const fn = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const res = await retryable(fn, { attempts: 3, baseDelayMs: 1 });
    expect(res.ok).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry on 4xx responses (client error)", async () => {
    const fn = vi.fn().mockResolvedValue({ ok: false, status: 400 });
    const res = await retryable(fn, { attempts: 3, baseDelayMs: 1 });
    expect(res.status).toBe(400);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx and succeeds on the next attempt", async () => {
    const fn = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const res = await retryable(fn, { attempts: 3, baseDelayMs: 1 });
    expect(res.ok).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on network error and recovers", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const res = await retryable(fn, { attempts: 3, baseDelayMs: 1 });
    expect(res.ok).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("returns the last 5xx response after exhausting attempts", async () => {
    const fn = vi.fn().mockResolvedValue({ ok: false, status: 502 });
    const res = await retryable(fn, { attempts: 2, baseDelayMs: 1 });
    expect(res.status).toBe(502);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("rethrows the last error when all attempts throw", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(retryable(fn, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
