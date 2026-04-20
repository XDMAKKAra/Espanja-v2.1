import { describe, it, expect } from "vitest";
import {
  EXAM_DATE,
  examCap,
  deriveState,
  sm2,
  bandToQuality,
  daysUntilExam,
} from "../lib/scheduler.js";

// ─── bandToQuality ──────────────────────────────────────────────────────────

describe("bandToQuality", () => {
  it("taydellinen → 5", () => expect(bandToQuality("taydellinen")).toBe(5));
  it("ymmarrettava → 3", () => expect(bandToQuality("ymmarrettava")).toBe(3));
  it("lahella → 2 (no reset)", () => expect(bandToQuality("lahella")).toBe(2));
  it("vaarin → 0", () => expect(bandToQuality("vaarin")).toBe(0));
  it("unknown → 0", () => expect(bandToQuality("")).toBe(0));
});

// ─── examCap ───────────────────────────────────────────────────────────────

describe("examCap", () => {
  it("uncapped when exam is far away (200 days)", () => {
    const now = new Date(EXAM_DATE.getTime() - 200 * 24 * 60 * 60 * 1000);
    expect(examCap(30, now)).toBe(30);
    expect(examCap(60, now)).toBe(60);
  });

  it("capped to max 21 days when 30 days until exam", () => {
    const now = new Date(EXAM_DATE.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(examCap(30, now)).toBe(21);
    expect(examCap(10, now)).toBe(10); // under cap unchanged
  });

  it("capped aggressively within 14 days", () => {
    const now = new Date(EXAM_DATE.getTime() - 9 * 24 * 60 * 60 * 1000);
    // left=9, ceil(9/3)=3
    expect(examCap(30, now)).toBe(3);
    expect(examCap(2, now)).toBe(2);  // under cap unchanged
  });

  it("returns 1 when exam is today or past", () => {
    expect(examCap(10, EXAM_DATE)).toBe(1);
    const past = new Date(EXAM_DATE.getTime() + 1 * 24 * 60 * 60 * 1000);
    expect(examCap(10, past)).toBe(1);
  });

  it("interval never exceeds days_until_exam - 1", () => {
    const now = new Date(EXAM_DATE.getTime() - 100 * 24 * 60 * 60 * 1000);
    const capped = examCap(200, now);
    expect(capped).toBeLessThanOrEqual(99);
  });
});

// ─── deriveState ────────────────────────────────────────────────────────────

describe("deriveState", () => {
  it("new card (no reviews)", () =>
    expect(deriveState({ ease_factor: 2.5, interval_days: 0, repetitions: 0, last_quality: null })).toBe("new"));

  it("learning — first two reps", () =>
    expect(deriveState({ ease_factor: 2.5, interval_days: 1, repetitions: 1, last_quality: 5 })).toBe("learning"));

  it("learning — interval < 7", () =>
    expect(deriveState({ ease_factor: 2.5, interval_days: 6, repetitions: 3, last_quality: 5 })).toBe("learning"));

  it("lapsed — quality < 3", () =>
    expect(deriveState({ ease_factor: 2.5, interval_days: 1, repetitions: 0, last_quality: 2 })).toBe("lapsed"));

  it("mastered — high ease, long interval, good quality", () =>
    expect(deriveState({ ease_factor: 2.6, interval_days: 21, repetitions: 5, last_quality: 5 })).toBe("mastered"));

  it("review — normal range", () =>
    expect(deriveState({ ease_factor: 2.2, interval_days: 10, repetitions: 4, last_quality: 3 })).toBe("review"));
});

// ─── sm2 ────────────────────────────────────────────────────────────────────

describe("sm2", () => {
  const farFuture = new Date(EXAM_DATE.getTime() - 200 * 24 * 60 * 60 * 1000);
  const base = { ease_factor: 2.5, interval_days: 0, repetitions: 0 };

  it("quality 5: first rep → interval 1", () => {
    const r = sm2(base, 5, farFuture);
    expect(r.repetitions).toBe(1);
    expect(r.interval_days).toBe(1);
    expect(r.last_quality).toBe(5);
  });

  it("quality 5: second rep → interval 6", () => {
    const r = sm2({ ...base, repetitions: 1, interval_days: 1 }, 5, farFuture);
    expect(r.interval_days).toBe(6);
  });

  it("quality 5: third rep → interval grows via ease factor", () => {
    const r = sm2({ ...base, repetitions: 2, interval_days: 6 }, 5, farFuture);
    expect(r.interval_days).toBeGreaterThan(6);
  });

  it("quality 0 (vaarin): resets repetitions and interval", () => {
    const r = sm2({ ease_factor: 2.5, interval_days: 20, repetitions: 5 }, 0, farFuture);
    expect(r.repetitions).toBe(0);
    expect(r.interval_days).toBe(1);
  });

  it("quality 2 (lahella): resets (< 3) but ease factor doesn't tank as hard as 0", () => {
    const r2 = sm2({ ...base }, 2, farFuture);
    const r0 = sm2({ ...base }, 0, farFuture);
    expect(r2.ease_factor).toBeGreaterThan(r0.ease_factor);
  });

  it("interval capped when exam is near (30 days)", () => {
    const near = new Date(EXAM_DATE.getTime() - 30 * 24 * 60 * 60 * 1000);
    const card = { ease_factor: 2.5, interval_days: 30, repetitions: 5 };
    const r = sm2(card, 5, near);
    expect(r.interval_days).toBeLessThanOrEqual(21);
  });

  it("state included in result", () => {
    const r = sm2(base, 5, farFuture);
    expect(r.state).toBeDefined();
  });

  it("next_review is a YYYY-MM-DD string", () => {
    const r = sm2(base, 5, farFuture);
    expect(r.next_review).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
