# Pass 6 — Implementation Plan (Step 2)

16 ordered commits. Every commit ends green: `npm test`, `npm run lint`, `node --check` on every touched JS file (per memory). Commits that touch `STATIC_ASSETS` bump `CACHE_VERSION` in `sw.js`.

Gates:
- **Gate A** — unit + coverage floor + visual regression wired into CI (C01–C07 + C14).
- **Gate B** — E2E + a11y per screen (C08–C13).
- **Gate C** — load, status, recovery, exam-day mode (C15–C18).

---

## Gate A — Unit + coverage + visual (commits 1–8)

### P6-C01 — unit test: `lib/exerciseComposer.js`
- Cover: seed vs. AI branch, prompt shape per each of 5 `exerciseTypes`, cache hit path, OpenAI timeout → bank fallback.
- Fixtures in `tests/fixtures/openai/composer/`.
- Acceptance: ≥85% line coverage on composer.

### P6-C02 — unit test: per-type graders in `lib/grading/`
- One test file per grader (`aukkotehtava`, `kaannos`, `lauseen-muodostus`, `yhdistaminen`, reading).
- Edge cases: empty input, leading/trailing whitespace, accented variants (á/a), capitalization, punctuation ignore rules.
- Acceptance: ≥90% branches on each grader.

### P6-C03 — unit test: `lib/seedBank.js`
- Shape validation for every bank entry (zod or manual).
- Per type, assert `bank(type, level)` returns ≥ N items for each supported CEFR level.
- Acceptance: catches a malformed entry if introduced.

### P6-C04 — unit test: `lib/weakness.js` + `lib/dailyCap.js` + `lib/paywall.js`
- Weakness: decay math, tie-breaking, min-sample guard.
- DailyCap: free-tier 15/day enforcement, reset boundary (Helsinki TZ).
- Paywall: Pro bypass, Y-tunnus gate routes to waitlist.

### P6-C05 — unit test: cache layer
- `training/cache-key.test.js` already covers key gen. Add TTL expiry + LRU-eviction tests.

### P6-C06 — unit test: client features drift
- Port shared SR math into `js/features/spacedRepetition.js` tests that pin parity with `lib/scheduler.js` (same inputs → same outputs). Prevents client/server drift.
- Also extend `hintLadder.test.js`: reveal penalty applied to final grade.

### P6-C07 — unit test: remaining routes
- Supertest coverage for `routes/exercises.js`, `routes/writing.js`, `routes/progress.js`, `routes/exam.js`, `routes/email.js` preference endpoints.
- Stripe/LemonSqueezy webhook signature verification test (fixture body + signed header).

### P6-C08 — vitest coverage thresholds in CI
- Add `coverage.thresholds { lines: 70, functions: 70, branches: 60 }` for `lib/**` + `middleware/**`.
- Wire `npm run test:unit -- --coverage` into `.github/workflows/ci.yml`.
- Fail CI on regression.

---

## Gate B — E2E + a11y (commits 9–13)

### P6-C09 — E2E: signup → placement → first exercise
- Playwright spec: fresh account (Mailinator-style fake address via env), verify email token read from Supabase test project, complete placement, land on first exercise, assert level persisted.

### P6-C10 — E2E: mock exam 45-min simulation
- Start full exam → fast-forward timer (Playwright clock) → auto-submit triggers → grading returns → summary page shows score + rubric.

### P6-C11 — E2E: SR review queue
- Seed due items via test-only endpoint → open `quickReview` → grade 5 items → confirm `next_due` updated.

### P6-C12 — E2E: offline + paywall cap
- Offline: load app, go offline, `offline.html` shown, go online, retry succeeds.
- Paywall: free account does 15 vocab items, 16th hits cap modal, modal CTA routes to waitlist.

### P6-C13 — a11y per SPA screen
- `tests/a11y.spec.js` using `@axe-core/playwright`. Loop over every route in `js/screens/`, navigate via app actions, run axe, fail on serious/critical violations.
- Generate `exercises/baselines/axe.json` artifact.

### P6-C14 — visual regression wired to CI (closes Pass 1 TODO)
- Add `npm run test:visual` script → Playwright `toHaveScreenshot` over key screens.
- Baselines in `exercises/baselines/visual/`.
- CI job uploads diffs on failure.

---

## Gate C — Reliability (commits 15–18)

### P6-C15 — load test
- k6 scenario in `testing/load/mixed-session.js`: 100 concurrent VUs, 10-minute ramp-hold, mixed (40% vocab, 20% writing grade, 20% SR, 10% placement, 10% reading).
- Report: p50/p95/p99 latency per endpoint, error rate, OpenAI 429 rate.
- Commit baseline to `testing/load/baseline.json`.
- Thresholds: p95 < 800ms for cached endpoints, < 4s for AI grading, error rate < 1%.

### P6-C16 — error-recovery audit + fix
- Grep every `fetch(` and `api.*` call in `js/**`, table to `RECOVERY.md`.
- Each must: (1) show Finnish error, (2) expose retry button, (3) preserve user input (no lost writing).
- Add `js/api.js` `retryable(fn, { attempts: 2 })` helper and wrap critical calls.
- Banner component for degraded mode.

### P6-C17 — `/status` endpoint + `public/status.html`
- `routes/status.js`: checks Supabase round-trip, OpenAI `/models` ping (cached 60s), cache hit ratio, last error timestamp, build SHA.
- Output JSON at `/api/status`, simple HTML at `/status.html` polling every 15s.
- No auth (public).
- Exclude from rate limiter.

### P6-C18 — exam-day mode feature flag
- Server-side flag `EXAM_WEEK=true` (env). When set:
  - `lib/exerciseComposer.js` forces bank-only path (no OpenAI).
  - `lib/writingGrading.js` switches to reduced prompt + higher timeout.
  - Banner on app: "Koeviikkotila — sisältö lukittu."
  - New-feature code paths guarded by `featureFlags.disabledDuringExamWeek` array.
- Unit test: with flag on, composer never calls OpenAI.
- Rollout doc in `EXAM-WEEK.md`.

---

## Open questions

1. **Supabase test project** — do we have a dedicated test instance, or do E2E tests need a reset-between-runs fixture in the shared dev DB? Affects C09 design.
2. **Email verify in E2E** — Resend in test mode vs. reading Supabase `auth.users.confirmation_token` directly? Latter is simpler.
3. **Load test origin** — run from local + GH Actions, or from a cloud k6 runner? Local is fine for baseline, not for true load.
4. **Exam-day mode scope** — is Pro-only content still available during exam week, or is everyone pinned to bank? Design says pin everyone; confirm.
5. **`/status` auth** — public OK, or basic-auth'd? Recommend public with no PII, but flag error counts only, not messages.
6. **Visual regression flake** — font rendering differs across runners. Pin Playwright chromium version and use `--ignore-snapshots` fallback?
