# Pass 0.5 — Post-ship notes

## Bug 1a — Onboarding replays every login

**Root cause.** `js/screens/onboarding.js` wrapped the `/api/profile` POST in a bare `try { ... } catch {}` that silently swallowed failures. Worse, `apiFetch` returns non-2xx responses normally (it doesn't throw), so even the catch was doing less than it looked: any 400/500 from the server was dropped on the floor and the user got pushed into the next screen with `onboarding_completed` unpersisted. Next login, the gate at `checkOnboarding()` saw `onboarding_completed: false` and replayed the flow.

**What shipped.** Check `res.ok`; on non-2xx, throw an explicit error with status + server `error` field, log it (plus a `track("onboarding_save_failed")` event), alert the user in Finnish, and re-enable the submit button instead of advancing. Same treatment for `skipOnboarding`. Server-side, `routes/profile.js` now logs `user_id`, pg `code`, `details`, `hint`, and the attempted field names on any upsert error — so future regressions surface in logs, not user screenshots.

**Regression test.** `tests/onboarding-persistence.test.js` — POST with `onboarding_completed: true` persists the flag via the upsert mock; GET returns it; invalid `target_grade` returns a loud 400 instead of a silent 200.

## Bug 1b — Placement replays every login

**Root cause.** `routes/placement.js` POST `/submit` awaited the `diagnostic_results` insert but never inspected its error. On RLS denial or schema drift the client got a clean 200 with results, but no row landed. `GET /status` reads that row to decide `completed: true|false`, so it returned `false` every time and the placement intro replayed.

**What shipped.** Capture `insertError` from the `diagnostic_results` insert and return 500 with a Finnish error message — the client's existing `if (!res.ok) throw` path already shows "Jokin meni pieleen", so failures now surface instead of masquerading as success. Added the same logging shape as the profile logger. Checked-but-non-fatal error capture on the follow-up `user_profile` update and `user_level_progress` upsert (they're not what gates the status check).

**Regression test.** `tests/placement-persistence.test.js` — happy path persists the row and `status` reports `completed: true`; forced insert error (simulated RLS denial) returns 500 instead of silent 200.

## Bug 2 — No login entry point on landing page

**Root cause.** Landing nav had one CTA — "Aloita ilmaiseksi" → `app.html` — with no affordance for "I already have an account." `app.html` defaults to the login tab anyway, so this was purely a discoverability bug.

**What shipped.** Added a subordinate `nav-login` text link ("Kirjaudu sisään" → `app.html?mode=login`) directly before the primary `nav-cta` on every page that has the landing nav: `index.html`, `pricing.html`, `diagnose.html`, `privacy.html`, `terms.html`, `refund.html`. The link lives outside `.nav-links` so it stays visible at all widths (`.nav-links` hides at `max-width: 760px`). `js/screens/auth.js` now reads `?mode=login|register` on load and clicks the matching tab — login is already the default, but the param handling makes the contract explicit. Blog pages have only breadcrumb navs, so no change needed.

**Regression guard.** No automated test — this is static markup. Manual check on deploy: every landing page shows both "Kirjaudu sisään" and "Aloita ilmaiseksi" in the nav.

## Bug 3 — Narrow desktop layout (deferred)

Deferred to Pass 1 (design system) as planned. Added a hard acceptance criterion at the top of `plans/01-design-system-step1.md`: "Desktop layout (≥1024px) must use ≥960px of content width on dashboard and every exercise screen. Empty desktop margins are a bug, not a feature."
