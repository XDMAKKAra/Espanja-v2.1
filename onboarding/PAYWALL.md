# Paywall Design — Puheo (Pass 4)

> Audit of current paywall + new timing rules, copy, and soft-vs-hard gate matrix.
> Pricing inherited from Pass 3 landing: Free / 9.99 €/kk / 29 € kesäpaketti.
> **Y-tunnus constraint:** no live payments this pass. See "Placeholder checkout" below.

## 1. Current state (what fires, where, and when)

### Hard-gated server endpoints
- `routes/writing.js` — POST returns 403 for non-Pro. Triggered the moment a student taps the Kirjoitus tile or opens `/api/writing-task`.
- `routes/exercises.js` — reading endpoints use `softProGate` (`middleware/auth.js:96–105`) which lets unauthenticated requests through but 403s authenticated non-Pro. Effect: a logged-in free user hitting reading sees the same immediate 403 as writing.

### Client-side triggers
- `js/screens/writing.js:13–16` — on 403 response, shows the `screen-pro-upsell` modal and calls `trackProUpsellShown()`.
- `js/screens/dashboard.js:134–145` — a persistent "Päivitä Pro" button on the dashboard, visible to any free logged-in user.
- Reading and writing tiles on the dashboard grid carry a 🔒 badge and the same click-to-upsell behaviour (`js/screens/dashboard.js:62–68`).

### Checkout wire
- `js/screens/writing.js:18–39` — `startCheckout()` POSTs to `/api/payments/create-checkout-session` (`routes/stripe.js:16–44`, LemonSqueezy despite the filename).
- `/api/payments/create-summer-checkout` (`routes/stripe.js:47–85`) for the seasonal package.
- `trackCheckoutStarted()` fires on click, `trackCheckoutCompleted()` in the success redirect handler.

### What's wrong with the current firing logic
1. **No session gating.** A student who signs up at 18:00 and clicks the Kirjoitus tile at 18:00:45 sees a purchase modal 45 seconds in. This is exactly the "fire during the first session" antipattern the plan forbids.
2. **Fires mid-flow.** 403 → modal interrupts mid-tile-click. The student has made no progress and sees no value; the upsell is all cost, no benefit.
3. **Generic copy.** The Pro upsell modal uses the same "Avaa kaikki ominaisuudet" line regardless of trigger. A student blocked by writing should see writing-specific copy; a student who just finished a session should see completion-specific copy.
4. **Live checkout without y-tunnus.** `startCheckout()` currently hits a live LemonSqueezy endpoint. Pass 3 fixed this on the landing but not in the app. Y-tunnus is pending → we cannot legally bill. Live clicks that reach LemonSqueezy are a compliance issue, not just a UX one.
5. **No daily cap on free vocab/grammar.** Free users can grind sanasto forever — there's no signal that upgrading adds capacity, just that it adds locked modes. Conversion lever is missing.

## 2. New firing rules

### Rule 1 — Never during the first session
`first_session = user has zero completed exercises` (check `exercise_completed` count). While `first_session` is true, the Pro upsell modal is **suppressed entirely**. Locked tiles show a softer empty-state copy instead (see "Soft-gate copy" below).

Implementation: check `localStorage.puheo_completed_sessions` client-side, fall back to an API `/api/progress/count`. Server also enforces — `middleware/auth.js` can read a header `X-First-Session: 1` and return a 200 with `{ gate: 'soft', reason: 'first_session' }` instead of a raw 403.

### Rule 2 — Fire after an aha-moment, not at a flow-break
An aha-moment is defined as **any of**:
- First exercise completed (session count transitions 0 → 1).
- First 100%-correct session.
- Completion of the first session in a new topic (mastery record created for a new category).

Paywall fires **after the result screen**, on the "Seuraavaksi" action — never during an exercise, never on a tile tap mid-flow.

### Rule 3 — Fire at a dead-end, not mid-flow
"Dead-end" examples:
- After finishing a 4-item first session — Pro upsell as third "Seuraavaksi" button (primary + secondary still free actions).
- When the student has completed all available free topics at their level (we run out of free content to offer — legitimate capacity upsell).
- On the dashboard hero grade-widget after week 2 — "Saavutat arviolta C. Tavoitteesi on M. Pro-tilauksella pääset sinne ~3 viikkoa nopeammin."

"Flow-break" examples to **avoid**:
- Mid-exercise interstitial.
- On tile tap before the tile content has loaded.
- On login (every returning user would see it).

### Rule 4 — Context-aware copy
The modal's headline + bullets change based on trigger:

| Trigger                           | Headline                                    | Lead bullet                              |
|-----------------------------------|---------------------------------------------|------------------------------------------|
| After first session completed     | `Hyvä alku. Jatketaanko kokeeseen asti?`    | `Pro avaa kirjoitusharjoitukset ja AI-palautteen.` |
| On locked-tile tap (writing)      | `Kirjoitusarvio tarvitsee Pro-tilauksen.`   | `YTL-rubriikin mukainen palaute — opettaja-laatua 24/7.` |
| On locked-tile tap (reading)      | `Luetun ymmärtäminen on Pro-ominaisuus.`    | `YTL-tyyliset tekstit kaikilla tasoilla.` |
| Daily cap hit (vocab/grammar)     | `Olet tehnyt tänään 15 harjoitusta.`        | `Pro poistaa päivittäisen rajan.`        |
| Week 2 dashboard widget           | `Pro nopeuttaa kokeeseen valmistautumista.` | `Saavutat arvio-tavoitteesi ~3 viikkoa aiemmin.` |

All keep the same footer (pricing + "ilmoita minulle" placeholder, see below).

### Rule 5 — Daily cap introduces Pro gently
Free vocab/grammar: 15 exercises/day. After #15:
- Exercise still loads and saves progress.
- Result screen shows an extra banner: `Olet tehnyt tänään 15 harjoitusta — huippusuoritus. Lisää huomenna tai Pro-tilauksella heti.`
- No modal, no 403. This is the *only* firing that can happen without a completed aha-moment (but the student already did 15 exercises — that IS the aha).

### Rule 6 — Frequency cap
Pro upsell modal cannot fire more than **once per 48 h per user**. Suppressed firings record `pro_upsell_suppressed { reason: 'frequency_cap' }`.

## 3. Soft-gate vs hard-gate matrix

| Feature                    | Gate              | Free behaviour                        | Pro unlock                              |
|----------------------------|-------------------|---------------------------------------|----------------------------------------|
| Sanasto (vocab)            | **Soft**          | 15 ex/day cap                         | Unlimited                               |
| Kielioppi (grammar)        | **Soft**          | 15 ex/day cap                         | Unlimited                               |
| Lukeminen (reading)        | **Soft→Hard**     | First 2 pieces free; then hard-gate   | Unlimited                               |
| Kirjoitus (writing)        | **Hard**          | Preview-only: prompt visible, typing disabled, "Pro avaa" CTA | Full draft + AI-palaute |
| Täyskoe-simulaatio         | **Hard**          | Hidden from tile grid entirely        | Visible, full exam                      |
| YO-arvosana dashboard widget | **Soft**        | Shown at all tiers (honesty ladder per Pass 0.7) | Same, plus "ennuste päivittyy viikoittain" timeline |
| Virhelista + SRS kertausjärjestelmä | **Soft→Hard** | First week of mistakes | Full history, forever                   |
| Henkilökohtainen viikkosuunnitelma | **Hard**    | Generic plan ("~12 harjoitusta / viikko") | Personalised calendar with topic schedule |
| Prioriteettituki           | **Hard**          | Email support, 72 h SLA               | 12 h SLA (Kesäpaketti bonus)            |
| Yksi henkilökohtainen kirjoitelmapalaute | **Hard** | Not available                 | 1x included with Kesäpaketti            |

**Soft gate** = feature visible, partial usage allowed, upgrade nudge when limit hit. Implementation: 200 response with `{ gate: 'soft', limit_reached: true, nudge_copy: '...' }`.

**Hard gate** = feature hidden or preview-only; tap attempt routes to Pro upsell (which is still suppressed on first session per Rule 1).

Soft preferred everywhere the content genuinely has marginal cost (LLM calls → writing AI; generated content → reading). Soft for free-to-play modes (vocab/grammar content is cheap, we're capping for conversion, not cost).

## 4. Pro upsell modal — copy + layout

### Layout (mobile)

```
┌──────────────────────────────┐
│                              │
│              ✕               │   ← dismiss, top-right
│                              │
│    HYVÄ ALKU.                │   ← eyebrow
│    Jatketaanko kokeeseen     │   ← headline, serif 24px
│    asti?                     │
│                              │
│  ────────────────────────    │
│                              │
│   Pro avaa:                  │
│   ● kirjoitusarvioinnin      │
│   ● YTL-tyyliset lukutekstit │
│   ● 2 000+ harjoitusta       │
│   ● täyden YO-simulaation    │
│                              │
│   ┌────────────────────┐     │
│   │ Kesäpaketti 29 €   │     │   ← primary, seasonal when June–Aug
│   │ 4 kk · säästä 27%  │     │
│   └────────────────────┘     │
│   ┌────────────────────┐     │
│   │ Pro 9,99 € / kk    │     │   ← secondary
│   └────────────────────┘     │
│                              │
│   14 pv rahat takaisin       │   ← trust line
│                              │
│        Ehkä myöhemmin        │   ← tertiary, records dismissal
│                              │
└──────────────────────────────┘
```

### Copy (Finnish, exact)

| Slot           | Text                                              |
|----------------|---------------------------------------------------|
| Eyebrow        | Varies by trigger (see Rule 4 table)              |
| Headline       | Varies by trigger                                 |
| Bullet list    | `kirjoitusarvioinnin`, `YTL-tyyliset lukutekstit`, `2 000+ harjoitusta`, `täyden YO-simulaation` |
| Primary CTA    | `Kesäpaketti 29 €` / `4 kk · säästä 27%` (June–Aug) <br> `Pro 9,99 € / kk` outside season |
| Secondary CTA  | `Pro 9,99 € / kk` (Jun–Aug) or `Kesäpaketti 29 €` (when it's the upcoming product) |
| Trust line     | `14 pv rahat takaisin`                            |
| Dismiss        | `Ehkä myöhemmin`                                  |

### Behaviour

- Focus-trap inside modal; ESC + X button + "ehkä myöhemmin" all dismiss.
- Dismissal fires `pro_upsell_dismissed { trigger }` and starts the 48 h frequency-cap timer.
- Both primary/secondary route to the **placeholder checkout** described below — no live LemonSqueezy this pass.

## 5. Placeholder checkout (Y-tunnus constraint)

Until marcel has Y-tunnus, "Osta" buttons must not reach LemonSqueezy's live checkout.

### Strategy: email waitlist, same as landing

Reuse the Pass 3 waitlist modal contract. In-app Pro upsell "Osta" click:
1. If user email is in `TEST_PRO_EMAILS` env (`middleware/auth.js:51–54` already honours it): flip user to Pro via a new dev-only endpoint `POST /api/dev/grant-pro` (body `{ userId }`, gated on `NODE_ENV !== 'production'` + `req.user.email in TEST_PRO_EMAILS`). This is the short path marcel uses to test paid-only screens.
2. Otherwise: open the same waitlist modal as the landing — copy: `Maksullinen tilaus avautuu pian. Ilmoita sähköpostisi, niin kerromme heti kun saat ostaa.` POSTs to existing `/api/waitlist` with `product: 'in-app-pro'` / `'in-app-summer'`.

**What this means for code:**
- `js/screens/writing.js startCheckout()` (`:18–39`) gets a new branch: if `window.__WAITLIST_MODE === true` (set from a Supabase feature flag), open the waitlist modal instead of hitting `/api/payments/create-checkout-session`.
- `routes/stripe.js` is **not modified** this pass — it's still the endpoint we'll use once y-tunnus lands. We just don't call it from the client.
- The "swap placeholder for live checkout" is then a one-commit job: remove the feature flag check, re-enable the existing `startCheckout()` path. All analytics events (`checkout_started`, `checkout_completed`) already fire — they just don't match a real purchase yet.

### Test accounts path (dev convenience)
- `TEST_PRO_EMAILS` already works — those users are treated as Pro by `middleware/auth.js:51–54` regardless of `subscriptions` table state.
- Add UI affordance: on the Pro upsell modal, if the user's email is in the test list, show a `[ Flip to Pro (dev) ]` button alongside the normal CTAs. **Enabled in production.** Gated on `window.__DEV_PRO_ENABLED`, which the server sets based on whether `req.user.email` is in `TEST_PRO_EMAILS` — independent of `NODE_ENV`. This lets marcel flip real Pro state on the live site for QA without touching the DB. The button is invisible to every non-test account.
- The `POST /api/dev/grant-pro` endpoint itself also guards on `TEST_PRO_EMAILS` membership server-side, so an attacker who forges `window.__DEV_PRO_ENABLED = true` client-side still gets 403.

### What we do NOT do this pass
- Do NOT touch `routes/stripe.js` live endpoints.
- Do NOT register new LemonSqueezy products or update webhook URLs.
- Do NOT change the Supabase `subscriptions` schema.
- Do NOT attempt to parse real payment webhooks.

## 6. Supabase / Postgres changes

Pass 4 paywall work is mostly front-end + gate logic. One migration required:

- `user_profile` — add `reading_pieces_consumed INT DEFAULT 0`. Backfill existing rows to 0. Used for the reading soft→hard gate: first 2 pieces increment the counter, from the 3rd onward the reading endpoint returns 403. Same migration file adds nothing else.
- `user_profile` existing columns (`notification_preference`, `onboarding_completed`, `preferred_session_length`, `weekly_goal_minutes`) — unchanged, already in `migrations/014_user_profile.sql`.
- `exercise_logs` — no changes. Free daily-cap reads the same table (`count where user_id = ? and created_at > today`).
- `pro_upsell_events` — not needed; PostHog covers it.

## 7. Analytics additions

Extend the existing `js/analytics.js` wrappers (`trackProUpsellShown`, `trackProUpsellDismissed`):
- `pro_upsell_shown { trigger, session_count, days_since_signup }`
- `pro_upsell_dismissed { trigger, dwell_ms }`
- `pro_upsell_suppressed { trigger, reason: 'first_session' | 'frequency_cap' }`
- `free_cap_hit { mode, count }` — when the 15/day cap triggers
- `waitlist_opened_from_upsell { trigger }`
- `waitlist_email_submitted { product }` (reuse the landing event if already in place).

PostHog funnel to build:
`signup → first_exercise_completed → pro_upsell_shown → waitlist_email_submitted`. Drop-off between stages is the Pass 4 success metric.

## 8. Acceptance criteria

- [ ] Pro upsell modal never fires for a user whose `exercise_completed` count is 0.
- [ ] Pro upsell modal never fires mid-exercise. Verified via Playwright test that submits an answer with the modal listener attached and asserts no modal renders.
- [ ] Writing tile on free: tap shows preview screen with "Pro avaa" CTA, not an immediate 403 modal.
- [ ] Daily vocab cap triggers at exercise #15; #16 onwards still loads and saves progress, but the result screen shows the cap banner.
- [ ] In-app Pro CTA opens the waitlist modal, not a live checkout. Verified by intercepting `/api/payments/*` calls in a test browser session and asserting zero requests.
- [ ] `TEST_PRO_EMAILS` users see the `[ Flip to Pro (dev) ]` button on the upsell modal; non-test users do not.
- [ ] Modal copy varies by trigger per Rule 4 table — snapshot test per trigger.
- [ ] Frequency cap: second upsell within 48 h is suppressed and fires `pro_upsell_suppressed`.

## 9. Post-y-tunnus swap plan

When marcel gets Y-tunnus (target: before Pass 7 marketing):

1. Remove the waitlist-mode feature flag — delete the `window.__WAITLIST_MODE` branch in `startCheckout()`.
2. Verify LemonSqueezy product IDs match the Pass 3 pricing (9.99 € mo / 29 € seasonal).
3. Smoke-test `/api/payments/create-checkout-session` with a real Finnish test card.
4. Flip the flag in Supabase, monitor `checkout_started` → `checkout_completed` conversion.
5. Update the landing waitlist copy to announce "Tilaus nyt auki" → clear the waitlist list (email them all once).

Single commit, targeted change — everything else (modal copy, gate logic, analytics) already lives in main.
