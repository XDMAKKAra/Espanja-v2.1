/**
 * Exam timer with pause-on-blur, 15-min warning, and localStorage persistence.
 *
 * Usage:
 *   const timer = createExamTimer({
 *     durationSec: 3 * 60 * 60,
 *     examId: "demo-session-123",
 *     onTick: (remaining) => updateUI(remaining),
 *     onExpire: () => submitExam(),
 *     onWarning: () => showFifteenMinuteModal(),   // fires once at 15:00 remaining
 *     onPause: () => showPausedOverlay(),
 *     onResume: () => hidePausedOverlay(),
 *   });
 *   timer.start();   // attaches visibilitychange listener
 *   timer.pause();   // explicit pause
 *   timer.resume();
 *   timer.stop();    // detaches listener + clears interval
 *   timer.getRemaining();
 *
 * Time elapsed is persisted to localStorage under `puheo.exam.timer.<examId>`
 * so a page reload resumes at the right place. `clearPersisted(examId)` is
 * exported for explicit cleanup after the exam finishes.
 */

const STORAGE_PREFIX = "puheo.exam.timer.";
const WARNING_AT_SEC = 15 * 60; // fire warning when <= 15:00 remaining

export function clearPersisted(examId) {
  try { localStorage.removeItem(STORAGE_PREFIX + examId); } catch { /* ignore */ }
}

export function createExamTimer({
  durationSec,
  examId,
  onTick = () => {},
  onExpire = () => {},
  onWarning = () => {},
  onPause = () => {},
  onResume = () => {},
  // Injectable for tests — defaults to real globals in the browser.
  now = () => Date.now(),
  setIntervalFn = typeof window !== "undefined" ? window.setInterval : setInterval,
  clearIntervalFn = typeof window !== "undefined" ? window.clearInterval : clearInterval,
  storage = typeof localStorage !== "undefined" ? localStorage : null,
  // Document event surface — also injectable for tests.
  doc = typeof document !== "undefined" ? document : null,
} = {}) {
  let intervalId = null;
  let running = false;
  let paused = false;
  let warningFired = false;
  let elapsedMs = 0;            // total elapsed counted while visible
  let lastResumeAt = null;      // Date.now() at most recent resume/start
  const durationMs = durationSec * 1000;

  // Restore from storage on construct
  if (examId && storage) {
    try {
      const raw = storage.getItem(STORAGE_PREFIX + examId);
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n) && n >= 0 && n <= durationMs) elapsedMs = n;
      }
    } catch { /* ignore */ }
  }

  function persist() {
    if (!examId || !storage) return;
    try { storage.setItem(STORAGE_PREFIX + examId, String(Math.floor(elapsedMs))); } catch { /* ignore */ }
  }

  function computeElapsedMs() {
    if (!running || paused || lastResumeAt == null) return elapsedMs;
    return elapsedMs + (now() - lastResumeAt);
  }

  function getRemaining() {
    return Math.max(0, Math.ceil((durationMs - computeElapsedMs()) / 1000));
  }

  function tick() {
    const totalMs = computeElapsedMs();
    // Fold wall-clock elapsed into the canonical elapsedMs on every tick so
    // persistence reflects actual progress, not just integer seconds.
    elapsedMs = totalMs;
    lastResumeAt = now();
    persist();

    const remaining = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));
    onTick(remaining);

    if (!warningFired && remaining <= WARNING_AT_SEC && remaining > 0) {
      warningFired = true;
      onWarning();
    }

    if (elapsedMs >= durationMs) {
      stop();
      onExpire();
    }
  }

  function onVisibilityChange() {
    if (doc?.hidden) internalPause();
    else internalResume();
  }

  function internalPause() {
    if (!running || paused) return;
    elapsedMs = computeElapsedMs();
    lastResumeAt = null;
    paused = true;
    if (intervalId) { clearIntervalFn(intervalId); intervalId = null; }
    persist();
    onPause();
  }

  function internalResume() {
    if (!running || !paused) return;
    paused = false;
    lastResumeAt = now();
    intervalId = setIntervalFn(tick, 1000);
    onResume();
  }

  function start() {
    if (running) return;
    running = true;
    paused = false;
    lastResumeAt = now();
    intervalId = setIntervalFn(tick, 1000);
    if (doc?.addEventListener) doc.addEventListener("visibilitychange", onVisibilityChange);
  }

  function pause() { internalPause(); }
  function resume() { internalResume(); }

  function stop() {
    if (!running) return;
    elapsedMs = computeElapsedMs();
    lastResumeAt = null;
    running = false;
    paused = false;
    if (intervalId) { clearIntervalFn(intervalId); intervalId = null; }
    if (doc?.removeEventListener) doc.removeEventListener("visibilitychange", onVisibilityChange);
    persist();
  }

  return {
    start, pause, resume, stop,
    getRemaining,
    // Test / debug surface
    _state: () => ({ running, paused, elapsedMs: computeElapsedMs(), warningFired }),
  };
}
