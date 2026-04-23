# Pass 6 — Coverage Audit (Step 1 design)

Snapshot date: 2026-04-23. Pre-implementation audit of what tests exist today vs. what's needed before exam day (28.9.2026).

## 1. Unit tests (vitest)

Test runner: `vitest run`. 53 test files in `tests/` + 14 in `tests/training/` + 2 in `tests/grading/`. Output parses but coverage reporter is not wired (no `--coverage` flag, no thresholds in `vitest.config.js`).

### Covered (good)

| Module | Test file(s) | Notes |
|---|---|---|
| `lib/adaptive.js` | `adaptive.test.js`, `training/adaptive-routing.test.js` | routing rules exercised |
| `lib/placement.js` + `placementQuestions.js` | `placement.test.js`, `placement-persistence.test.js`, `routes-placement.test.js` | decent |
| `lib/scheduler.js` (SRS) | `scheduler.test.js` | |
| `lib/levelEngine.js` | `level-engine.test.js`, `learning-path.test.js` | |
| `lib/sessionComposer.js` | `sessionComposer.test.js` | |
| `lib/scaffoldEngine.js` | `scaffold-engine.test.js` | |
| `lib/mistakeTaxonomy.js` | `mistake-taxonomy.test.js` | |
| `lib/grammarScope.js` | `training/grammar-scope.test.js` | |
| `lib/openai.js` (JSON repair, fixtures) | `openai-json-repair.test.js`, `openai-fixtures.test.js` | |
| `lib/aiCost.js` | `ai-cost.test.js`, `middleware-cost-limit.test.js` | |
| `middleware/auth.js` + `rateLimit.js` | `middleware-auth.test.js`, `middleware-rate-limit.test.js` | |
| Writing grading | `writing-grading.test.js`, `training/writing-grader.test.js`, `grading/dispatcher.test.js` | |
| Routes: auth, placement, profile, push, sr | `routes-*.test.js` | supertest-style |
| Design tokens, typography, buttons, bottom-nav etc. | many UI unit tests | DOM via happy-dom |

### Gaps (must close before exam)

| Module | Gap | Commit target |
|---|---|---|
| `lib/exerciseComposer.js` | No direct unit test; only exercised via integration. Need: prompt shape per `exerciseTypes`, seed vs. AI branching, error fallback path. | P6-C01 |
| `lib/grading/*` (non-dispatcher) | Only dispatcher tested. Per-type graders (`aukkotehtava`, `kaannos`, `lauseen-muodostus`, `yhdistaminen`, reading) lack unit coverage of edge cases (empty, whitespace, accented variants, case). | P6-C02 |
| `lib/seedBank.js` | No test. Critical for exam-week fallback. Need: shape validation of every bank entry + 100% of types return ≥N seeds. | P6-C03 |
| `lib/weakness.js` | No test. Feeds adaptive + email drips. | P6-C04 |
| `lib/dailyCap.js` | No test. Paywall-critical. | P6-C05 |
| `lib/paywall.js` | No test. | P6-C05 |
| `lib/learningPath.js` | Partial via `learning-path.test.js` but no checkpoint-batching edge cases beyond `training/checkpoint-batching.test.js` happy path. | — (accept) |
| Cache layer (OpenAI response cache, `training/cache-key.test.js`) | Key derivation tested; eviction + TTL not. | P6-C06 |
| `js/features/spacedRepetition.js` (client) | No test. Client SR calculation drifts from server `lib/scheduler.js`. | P6-C07 |
| `js/features/hintLadder.js` | `hintLadder.test.js` exists but doesn't cover "reveal penalty applied to grade". | P6-C07 |
| `routes/exercises.js`, `routes/writing.js`, `routes/progress.js`, `routes/stripe.js`, `routes/email.js`, `routes/exam.js` | Zero route-level tests. | P6-C08, P6-C09 |
| `sw.js` | Untested. Cache bump rule (per CLAUDE.md memory) relies on humans. | P6-C10 |

### Coverage instrumentation

- `vitest.config.js` has no `coverage` config. Add `coverage: { provider: 'v8', thresholds: { lines: 70, functions: 70, branches: 60 } }` scoped to `lib/**` and `middleware/**`. UI token tests inflate numbers — exclude `js/**` from the threshold check but keep measuring it.

## 2. E2E tests (Playwright)

Config: `playwright.config.js`. Existing specs:

- `tests/e2e-landing-smoke.spec.js` — landing page loads.
- `tests/training/e2e-vocab.spec.js` — one vocab session.
- `tests/training/e2e-writing.spec.js` — writing submit → grade.

### Gaps — top 5 student flows, only 2 partially covered

| Flow | Status | Target |
|---|---|---|
| Signup → email verify → placement → first exercise | **missing** | P6-C11 |
| Daily vocab session (start → 10 items → summary) | **partial** (happy path only) | extend in P6-C11 |
| Writing submit → AI grade → rubric view | **partial** | P6-C11 |
| Mock exam 45-min simulation (timer, auto-submit, grading) | **missing** | P6-C12 |
| SR review queue (due items → grade → schedule update) | **missing** | P6-C12 |

Also missing: offline mode (`offline.html` / `sw.js`), paywall daily cap hit, Pro upgrade flow (mock LemonSqueezy), push permission prompt, auth error surfacing (wrong password, expired token).

## 3. Accessibility (axe-core / pa11y)

- `axe-core` dep installed; **not wired into any test**.
- `pa11y-ci` configured via `exercises/baselines/pa11y-ci.config.json`. Last baseline in `pa11y.json`. Only runs against landing + a couple of app URLs per config.
- **Gap:** every SPA screen (17 screens in `js/screens/`) needs an axe pass. pa11y crawls server-rendered URLs and cannot navigate the SPA to reach e.g. `placement`, `writing`, `verbReference`.

Fix (P6-C13): Playwright + `@axe-core/playwright` that visits each SPA screen by driving the app.

## 4. Visual regression

Playwright visual baselines exist at `exercises/baselines/` (contains lighthouse + pa11y JSON, not screenshots). `public/screenshots/` exists but no baseline workflow. `test:visual` script from Pass 1 Gate D Commit 11 is **not present** in `package.json` → the TODO at the top of this pass is real. Needs wiring in P6-C14.

## 5. Load testing

Never done. No `k6`/`artillery`/`autocannon` config present. No synthetic user script. No recorded baseline for p95 latency of `/api/exercises/generate`, `/api/writing/grade`, `/api/placement/grade`.

Plan: k6 scenario in P6-C15.

## 6. Error recovery coverage

`grep -c "catch"` across `app.js` + `js/**`: handlers exist but user-visible retry is inconsistent. Spot check:
- `js/api.js` — fetch wrapper exists. Surfaces error toast? **Sometimes** (screen-dependent).
- `js/screens/writing.js`, `js/screens/vocab.js` — catch → generic Finnish error, but no explicit "Retry" button in all paths.
- `js/screens/placement.js` — retry path absent; a network blip mid-placement kills the session.

Plan: P6-C16 — audit every `fetch(`/`api.` call site, ensure Finnish error + retry button. Table of call sites tracked in `RECOVERY.md`.

## 7. Status page

Does not exist. No `/status` route, no `public/status.html`. Plan: P6-C17.

## 8. Exam-day mode

No feature flag infra beyond `js/features/flags.js` (client only, not server-enforced). Exam-week freeze is policy, not code. Plan: P6-C18.

## Summary — what's covered vs. what's missing

- **Covered well:** core `lib/` algorithms (adaptive, placement, scheduler, grading dispatcher), middleware, auth routes, design tokens.
- **Covered thinly:** grading per-type edge cases, client features, a handful of routes.
- **Not covered at all:** `exerciseComposer`, `seedBank`, `weakness`, `dailyCap`, `paywall`, non-auth routes, client SR, `sw.js`, offline mode, mock exam flow, SR review flow, signup flow, axe per-screen, visual regression CI wiring, load, `/status`, exam-day mode.

17 distinct gap areas → ~16 commits in PLAN.md.
