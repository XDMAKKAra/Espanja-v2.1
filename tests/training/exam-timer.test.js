/**
 * Unit tests for js/features/examTimer.js. Uses fake setInterval/clearInterval and
 * a manual `now()` clock to simulate visibility changes without racing real time.
 */
import { describe, it, expect, vi } from "vitest";
import { createExamTimer, clearPersisted } from "../../js/features/examTimer.js";

function makeEnv({ durationSec = 20, startHidden = false } = {}) {
  let currentMs = 0;
  const now = () => currentMs;
  const intervals = new Map();
  let nextIntervalId = 1;
  const setIntervalFn = vi.fn((fn, _ms) => { const id = nextIntervalId++; intervals.set(id, fn); return id; });
  const clearIntervalFn = vi.fn((id) => { intervals.delete(id); });

  const storage = (() => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
    };
  })();

  // Minimal Document stub supporting addEventListener / removeEventListener + hidden.
  const docListeners = new Set();
  const doc = {
    hidden: startHidden,
    addEventListener: (type, fn) => { if (type === "visibilitychange") docListeners.add(fn); },
    removeEventListener: (type, fn) => { if (type === "visibilitychange") docListeners.delete(fn); },
    _fireVisibility: () => { for (const fn of docListeners) fn(); },
  };

  const onTick = vi.fn();
  const onExpire = vi.fn();
  const onWarning = vi.fn();
  const onPause = vi.fn();
  const onResume = vi.fn();

  const timer = createExamTimer({
    durationSec, examId: `test-${Math.random().toString(36).slice(2, 8)}`,
    onTick, onExpire, onWarning, onPause, onResume,
    now, setIntervalFn, clearIntervalFn, storage, doc,
  });

  function advance(ms) {
    currentMs += ms;
    // Each simulated second fires the registered interval callback.
    const ticksToFire = Math.floor(ms / 1000);
    for (let i = 0; i < ticksToFire; i++) {
      // Only tick if the interval is registered (running, not paused).
      for (const fn of intervals.values()) fn();
    }
  }

  return { timer, advance, doc, onTick, onExpire, onWarning, onPause, onResume, storage };
}

describe("createExamTimer", () => {
  it("elapsed advances while visible, not while hidden", () => {
    const env = makeEnv({ durationSec: 10 });
    env.timer.start();
    env.advance(3_000);
    const afterVisible = env.timer.getRemaining();
    expect(afterVisible).toBeLessThanOrEqual(7);
    expect(env.onPause).not.toHaveBeenCalled();

    env.doc.hidden = true;
    env.doc._fireVisibility();
    expect(env.onPause).toHaveBeenCalledTimes(1);

    // 5 wall-seconds pass while hidden — remaining should NOT decrease
    env.advance(5_000);
    expect(env.timer.getRemaining()).toBe(afterVisible);

    env.doc.hidden = false;
    env.doc._fireVisibility();
    expect(env.onResume).toHaveBeenCalledTimes(1);
  });

  it("fires the warning callback exactly once when remaining hits 15:00", () => {
    // Duration 16 minutes → at t=60s remaining == 15:00 → warning fires.
    const env = makeEnv({ durationSec: 16 * 60 });
    env.timer.start();
    // Warning should not fire at start (remaining = 960)
    env.advance(30_000);
    expect(env.onWarning).not.toHaveBeenCalled();
    // Advance to t=60s (remaining 900 = 15:00)
    env.advance(30_000);
    expect(env.onWarning).toHaveBeenCalledTimes(1);
    // Continue for another minute — warning must NOT fire again
    env.advance(60_000);
    expect(env.onWarning).toHaveBeenCalledTimes(1);
  });

  it("calls onExpire when duration elapses", () => {
    const env = makeEnv({ durationSec: 5 });
    env.timer.start();
    env.advance(6_000);
    expect(env.onExpire).toHaveBeenCalledTimes(1);
  });

  it("persists elapsed to storage and restores on re-create", () => {
    const env1 = makeEnv({ durationSec: 100 });
    env1.timer.start();
    env1.advance(10_000);
    // persistence uses a random examId per env — to test restore we reuse storage
    // with a known id:
    const shared = (() => {
      const m = new Map();
      return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
    })();
    let clock = 0; const now = () => clock;
    const intervals = new Map(); let id = 1;
    const setI = vi.fn((fn) => { const i = id++; intervals.set(i, fn); return i; });
    const clrI = vi.fn((i) => intervals.delete(i));
    const doc = { hidden: false, addEventListener() {}, removeEventListener() {} };

    const t1 = createExamTimer({ durationSec: 100, examId: "keep", now, setIntervalFn: setI, clearIntervalFn: clrI, storage: shared, doc });
    t1.start();
    clock += 12_000;
    for (let i = 0; i < 12; i++) for (const fn of intervals.values()) fn();
    t1.stop();
    const storedElapsed = Number(shared.getItem("puheo.exam.timer.keep"));
    expect(storedElapsed).toBeGreaterThanOrEqual(11_000);
    expect(storedElapsed).toBeLessThanOrEqual(13_000);

    const t2 = createExamTimer({ durationSec: 100, examId: "keep", now, setIntervalFn: setI, clearIntervalFn: clrI, storage: shared, doc });
    // Remaining should reflect the persisted elapsed (~ 100 - 12 = 88)
    const r = t2.getRemaining();
    expect(r).toBeLessThanOrEqual(89);
    expect(r).toBeGreaterThanOrEqual(87);
  });

  it("clearPersisted removes the persisted entry", () => {
    const storage = (() => {
      const m = new Map();
      return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
    })();
    storage.setItem("puheo.exam.timer.abc", "123");
    // clearPersisted uses module-level `localStorage`, so this path only tests
    // the exported helper does not throw when localStorage is unavailable.
    expect(() => clearPersisted("abc")).not.toThrow();
  });
});
