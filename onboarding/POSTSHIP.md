# Pass 4 — Post-ship notes

Pass 4 (onboarding + paywall + email drip + analytics) is merged. This doc captures what shipped, what's deferred, the PostHog funnel to watch, and where to look when numbers look wrong.

---

## What shipped (Gates A–D)

**Gate A — Onboarding (commits `a7ba038` → `5a3b52c`).** S1 welcome → S2 inline placement → S3 path + persistent countdown → S4 first exercise + celebration → S5 goal + push opt-in. Legacy 6-step profile wizard stripped (`dd0d1f4`). `onboarding_completed` now only needs placement-or-skip.

**Gate B — Paywall (commits `79a81c7` → `7b53757`).**
- `lib/paywall.js` — `shouldFireUpsell({ sessionCount, lastFiredAt, trigger })` is the single gate.
- First session fully paywall-free (suppression reason `first_session`).
- 48 h frequency cap via `localStorage.puheo_pro_upsell_last_fired_at`.
- Locked-tile inline previews for writing + reading; reading free-tier = 2 pieces then hard gate (`reading_pieces_consumed` column).
- Free daily cap 15 vocab/grammar ex/day (cap banner, not hard block — exercise still runs).
- Pro CTAs route to the in-app waitlist modal. `TEST_PRO_EMAILS` accounts get the `[ Flip to Pro (dev) ]` button in production, gated on `window.__DEV_PRO_ENABLED` hydrated from `/api/config/public`.
- No `/api/payments/create-checkout-session` calls are made from the client while `__WAITLIST_MODE` is on.

**Gate C — Email drip (commit `4895612`).** D0 welcome, D1 weakness (truly personalised from the student's own most-recent wrong answer in the weakness category; seed-bank fallback), D3 resume, D7 offer/keep, exam-30, exam-7, weekly, streak. Three new cron endpoints in `routes/email.js` follow the existing signed-header pattern. `email_preferences` expanded with `d1_weakness`, `d7_offer`, `exam_countdown`. Unsubscribe links already respected.

**Gate D — Analytics (this commit).** Frontend events renamed to spec vocabulary. See next section.

---

## PostHog event reference

The spec list from `plans/04-onboarding-step2.md` vs what the app actually emits:

| Spec event              | Emitted from                                                        | Notes |
|-------------------------|---------------------------------------------------------------------|-------|
| `onboarding_started`    | `js/screens/onboarding.js` S1 welcome view                           | Also keeps `onboarding_welcome_viewed` for finer granularity. |
| `placement_completed`   | `js/screens/placement.js`                                            | Includes `level`, `items`, `duration_ms`. |
| `first_exercise_completed` | `js/screens/onboarding.js maybeShowFirstCelebration`              | Carries `time_since_signup_ms` — the TTFE metric. |
| `daily_goal_set`        | `js/screens/onboarding.js` S5 done                                   | Props: `goal`, `session_length`. |
| `push_opt_in`           | `js/screens/onboarding.js` on `Notification.requestPermission === "granted"` | Distinct from `push_permission_granted` (fires alongside). |
| `paywall_shown`         | `analytics.js trackProUpsellShown(trigger)`                          | Triggers: `first_session_end`, `locked_tile_writing`, `locked_tile_reading`, `daily_cap`, `week2_dashboard`. |
| `paywall_dismissed`     | `analytics.js trackProUpsellDismissed(trigger)`                      | Currently unwired — add to the upsell modal close handler when we next touch it. |
| `paywall_converted`     | `analytics.js` (fires from `trackCheckoutCompleted` + dev-flip path) | `source` = `checkout` or `dev_flip`. |
| `email_opened`          | **Deferred** — see below.                                            | |
| `email_clicked`         | **Deferred** — see below.                                            | |

Additional useful events already flowing: `placement_answer`, `placement_api_failed`, `first_exercise_started`, `push_permission_{granted,denied,dismissed}`, `onboarding_completed`, `free_cap_hit`, `pro_upsell_suppressed`, `waitlist_email_submitted`, `waitlist_opened_from_upsell`, `dev_pro_flipped`, `app_countdown_dismissed`.

---

## PostHog dashboard — setup checklist

All events flow to the EU project (`api_host: https://eu.i.posthog.com`). Set up once in the PostHog UI:

1. **Onboarding funnel** (sequential, window = 24 h): `onboarding_started` → `placement_completed` → `first_exercise_completed` → `daily_goal_set` → `onboarding_completed`.
2. **Paywall funnel** (window = 7 d): `first_exercise_completed` → `paywall_shown` → `paywall_converted`. Break down `paywall_shown` by `trigger` to see which surface is converting.
3. **TTFE distribution** — trend on `first_exercise_completed.time_since_signup_ms`, p50 + p90. Target: p50 ≤ 150 s (the shortened-placement target from PLAN.md).
4. **Free cap pressure** — daily count of `free_cap_hit`, break down by `mode`. Rising = cap is biting, which is the point.
5. **Waitlist intent** — `waitlist_email_submitted` per day, break down by `product`. This is the closest thing to a conversion signal while live checkout is disabled.
6. **Suppression sanity** — `pro_upsell_suppressed` broken down by `reason`. `reason=first_session` should dominate for day-0 users; `reason=frequency_cap` means the 48 h window is hitting.

---

## Deferred — email tracking

`email_opened` and `email_clicked` did **not** ship this pass. They need:

- `posthog-node` added to `package.json` (server-side PostHog SDK).
- New `GET /api/email/track/open` endpoint returning a 1×1 transparent PNG, invoked via `<img src>` pixel injected into `email.js layout()`.
- New `GET /api/email/track/click` endpoint that accepts `?c=<campaign>&u=<userId>&r=<encoded_redirect>` and 302s to the real URL after capture.
- Link rewriter in `email.js btn()` + inline anchors. Every template needs retouching (9 templates).
- Signed token for `u`/`c` to prevent open-counter spam (same HMAC pattern as the existing unsubscribe links).

Estimate: 1 focused commit, ~2 h. Until that ships, email performance is blind apart from Resend's own dashboard (opens only, no click attribution back to user).

---

## Quality-bar status

| Target | Status |
|---|---|
| TTFE ≤ 90 s | Missed by design — PLAN.md revised target is **≤ 2 min 30 s** with real 6–8 item placement. Measure via `first_exercise_completed.time_since_signup_ms`. |
| Zero paywall first session | Enforced server-side (writing/reading 403s carry `reason: 'first_session'`) + client-side (`lib/paywall.js` suppresses modal). |
| Emails render clean on Gmail mobile / Outlook mobile / Apple Mail / dark + light | Layout uses table-based HTML with inline styles + dark-forward palette. **Manual QA still owed** — no render-snapshot diff yet. |
| Placement grades honestly | Vitest covers B1 answer set → B placement. |
| Push only after explicit interaction | S5 button click → `Notification.requestPermission()`. Safari iOS fallback replaces button with static text when `Notification` undefined. |

---

## Known follow-ups

1. Email open/click tracking (above).
2. Wire `trackProUpsellDismissed(trigger)` in the pro-upsell modal close handler — currently exported but never called, so `paywall_dismissed` never fires.
3. PAYWALL.md mentions routing `paywall_converted` via the Stripe/LemonSqueezy webhook server-side once live checkout returns. Today it only fires from the client success redirect (`trackCheckoutCompleted`), which misses users who pay but don't return to the tab.
4. When Y-tunnus lands: remove `__WAITLIST_MODE` flag check in `js/screens/writing.js startCheckout()` + drop the dev-flip button from production.
5. Measurement window: leave the funnel running 3 days post-merge before cutting the next paywall experiment — PLAN.md §Measurement.
