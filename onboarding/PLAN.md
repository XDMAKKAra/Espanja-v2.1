# Implementation Plan — Pass 4 Step 2

Ordered commit sequence. Target: 11 commits. Screens first (S1 → S5), then paywall rule changes, then email drip.

**Answered questions from Step 1:**
- Y-tunnus still pending — all payment CTAs route to waitlist modal, same pattern as Pass 3 landing.
- Placement reuses `lib/placement.js` as-is; only the UI wrapper is rebuilt.
- TTFE target: **≤ 2 min 30 s** with full 6–8 item placement (option c). The plan's original 90 s is aspirational — we trade it for real placement signal.
- Default Pro upsell trigger: after-first-session, not on-tile-tap.
- Free daily cap on vocab/grammar: 15 ex/day (new — not enforced today).
- Existing `exam-countdown` top-bar slot in app.html is unused — repurpose as the persistent countdown from S3 onward.
- Top-bar countdown is **dismissible** via subtle ×; still appears on S3, dashboard grade caption, and in emails.
- D1 weakness email is **truly personalised** — pulls the student's own most-recent wrong answer in the weakness category. Seed-bank fallback only when they have no wrong answers on record.
- Reading soft-gate uses a new `reading_pieces_consumed` column — migration in Commit 8.
- `[ Flip to Pro (dev) ]` button **renders in production** for `TEST_PRO_EMAILS` accounts, server-flag gated.

---

## Commit 1 — `feat(onboarding): S1 welcome screen — countdown + single promise`

**Files:** `app.html`, `js/screens/onboarding.js`, `style.css`, `sw.js`

- New `#screen-ob-welcome` markup per FLOW.md S1 mock. Countdown reuses the 28.9.2026 exam-ms constant.
- `js/screens/onboarding.js` gets a new `renderWelcome()` as step 0; `TOTAL_STEPS` renames to `renderWizard()` flow.
- Primary CTA routes to S2 placement. Skip link records `onboarding_skipped_at_step = 1` + routes to dashboard.
- PostHog: `onboarding_welcome_viewed`, `onboarding_welcome_cta`.
- Bump sw.js CACHE_VERSION to `puheo-v12`.

**Test:** Playwright — fresh account lands on welcome screen, primary CTA opens placement, skip CTA jumps to dashboard with `onboarding_completed = true`.

---

## Commit 2 — `refactor(onboarding): strip profile questions, keep only post-placement path`

**Files:** `js/screens/onboarding.js`, `routes/profile.js`, `style.css`, `sw.js`

- Remove the 6-step profile wizard (exam-date, courses, grade, target-grade, strong-areas, daily-goal prompts) as separate onboarding steps. `js/screens/onboarding.js` shrinks significantly.
- The profile fields still exist on `user_profile` and still POST via `routes/profile.js` — but now populated (a) implicitly from placement, (b) from S5 goal-picker, (c) lazily from the settings screen.
- Add deep-link to `/app.html?tab=profile` for students who want to fill these in voluntarily.
- `onboarding_completed` no longer requires any profile fields — just `placement_completed OR skipped`.

**Test:** existing onboarding test suite updated; `onboarding_completed` flag still sets after the new S1 → S2 → S5 path.

---

## Commit 3 — `feat(onboarding): S2 placement — inline first-item, no intro screen`

**Files:** `app.html`, `js/screens/placement.js`, `lib/placement.js`, `style.css`, `sw.js`

- Remove `#placement-intro` screen — skip straight to the first item.
- Adaptive selection per FLOW.md S2: start level B, walk up/down by correctness, stop at 6 items minimum, 8 max, early-stop on 3-at-same-level convergence.
- Read `localStorage.puheo_diagnostic_v1` and pre-seed if present (5 items instead of 7, starting at diagnostic average).
- Option tint + 500 ms auto-advance on answer (no next button).
- API-fail retry + level-B fallback per mock.
- PostHog: `placement_started`, `placement_answer`, `placement_completed`, `placement_api_failed`.

**Test:** simulate 8 correct answers at all-B items → placement returns B; simulate 4 correct at C then 2 wrong at M → placement returns C. Vitest for `lib/placement.js` scoring (new cases).

---

## Commit 4 — `feat(onboarding): S3 path screen + persistent countdown top bar`

**Files:** `app.html`, `js/screens/onboarding.js`, `js/screens/dashboard.js`, `style.css`, `sw.js`

- `#screen-ob-path` with level display, weakness sentence (mapping table from FLOW.md), and plan bullets.
- Top-bar countdown component (`<div class="app-countdown">📅 X pv YO-kokeeseen <button class="app-countdown-close" aria-label="Piilota päivälaskuri">×</button></div>`) added to `app.html`'s persistent chrome. Renders on S3 onward + dashboard + all exercise screens. Hides on onboarding S1–S2 (distracting).
- Dismissible `×` writes `localStorage.puheo_countdown_dismissed = true`; bar stays hidden in chrome but still appears on S3, dashboard grade caption, and in emails.
- Settings → `Näytä päivälaskuri` toggle re-enables it.
- Hourly re-render via the same pattern as `index.html` exam countdown.
- Weakness sentence mapper as new `lib/weakness.js` — pure function, unit-tested.

**Test:** fresh account → placement returns `{ placementLevel: 'C', weakest: 'subjunctive_present' }` → S3 renders `Subjunktiivin tunnistaminen käskymuodoissa.`

---

## Commit 5 — `feat(onboarding): S4 first exercise — adaptive, 4 items, celebration overlay`

**Files:** `js/screens/onboarding.js`, `js/screens/vocab.js`, `lib/sessionComposer.js`, `app.html`, `style.css`, `sw.js`

- After S3 primary CTA, call `sessionComposer({ first_session: true, preferred_category, max_items: 4 })`.
- Detect `first_session` in `js/screens/vocab.js` result handler — show celebration overlay for 3 s then Pass 0.7 result screen.
- Confetti: extract existing `onboarding.js:287–301` particle code into `lib/confetti.js` for reuse.
- "Skip" tertiary appears after item 1; skip routes to dashboard without celebration.
- PostHog: `first_exercise_started`, `first_exercise_completed { time_since_signup_ms }` (the TTFE event).

**Test:** fresh account → complete 4-item session → overlay visible 3 s → Pass 0.7 result screen follows. `first_exercise_completed` event includes `time_since_signup_ms`.

---

## Commit 6 — `feat(onboarding): S5 goal + push opt-in, finish wizard`

**Files:** `app.html`, `js/screens/onboarding.js`, `routes/profile.js`, `style.css`, `sw.js`

- `#screen-ob-goal` with three goal cards (Kevyt/Normaali/Intensiivinen, Normaali default) + push opt-in block.
- Goal click writes `preferred_session_length` + `weekly_goal_minutes` via existing `POST /api/profile`.
- "Salli muistutukset" → `Notification.requestPermission()` → on grant `POST /api/profile { notification_preference: 'push' }`. Safari iOS fallback replaces button with text.
- "Valmis" sets `onboarding_completed = true` and routes to dashboard.
- PostHog: `onboarding_goal_set`, `push_permission_requested`, `push_permission_{granted|denied|dismissed}`, `onboarding_completed`.

**Test:** select Intensiivinen → profile has `preferred_session_length = 30`; grant push → `notification_preference = 'push'`.

---

## Commit 7 — `feat(paywall): suppress Pro upsell during first session + add frequency cap`

**Files:** `middleware/auth.js`, `js/screens/writing.js`, `js/screens/dashboard.js`, `lib/paywall.js` (new), `style.css`, `sw.js`

- New `lib/paywall.js` — pure function `shouldFireUpsell({ sessionCount, lastFiredAt, trigger })` → boolean + reason. Caller decides copy; this module only decides gate.
- `middleware/auth.js` 403 responses on writing/reading gain `{ gate: 'soft', reason: 'first_session' }` when session count is 0 (client reads reason to swap modal for soft copy).
- Client stores `pro_upsell_last_fired_at` in localStorage for 48 h cap.
- PostHog: `pro_upsell_suppressed { reason }`.

**Test:** create fresh account, navigate to writing → no modal, soft preview shown. Complete 1 exercise. Tap writing → modal fires once. Tap again within 48 h → suppressed event.

---

## Commit 8 — `feat(paywall): context-aware modal copy + locked-tile preview states`

**Files:** `app.html`, `js/screens/pro-upsell.js` (new, extracted from writing.js), `js/screens/dashboard.js`, `style.css`, `sw.js`

- Extract Pro upsell modal into its own module — writes `state.upsellTrigger` before render so copy can branch.
- Copy table per PAYWALL.md Rule 4 implemented as a Finnish string map.
- Writing locked-tile preview: prompt visible, textarea `readonly` with overlay "Pro avaa kirjoitusarvioinnin" + CTA. Not a modal — inline preview.
- Reading locked-tile: first 2 pieces free per PAYWALL.md table. New migration `migrations/0XX_reading_pieces_consumed.sql` adds `reading_pieces_consumed INT DEFAULT 0` to `user_profile`, backfilled to 0. Reading endpoint increments on successful fetch; returns 403 on the 3rd attempt.
- PostHog: `pro_upsell_shown { trigger }` with trigger ∈ {`first_session_end`, `locked_tile_writing`, `locked_tile_reading`, `daily_cap`, `week2_dashboard`}.

**Test:** snapshot test per trigger — modal DOM matches expected copy; writing tile preview tapped shows inline overlay not modal.

---

## Commit 9 — `feat(paywall): route in-app Pro CTAs to waitlist modal (Y-tunnus placeholder)`

**Files:** `js/screens/pro-upsell.js`, `js/screens/writing.js`, `server.js` (feature flag), `sw.js`

- `window.__WAITLIST_MODE` feature flag served from `/api/config/public` (already serves PostHog key in similar shape).
- When flag = true (current state): `startCheckout()` opens waitlist modal instead of hitting `/api/payments/create-checkout-session`.
- Waitlist modal reused from landing (`index.html`) — minimal copy tweak for in-app context: `Ilmoita sähköpostisi heti kun Pro-tilaus avautuu ostettavaksi.`
- `TEST_PRO_EMAILS` users see additional `[ Flip to Pro (dev) ]` button on the modal, including in production. Gated on `window.__DEV_PRO_ENABLED`, which the server sets to `true` only when `req.user.email` is in `TEST_PRO_EMAILS` — the flag is hydrated per-user from `/api/config/public` and is never served to non-test accounts.
- New endpoint `POST /api/dev/grant-pro` — authorisation check on the server: `req.user.email` must be in `TEST_PRO_EMAILS`. No `NODE_ENV` dependency; runs in prod. Flips `subscriptions.active = true` for the caller only.
- PostHog: `waitlist_opened_from_upsell { trigger }`.

**Test:** flag on + non-test account → modal shows waitlist; test account → also shows dev flip button; flip button flips Pro state. `/api/payments/create-checkout-session` receives zero calls from the client in either case (mock the fetch to assert).

---

## Commit 10 — `feat(paywall): daily cap on free vocab/grammar (15/day)`

**Files:** `middleware/rateLimit.js`, `routes/exercises.js`, `js/screens/vocab.js`, `style.css`, `sw.js`

- New counter middleware — queries `exercise_logs` for count-in-last-24h-by-user-by-mode. Lightweight, single index hit.
- Free user + `count >= 15` → response includes `{ cap_hit: true, cap_copy: "Olet tehnyt tänään 15 harjoitusta..." }` in the exercise payload. Exercise still runs and saves; result screen appends the cap banner.
- Pro users: counter queried but no cap applied — just logged.
- PostHog: `free_cap_hit { mode, count }`.

**Test:** post 15 vocab logs for a test free user; next exercise renders with cap banner. Pro user gets 16 without banner.

---

## Commit 11 — `feat(email): D1 weakness (real personalisation), D7 offer/keep, exam -30/-7, tune weekly + streak copy`

**Files:** `email.js`, `routes/email.js`, `migrations/0XX_email_preferences_expand.sql`, `data/templates/*.html` (if we split), `sw.js`

- Migration: add `d1_weakness`, `d7_offer`, `exam_countdown` columns to `email_preferences`, default `true`.
- `email.js` gains `sendD1WeaknessEmail`, `sendD7OfferEmail`, `sendExamCountdownEmail`, plus body rewrites for `sendWelcomeEmail`, `sendWeeklyProgressEmail`, `sendStreakReminderEmail` per EMAILS.md.
- **Real D1 personalisation:** for each target user, query `exercise_logs` for the most recent wrong answer in the weakness category; embed the exact Spanish sentence and options in the email. Fallback to pre-curated seed-bank example per category when the student has no wrong answers on record (rare — placement usually surfaces one).
- Three new cron endpoints in `routes/email.js` — all follow the existing `streak-reminders` signed-header pattern.
- Vercel cron config (or external scheduler) wires the three new hourly endpoints.
- `GET/PUT /api/email/preferences` gains the three new category keys.
- Unsubscribe links for each new category land on `/app.html?unsubscribe={category}&token={signed}` — verifies and flips preference.

**Test:** render each template with sample data, render-snapshot in Vitest; D1 personalisation test — seed a user with a wrong answer in category `preterite_irregular`, run the job, assert the email body contains that specific item's Spanish sentence. Cron call with bad secret returns 401, correct secret + empty target list returns `{ sent: 0 }`. Migration applies cleanly and defaults existing rows to true.

---

## Commit sequence summary

| #  | Scope                                   | Risk   | Blocker for       |
|----|-----------------------------------------|--------|-------------------|
| 1  | S1 welcome screen                       | Low    | Funnel start      |
| 2  | Strip old profile wizard                | Medium | TTFE              |
| 3  | S2 placement inline                     | Medium | First value       |
| 4  | S3 path + persistent countdown          | Low    | Retention hook    |
| 5  | S4 first exercise + celebration         | Medium | Aha moment        |
| 6  | S5 goal + push opt-in                   | Low    | Drip eligibility  |
| 7  | Suppress upsell first session + cap     | Medium | Legal/UX          |
| 8  | Context-aware modal + locked-tile preview | Medium | Conversion quality |
| 9  | Waitlist placeholder for Pro CTAs       | Low    | Legal/y-tunnus    |
| 10 | Daily cap on free vocab/grammar         | Low    | Conversion lever  |
| 11 | D1/D7/exam-countdown emails + body tunes | Low   | Retention         |

**Total estimated time:** 14–18 hours across 11 commits.

**Ship order:** Commits 1–6 must be sequential (same DOM + state refactor). Commits 7–10 can ship in any order after 6 lands, but 9 should ship before 8 so the modal copy already branches to waitlist before the context-aware copy lands. Commit 11 is independent and can ship in parallel (email work doesn't touch onboarding UI).

**Dark mode / Cuaderno theme:** every screen inherits design tokens from Pass 1.7. No screen-specific dark palette needed.

**Measurement:** after Commit 6 merges, leave the PostHog funnel open for 3 days before starting Commits 7–11 so we can measure the onboarding funnel baseline before the paywall changes confound the data.
