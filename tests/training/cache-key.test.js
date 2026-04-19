import { describe, it, expect } from "vitest";
import { getCacheKey, CACHE_TTL_MS_GRADER, CACHE_TTL_MS_GENERATOR, OPENAI_MODEL } from "../../lib/openai.js";

describe("getCacheKey (Commit 7)", () => {
  it("produces a SHA-256 hex digest (64 chars, 0-9a-f)", () => {
    const k = getCacheKey("hello", 2000);
    expect(k).toMatch(/^[0-9a-f]{64}$/);
  });

  it("two prompts differing ONLY past char 200 produce different keys (old bug)", () => {
    const preamble = "a".repeat(250);
    const p1 = preamble + "user-A-profile-context";
    const p2 = preamble + "user-B-profile-context";
    expect(getCacheKey(p1, 2000)).not.toBe(getCacheKey(p2, 2000));
  });

  it("same prompt + different maxTokens → different keys", () => {
    expect(getCacheKey("hello", 500)).not.toBe(getCacheKey("hello", 2000));
  });

  it("same prompt + different model → different keys", () => {
    expect(getCacheKey("hello", 2000, "gpt-4o")).not.toBe(getCacheKey("hello", 2000, "gpt-4o-mini"));
  });

  it("same inputs → same key (deterministic)", () => {
    expect(getCacheKey("hello", 2000, OPENAI_MODEL)).toBe(getCacheKey("hello", 2000, OPENAI_MODEL));
  });

  it("TTL split: generator TTL > grader TTL", () => {
    expect(CACHE_TTL_MS_GENERATOR).toBeGreaterThan(CACHE_TTL_MS_GRADER);
    // 24h vs 30min
    expect(CACHE_TTL_MS_GENERATOR).toBe(24 * 60 * 60 * 1000);
    expect(CACHE_TTL_MS_GRADER).toBe(30 * 60 * 1000);
  });
});
