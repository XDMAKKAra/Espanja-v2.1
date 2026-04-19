# Pass 6 — Testing + reliability · Step 2 (build)

Step 1 produced `testing/COVERAGE.md`, `PLAN.md`, `RECOVERY.md`, `EXAM-WEEK.md`. Read first.

## Approved modifications from marcel

> _Fill before running._

## Commit sequence

Follow `testing/PLAN.md`. Rules:
- Test-first always.
- One flow per commit for E2E tests.
- A11y fixes ship per screen, not batched.
- Load test runs in a dedicated commit with results committed to `testing/load-results/`.

## Phase gates

**Gate A — Unit coverage.** Grading, adaptive, placement, exerciseComposer, cache, seeds. Coverage report ≥80% on these modules.

**Gate B — E2E coverage.** Top 5 student flows, Playwright tests, run green in CI.

**Gate C — A11y.** Every app + marketing screen axe-core clean.

**Gate D — Error recovery.** Every fetch wraps in retry helper; every screen has visible error states; tested by chaos-injection (mock network failures in tests).

**Gate E — Load test + status page + exam-week mode.** 100-concurrent-user scenario run, results committed. `/status` endpoint live. Exam-week feature flag wired and tested.

## Quality bar

- Coverage ≥80% on critical modules.
- All 5 E2E flows green in CI.
- axe-core zero violations, zero serious/critical.
- Load test p95 ≤2s under 100 concurrent users; 0 5xx errors; OpenAI throttle handled.
- Status page shows real-time component health.

## Done

- All 5 gates merged.
- CI gates every PR on test green + a11y + lint.
- `testing/POSTSHIP.md` one-pager.
