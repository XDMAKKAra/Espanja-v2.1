# Pass 6 — Testing + reliability · Step 1 (design only)

Goal: students who sit the exam cannot be hitting bugs. By exam day this app must not break on real devices, real flows, real load.

**Prerequisites:** Passes 1–5 merged.

> **TODO (from Pass 1 Step 1):** wire `npm run test:visual` (Playwright visual regression, baselines at `exercises/baselines/`) into CI as part of Gate A of this pass. Harness landed locally in Pass 1 Gate D Commit 11 but was deliberately not connected to GitHub Actions.

## Skills

- `.claude/skills/webapp-testing/SKILL.md`

## Scope

Design a full test + reliability plan. Step 1 maps current coverage, identifies gaps, writes a plan. Step 2 implements.

## Deliverables

### 1. `testing/COVERAGE.md`
Audit existing test coverage:
- Unit tests (vitest): what's covered, what's not. Target function-level coverage per critical module (grading, adaptive, placement, exerciseComposer).
- E2E tests (Playwright): which flows have tests, which don't.
- A11y (axe-core): which screens are clean, which fail.
- Load: has this app ever been load-tested? (Probably no.)

### 2. `testing/PLAN.md`
Ordered commit sequence. Target 12–16 commits. Cover:
- Unit test gaps for grading, adaptive router, placement, exerciseComposer, cache, seeds.
- E2E for top 5 student flows: signup → placement → first exercise; daily vocab session; writing submit → AI grade; mock exam 45-min simulation; SR review.
- A11y run clean on every app screen + marketing screen.
- Error-recovery coverage: every fetch in the app handles network failure with a user-visible retry.
- Load test scenario: 100 concurrent users doing mixed sessions for 10 minutes. Measure latency p95, error rate, OpenAI throttling.
- Status page: a tiny `/status` endpoint that exposes component health (db reachable, OpenAI reachable, cache hit rate, last error). Rendered as simple HTML in `public/status.html`.
- Exam-day mode: feature flag that disables new-feature code paths and pins to known-good bank content for exam week.

### 3. `testing/RECOVERY.md`
Catalog of failure modes + how the app recovers:
- OpenAI timeout → bank fallback → cached response → Finnish error message with retry.
- Supabase down → read-only mode with a banner → queue writes for retry.
- Push service down → ignore silently.
- Per failure mode: code location of current handling (if any), gap, fix.

### 4. `testing/EXAM-WEEK.md`
Plan for the week of 28.9.2026:
- Pre-exam-week freeze: no deploys after 21.9.2026 except critical.
- Exam-week dashboard: who's online, error rate, grading latency.
- On-call rotation (you).
- Rollback plan if something breaks during exam week.

## Stop here

Reply with coverage summary, PLAN.md, open questions, approval line.
