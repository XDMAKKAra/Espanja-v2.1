import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { __memCacheInternals } from "../lib/openai.js";

const { cache, get, set, max } = __memCacheInternals;

beforeEach(() => {
  cache.clear();
});
afterEach(() => {
  vi.useRealTimers();
  cache.clear();
});

describe("in-memory cache — TTL expiry", () => {
  it("returns cached value within TTL", () => {
    set("k1", { hello: "world" }, 60_000);
    expect(get("k1")).toEqual({ hello: "world" });
  });

  it("returns null once TTL elapses", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    set("k1", { v: 1 }, 1000);
    vi.setSystemTime(999);
    expect(get("k1")).toEqual({ v: 1 });
    vi.setSystemTime(1001);
    expect(get("k1")).toBeNull();
  });

  it("deletes the expired entry on read (self-cleanup)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    set("k1", { v: 1 }, 500);
    vi.setSystemTime(1000);
    get("k1"); // triggers delete
    expect(cache.has("k1")).toBe(false);
  });

  it("returns null for unknown key", () => {
    expect(get("missing")).toBeNull();
  });
});

describe("in-memory cache — LRU-ish eviction at CACHE_MAX_SIZE", () => {
  it("CACHE_MAX_SIZE is 100", () => {
    expect(max).toBe(100);
  });

  it("evicts the oldest entry when size hits the cap", () => {
    for (let i = 0; i < max; i++) {
      set(`k${i}`, { i }, 60_000);
    }
    expect(cache.size).toBe(max);
    expect(cache.has("k0")).toBe(true);

    // Adding one more should evict k0 (first inserted)
    set("overflow", { v: "new" }, 60_000);
    expect(cache.size).toBe(max);
    expect(cache.has("k0")).toBe(false);
    expect(cache.has("overflow")).toBe(true);
  });

  it("evicts in insertion order for successive inserts past the cap", () => {
    for (let i = 0; i < max + 5; i++) {
      set(`k${i}`, { i }, 60_000);
    }
    // First 5 evicted
    for (let i = 0; i < 5; i++) {
      expect(cache.has(`k${i}`)).toBe(false);
    }
    // Last batch retained
    for (let i = 5; i < max + 5; i++) {
      expect(cache.has(`k${i}`)).toBe(true);
    }
  });

  it("overwriting an existing key does not bump size or evict", () => {
    set("k1", { v: 1 }, 60_000);
    set("k1", { v: 2 }, 60_000);
    expect(cache.size).toBe(1);
    expect(get("k1")).toEqual({ v: 2 });
  });
});
