# Plan 08 — Adaptive Engine Unification

**Status:** Deferred. Out of scope for Pass 2.5.
**Logged:** 2026-04-20 during Pass 2.5 pedagogy audit.

## Problem

Two adaptive level engines coexist in `lib/` with different thresholds and no reconciliation:

- **`lib/levelEngine.js`** — drives checkpoint UI, `POST /checkpoint/submit`, `GET /api/dashboard`. Thresholds: `CHECKPOINT_THRESHOLD = 0.70`, `CHECKPOINT_PASS = 0.80`, `LEVEL_DOWN_THRESHOLD = 0.40`.
- **`lib/adaptive.js`** — called from `routes/progress.js:73` on `POST /api/progress`. Uses `isPromotionReady()` / `isDemotionTriggered()` with finer-grained thresholds (minAvgPct, minSessionPct, minQuestions, minSessions, minDays, maxStdDev).

Both touch the same `user_level.current_level` field. Under certain session patterns the two systems can issue conflicting level-change recommendations — `lib/adaptive.js` fires a demotion that `lib/levelEngine.js` would not.

## Decision (Pass 2.5)

`lib/levelEngine.js` is canonical for all Pass 2.5 code. `lib/adaptive.js` marked legacy via header comment. No new imports from `lib/adaptive.js`.

## Cleanup scope (when this plan is executed)

1. Audit every import of `lib/adaptive.js` across the codebase.
2. For each call site: decide whether `lib/levelEngine.js` already covers it or whether the finer-grained logic in `lib/adaptive.js` is intentional and should be merged into `lib/levelEngine.js`.
3. Merge any intentional logic into `lib/levelEngine.js`; delete the call sites in `routes/progress.js`.
4. Delete `lib/adaptive.js`.
5. Run full test suite; manually verify a promotion/demotion scenario end-to-end.

## Risk

Low — `lib/adaptive.js` is called on `POST /api/progress` but its output (`promotionReady`, `demotionTriggered`) is currently used to set `user_level.current_level` only via the checkpoint flow. Removing it will not break any user-visible feature if `lib/levelEngine.js` checkpoint logic is intact.
