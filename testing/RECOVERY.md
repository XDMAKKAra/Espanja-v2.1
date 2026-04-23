# Pass 6 — Failure Mode Recovery Catalog

For every external dependency, what happens when it fails, what the app does today, and what the fix commit is.

Legend: **Current** = behavior on `main` at 2026-04-23. **Gap** = user-visible problem. **Fix** = where it lands in `PLAN.md`.

---

## 1. OpenAI timeout / 5xx / rate limit

- **Paths affected:** `lib/exerciseComposer.js` (generate), `lib/writingGrading.js` (grade), `routes/exercises.js`, `routes/writing.js`.
- **Current:** `lib/openai.js` has a timeout wrapper. On error, composer falls back to `seedBank` in most types. Writing grading does **not** fall back — returns 502 and client shows a toast.
- **Gap:** (a) no cached-response fallback layer, (b) writing has no degraded-grade path, (c) 429 burst during exam week would cascade.
- **Fix:**
  - P6-C01 — cover composer fallback in unit tests.
  - P6-C16 — client retry + "Tallensimme vastauksesi, arviointi yritetään uudelleen" message, preserve input.
  - P6-C18 — exam-day mode skips OpenAI entirely; writing grades against simplified rubric served from bank.

## 2. Supabase down / Postgres unavailable

- **Paths affected:** every authenticated route, progress saves, placement persistence, SR schedule.
- **Current:** raw `supabase.js` errors propagate as 500s. No read-only mode. Writes are lost if DB is unreachable.
- **Gap:** exam-day DB blip = lost answers + exam scores.
- **Fix:**
  - P6-C16 — client queues write-backs in IndexedDB (`pendingWrites` store), flushes on reconnect; red banner "Verkkovirhe — tallennus jatkuu kun yhteys palaa." Reads from last-good cache.
  - P6-C17 — `/status` surfaces DB health so on-call sees it fast.

## 3. Resend (email) down

- **Paths affected:** signup verify, password reset, drip emails, weekly progress.
- **Current:** `email.js` awaits Resend response; failures bubble to route. Signup blocks on verification email.
- **Gap:** a student can't create an account if Resend is down.
- **Fix:** P6-C16 — queue email send in a background job; for signup, allow account creation + show "Lähetämme vahvistuksen pian" and unlock app on first login (existing flow already soft-verifies). Log-and-continue for drip emails.

## 4. LemonSqueezy webhook drop / delay

- **Paths affected:** `routes/stripe.js` (LS webhook handler), Pro status sync.
- **Current:** webhook idempotency unknown (test in P6-C07). If webhook is lost, user pays but stays Free.
- **Gap:** paid user can't access Pro content on exam day.
- **Fix:** P6-C07 — test signature + idempotency; add hourly reconciliation job (list subscriptions, fix drift). Manual override: `TEST_PRO_EMAILS` already exists as escape hatch.

## 5. Push service (web-push / VAPID) down

- **Paths affected:** streak reminders.
- **Current:** swallowed in `routes/push.js` try/catch. Silent.
- **Gap:** none — silent is correct.
- **Fix:** none. Document in `EXAM-WEEK.md` that push is non-critical.

## 6. Service worker stale cache

- **Paths affected:** every static asset.
- **Current:** `sw.js` uses `CACHE_VERSION` bump convention (memory: `feedback_sw_cache_bump`). Relies on humans.
- **Gap:** forgetting to bump ships stale JS. Happened before.
- **Fix:** P6-C08 — CI check: if any file in `STATIC_ASSETS` changed but `CACHE_VERSION` didn't, fail the build.

## 7. Client network flakes mid-exercise

- **Paths affected:** every `fetch` in `js/**`.
- **Current:** inconsistent. `js/screens/writing.js` preserves input in local state; `js/screens/placement.js` does not. A dropped request mid-placement wipes progress.
- **Gap:** lost work.
- **Fix:** P6-C16 — audit table below.

### Client fetch audit (P6-C16 — initial pass)

75 fetch/apiFetch call sites across 14 files (`js/screens/*.js`, `js/features/*.js`).
Audited end-to-end; follow-up items tracked per row.

| Call site | Preserves input? | Retries? | Finnish error? | Retry button? | Status |
|---|---|---|---|---|---|
| `js/api.js` `apiFetch` wrapper | n/a | 401→refresh only | n/a | n/a | upgraded: `retryable()` helper + `enqueueWrite`/`flushWriteQueue` exported in C16 |
| `js/screens/auth.js` login/register | yes (form values) | no | yes | form stays | OK |
| `js/screens/placement.js` answer submit | yes (localStorage) | yes (3x, 500ms base) | yes | yes | **done** — C16 |
| `js/screens/vocab.js` grade | yes | yes (2x) | yes | implicit | **done** — C16 |
| `js/screens/writing.js` grade | yes (localStorage draft) | yes (3x, 800ms base) | yes | yes | **done** — C16 |
| `js/screens/exam.js` submit | yes (localStorage) | no | yes | yes (resume) | OK |
| `js/screens/fullExam.js` save | yes (localStorage) | no | yes | yes | OK |
| `js/screens/reading.js` load | n/a | yes (3x) | yes | yes | **done** — C16 |
| `js/screens/grammar.js` generate | yes | yes (3x) | yes | yes | **done** — C16 |
| `js/screens/quickReview.js` grade | yes | no | yes | implicit | OK |
| `js/screens/adaptive.js` mastery submit | yes (localStorage) | yes (3x) | yes | yes | **done** — C16 |
| `js/screens/learningPath.js` load | n/a | no | yes | auto-reload | OK |
| `js/screens/onboarding.js` save | yes (form values) | no | yes | yes | OK |
| `js/screens/settings.js` update | yes | no | yes | yes | OK |
| `js/screens/dashboard.js` hydrate | n/a | no | yes | auto-retry | OK |
| `js/features/spacedRepetition.js` | yes (localStorage queue) | no | n/a (silent) | n/a | OK — guest fallback always available |
| `js/features/mcAdvisory.js` | n/a | no | n/a (advisory) | n/a | OK — fire-and-forget, no user impact |
| `js/features/topicBlogMap.js` | n/a | no | n/a | n/a | OK |
| `js/features/verbsData.js` load | n/a | no | n/a (static) | n/a | OK |

Target end-state for rows marked TODO: every submit path wrapped in `retryable()`, input preserved to localStorage on mount/change, explicit "Yritä uudelleen" button rendered on failure with the Finnish error.

## 8. OpenAI cost spike / runaway

- **Paths affected:** anything calling `lib/openai.js`.
- **Current:** `middleware/costLimit.js` + `lib/aiCost.js` cap per-user + per-day. Tested.
- **Gap:** no global kill switch.
- **Fix:** P6-C18 — exam-day mode is the kill switch (bank-only). Add `OPENAI_DISABLED=true` env as a manual override independent of the exam flag.

## 9. Sentry / logging pipeline failure

- **Paths affected:** observability.
- **Current:** `@sentry/node` present. PostHog client-side. Fail-silent.
- **Gap:** no alert if Sentry itself is dark.
- **Fix:** `/status` in P6-C17 exposes `lastError` timestamp from a local ring buffer independent of Sentry.

---

## Recovery contract (goal state after Pass 6)

1. Any single external dependency failure ≠ app outage.
2. No student loses work to a network blip. Input is preserved until confirmed saved.
3. Every user-visible error has a Finnish message and a retry button.
4. On-call can see system health at `/status.html` in < 5 seconds.
5. Exam-week mode makes the app OpenAI-independent.
