// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { deriveWeakness, gapSentence, WEAKNESS_SENTENCES, WEAKNESS_FALLBACK } from "../lib/weakness.js";
import {
  FREE_DAILY_CAP, CAP_BANNER_COPY,
  incrementDailyCount, getDailyCount, shouldShowCapBanner, isPro,
} from "../lib/dailyCap.js";
import { shouldFireUpsell, FREQUENCY_CAP_MS, UPSELL_TRIGGERS } from "../lib/paywall.js";

describe("deriveWeakness", () => {
  it("returns fallback for null/undefined input", () => {
    expect(deriveWeakness(null).sentence).toBe(WEAKNESS_FALLBACK);
    expect(deriveWeakness(undefined).category).toBeNull();
  });

  it("prefers lowest-correct-rate category from answers", () => {
    const r = deriveWeakness({
      answers: [
        { category: "ser_vs_estar", correct: false },
        { category: "ser_vs_estar", correct: false },
        { category: "ser_vs_estar", correct: true },
        { category: "por_vs_para", correct: true },
        { category: "por_vs_para", correct: true },
      ],
    });
    expect(r.category).toBe("ser_vs_estar");
    expect(r.sentence).toBe(WEAKNESS_SENTENCES.ser_vs_estar);
  });

  it("requires min 2 items per category (ignores single-item categories)", () => {
    const r = deriveWeakness({
      answers: [
        { category: "ser_vs_estar", correct: false }, // only 1 item — ignored
        { category: "por_vs_para", correct: false },
        { category: "por_vs_para", correct: true },
      ],
    });
    expect(r.category).toBe("por_vs_para");
  });

  it("falls back to scoreByLevel when no answers carry categories", () => {
    const r = deriveWeakness({
      scoreByLevel: { A: { total: 10, pct: 90 }, B: { total: 10, pct: 40 } },
    });
    expect(r.category).toBe("level_B");
    expect(r.sentence).toMatch(/Tason B/);
  });

  it("returns fallback when all levels score ≥ 75%", () => {
    const r = deriveWeakness({
      scoreByLevel: { A: { total: 10, pct: 90 }, B: { total: 10, pct: 80 } },
    });
    expect(r.sentence).toBe(WEAKNESS_FALLBACK);
  });

  it("maps unknown category to fallback sentence", () => {
    const r = deriveWeakness({
      answers: [
        { category: "made_up_category", correct: false },
        { category: "made_up_category", correct: false },
      ],
    });
    expect(r.category).toBe("made_up_category");
    expect(r.sentence).toBe(WEAKNESS_FALLBACK);
  });
});

describe("gapSentence", () => {
  it("current below target → vähän alle", () => {
    expect(gapSentence("A", "B")).toMatch(/alle/);
  });
  it("current at target → juuri", () => {
    expect(gapSentence("B", "B")).toMatch(/Juuri/);
  });
  it("current above target → yli", () => {
    expect(gapSentence("M", "B")).toMatch(/Yli/);
  });
  it("unknown letters return empty string", () => {
    expect(gapSentence("Q", "B")).toBe("");
    expect(gapSentence("A", "Z")).toBe("");
  });
});

describe("dailyCap", () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.__IS_PRO;
  });
  afterEach(() => vi.useRealTimers());

  it("getDailyCount returns 0 when nothing stored", () => {
    expect(getDailyCount()).toBe(0);
  });

  it("incrementDailyCount starts at 1 and accumulates", () => {
    expect(incrementDailyCount()).toBe(1);
    expect(incrementDailyCount()).toBe(2);
    expect(incrementDailyCount()).toBe(3);
    expect(getDailyCount()).toBe(3);
  });

  it("resets count when Helsinki date changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-23T10:00:00Z"));
    expect(incrementDailyCount()).toBe(1);
    expect(incrementDailyCount()).toBe(2);

    // Next day (Helsinki time)
    vi.setSystemTime(new Date("2026-04-24T10:00:00Z"));
    expect(incrementDailyCount()).toBe(1);
    expect(getDailyCount()).toBe(1);
  });

  it("getDailyCount returns 0 when stored date is stale", () => {
    localStorage.setItem("puheo_exercises_today", JSON.stringify({ date: "2020-01-01", count: 99 }));
    expect(getDailyCount()).toBe(0);
  });

  it("tolerates corrupted localStorage entry", () => {
    localStorage.setItem("puheo_exercises_today", "not-json");
    expect(getDailyCount()).toBe(0);
    expect(incrementDailyCount()).toBe(0);
  });

  it("shouldShowCapBanner false for Pro user at any count", () => {
    window.__IS_PRO = true;
    for (let i = 0; i < 20; i++) incrementDailyCount();
    expect(shouldShowCapBanner()).toBe(false);
  });

  it("shouldShowCapBanner false below cap", () => {
    for (let i = 0; i < FREE_DAILY_CAP - 1; i++) incrementDailyCount();
    expect(shouldShowCapBanner()).toBe(false);
  });

  it("shouldShowCapBanner true at and above cap for free users", () => {
    for (let i = 0; i < FREE_DAILY_CAP; i++) incrementDailyCount();
    expect(shouldShowCapBanner()).toBe(true);
    incrementDailyCount();
    expect(shouldShowCapBanner()).toBe(true);
  });

  it("isPro reads window.__IS_PRO", () => {
    expect(isPro()).toBe(false);
    window.__IS_PRO = true;
    expect(isPro()).toBe(true);
    window.__IS_PRO = "truthy-but-not-true";
    expect(isPro()).toBe(false); // strict equality
  });

  it("CAP_BANNER_COPY is Finnish and mentions 15", () => {
    expect(CAP_BANNER_COPY).toMatch(/15/);
    expect(CAP_BANNER_COPY).toMatch(/Pro/);
  });
});

describe("shouldFireUpsell", () => {
  const T = UPSELL_TRIGGERS.LOCKED_TILE_WRITING;

  it("blocks during first session (sessionCount 0)", () => {
    const r = shouldFireUpsell({ sessionCount: 0, lastFiredAt: null, trigger: T });
    expect(r).toEqual({ allow: false, reason: "first_session" });
  });

  it("blocks when within 48h frequency cap", () => {
    const now = 1_700_000_000_000;
    const r = shouldFireUpsell({
      sessionCount: 3, lastFiredAt: now - 1000, trigger: T, now,
    });
    expect(r.reason).toBe("frequency_cap");
  });

  it("allows exactly after frequency cap", () => {
    const now = 1_700_000_000_000;
    const r = shouldFireUpsell({
      sessionCount: 3, lastFiredAt: now - FREQUENCY_CAP_MS - 1, trigger: T, now,
    });
    expect(r.allow).toBe(true);
  });

  it("blocks DAILY_CAP trigger as it's banner-only", () => {
    const r = shouldFireUpsell({
      sessionCount: 5, lastFiredAt: null, trigger: UPSELL_TRIGGERS.DAILY_CAP,
    });
    expect(r.reason).toBe("daily_cap_is_banner_not_modal");
  });

  it("allows fresh trigger after sessions + no prior fire", () => {
    const r = shouldFireUpsell({ sessionCount: 2, lastFiredAt: null, trigger: T });
    expect(r).toEqual({ allow: true, reason: null });
  });

  it("UPSELL_TRIGGERS enum has all expected keys", () => {
    expect(Object.values(UPSELL_TRIGGERS)).toEqual(
      expect.arrayContaining([
        "first_session_end",
        "locked_tile_writing",
        "locked_tile_reading",
        "daily_cap",
        "week2_dashboard",
      ]),
    );
  });
});
