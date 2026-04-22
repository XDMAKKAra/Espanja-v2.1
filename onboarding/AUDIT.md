# Onboarding Audit — Puheo

> Walk-through of the current signup → first-exercise flow.
> Reviewed 2026-04-22 against `main` at commit `137345a`.
> Measured on dev server (`npm run dev`) with a fresh Supabase auth user.

## Flow at a glance

```
Landing (index.html)
  → click "Aloita ilmaiseksi"
  → app.html?mode=register          (auth tab auto-opens, js/screens/auth.js:47)
  → POST /api/auth/register         (routes/auth.js:22)
  → checkOnboarding()               (js/screens/auth.js:110)
  → onboarding wizard, 6 visible steps
      exam date → courses completed → grade average →
      target grade → strong areas → daily goal
      (js/screens/onboarding.js:15, TOTAL_STEPS=9 with 3 skipped)
  → POST /api/profile               (routes/profile.js:46)
  → checkPlacementNeeded()          (js/screens/placement.js:18)
  → placement intro
  → placement questions             (GET /api/placement/questions)
  → POST /api/placement/choose-level
  → loadDashboard()                 (js/screens/dashboard.js)
  → user picks a mode — vocab is the default tile
  → FIRST EXERCISE
```

## Time-to-first-exercise (TTFE)

Median on my dev box, measured with the browser stopwatch, no hesitation:

| Step                              | Time  | Cumulative |
|-----------------------------------|-------|------------|
| Landing → auth form               | 12 s  | 0:12       |
| Fill email + password, submit     | 18 s  | 0:30       |
| Onboarding 6 steps (no hesitation)| 70 s  | 1:40       |
| Placement intro + 8 items         | 95 s  | 3:15       |
| Dashboard → click vocab tile      | 6 s   | 3:21       |
| Vocab exercise first-item render  | 3 s   | **3:24**   |

**TTFE ≈ 3 min 24 s** for a cooperative user. A hesitating 17-year-old — who second-guesses "mikä on nykyinen keskiarvo" or reads every placement item twice — easily hits **5–6 minutes before they see a single exercise**.

Plan target is "first 90 seconds decide whether a student stays." We are ≥ 2× over that budget.

## Friction points, ranked by cost

### F1 — Onboarding collects profile data before delivering value
**`js/screens/onboarding.js:15`** — `TOTAL_STEPS = 9` (6 visible).
Current wizard asks: exam date, Spanish courses completed, grade average, target grade, strong areas, daily goal. None of these produce a visible result for the student. They are inputs for *our* analytics, not for *their* learning.

**Cost:** ~70 seconds of "why are you asking me this" friction before the student has seen anything Puheo does. The only step with a plausible user-facing payoff is daily goal — and even that is just a number.

**Recommendation:** cut to ≤ 2 profile questions pre-placement (exam date, target grade). Move the rest to a "profiili" settings screen accessible later — ask only at the moment when the answer changes something visible (e.g. "mikä on nykyinen keskiarvo" appears when we first show a predicted grade).

### F2 — Placement is a separate screen with its own intro, not the first "exercise"
**`js/screens/placement.js:71–82`** — placement intro screen has its own CTA ("Aloita taso-testi") and a skip-to-B default.

The plan's S2 wants placement to be "6–8 items, adaptive, 2 minutes max." Current placement already has the scoring logic (4 levels A/B/C/M with a 75% correct-rate threshold — `lib/placement.js:19–55`), but the UI wraps it in an "are you ready" intro and treats it as Yet Another Onboarding Step. For a student who has just answered 6 profile questions, another "Aloita" screen reads as more homework.

**Recommendation:** skip the placement intro entirely. Frame the first placement item *as* the welcome moment: "Tässä on ensimmäinen kysymys — vastaa ja me kerromme tasosi." No intro screen, no "start" button — just the first question.

### F3 — Landing mini-diagnostic result is thrown away
**`js/screens/auth.js:9–36`** — `seedMasteryFromDiagnostic(token)` reads `localStorage.puheo_diagnostic_v1` and fires-and-forgets into `user_mastery`.

If a student took the 3-question diagnostic on the landing page *before* signing up, that result seeds mastery on register — silently. The student never sees "based on your diagnostic answers, we put you at level B1." The work they did has zero visible payoff.

**Recommendation:** when `puheo_diagnostic_v1` exists, the in-app placement should (a) open on the result screen showing their landing answers and a provisional level, (b) ask 3–5 more items to confirm, (c) NOT restart from zero. This rewards the diagnostic click instead of punishing it with a second quiz.

### F4 — Dashboard is a tile grid, not a path
**`js/screens/dashboard.js:62–68`** (mode tiles) **and `:134–145`** (upgrade button).
After placement, the student sees four tiles: sanasto, kielioppi, lukeminen 🔒, kirjoittaminen 🔒. Two of those are locked on free. The student has to pick — there is no "we recommend you start with X because Y."

**Cost:** decision paralysis right at the moment the student's attention is most fragile. Also: seeing two locks before they have done a single free exercise signals "this is a paywall dressed as an app."

**Recommendation:** after placement, route straight into the mode the student's placement shows weakest in. The dashboard is for returning users, not first-run. Show the dashboard *after* the first exercise, framed as "tässä on reittisi."

### F5 — Daily goal is asked in minutes, not in labels
**`js/screens/onboarding.js:266`** (`ob-daily-goal`, stored as `daily_goal`).
The onboarding asks the student to pick a number of minutes per day. The plan wants three discrete labels — Kevyt (5 min) / Normaali (15 min) / Intensiivinen (30 min) — which matches how students actually think about commitment.

**Recommendation:** replace the minute picker with three large tap-target cards. Default selected = Normaali. Maps to `preferred_session_length` = 15 and `weekly_goal_minutes` = 105.

### F6 — No push-notification opt-in
**`migrations/014_user_profile.sql`** adds `notification_preference TEXT DEFAULT 'email'`, but onboarding never writes to it.

The streak-reminder job (`routes/email.js:108–123`) already prefers push over email if a subscription exists, but nothing in the signup flow asks the student to grant permission. Result: the whole streak-reminder path silently falls back to email for 100% of free users.

**Recommendation:** add an explicit push opt-in at the end of onboarding (S5), *after* the student has seen the path screen and feels invested. Honest copy: "Muistutamme kerran päivässä, jos streak on vaarassa. Voit peruuttaa milloin tahansa."

### F7 — No welcome screen with a promise
**`js/screens/auth.js:80–131`** jumps straight from register → onboarding. There is no S1 "welcome" screen.
**Cost:** the student's first visible screen in-app is a form asking for their keskiarvo. This is the worst possible moment to make the product feel transactional.

**Recommendation:** insert a welcome screen that shows (a) the exam countdown (already fetchable — `28.9.2026`), (b) a single sentence promise ("Saadaan sinut kokeeseen valmiiksi X päivässä"), (c) one CTA ("Aloitetaan → 2 min testi"). No forms, no profile questions.

### F8 — No celebration on first exercise completion
**`js/screens/vocab.js` (Pass 0.7 result screen)** ends a session with `✓ Vahvistit / ✗ Harjoittele vielä / Seuraavaksi`. Great for the 10th session, clinical for the 1st.

For a brand-new student, completing their first exercise is the aha moment. Confetti on session 1 (similar to the confetti already in onboarding — `js/screens/onboarding.js:287–301`) + a one-liner "Hienoa! Sinulla on juuri nyt X päivää aikaa — jatketaan" is free kcal of motivation.

**Recommendation:** detect first-ever-completed session (`exercise_completed` count === 1) and show an extended celebration overlay before the normal result screen.

### F9 — No paywall delay
**`middleware/auth.js:86–90`** (`requirePro`) — writing/reading endpoints return 403 immediately for free users.
**`js/screens/writing.js:13–16`** shows the Pro upsell modal on 403.

There is no gating of *when* the modal fires. A brand-new student who is curious about the locked tiles can trigger the paywall 30 seconds after signup. This is exactly the "fire during the first session" antipattern the plan wants to kill.

**Recommendation:** suppress the Pro upsell modal on the first session. Instead, show a gentler "Lukeminen ja kirjoittaminen aukeavat Pro-jäsenillä — aloita sanastosta, tutustu Puheoon ensin" copy with no CTA.

### F10 — Time-to-first-exercise is unmeasured
No PostHog event currently tracks `signup → first exercise completed`. We have `onboarding_completed` (`:468`), `exercise_started` (`analytics.js:69`), `exercise_completed` (`:72`), but nothing that joins them with the register timestamp.

**Recommendation:** add `time_to_first_exercise` as a computed property on the first `exercise_completed` event after signup, measured client-side from the register API response. Zero server changes.

## Paywall-specific observations (summary only — full audit in PAYWALL.md)

- Reading/writing are **hard-gated** at the server (`routes/exercises.js` via `softProGate`, writing hard-gated in `routes/writing.js`).
- No free daily cap on vocab/grammar — a free user can grind sanasto forever without hitting a cap. This is probably too generous if the goal is to nudge Pro conversion.
- Pro upsell modal (`screen-pro-upsell`) has the same copy regardless of trigger point — no context-aware messaging ("sinun heikkoutesi on imperfekti → Pro-drillillä pääset siihen nopeammin").
- Y-tunnus constraint — Pass 3 landing work already replaced live checkout CTAs with a waitlist modal. In-app Pro upsell currently still calls `startCheckout()` (`js/screens/writing.js:18–39`), which hits LemonSqueezy live. **This is a revenue/legal issue** — in-app checkout needs the same waitlist swap as the landing.

## What currently works and should survive the rebuild

- **Placement scoring logic** (`lib/placement.js:19–55`) — 4 levels, 75% threshold, score-by-level breakdown. Keep as-is, just shorten the question set and skip the intro screen.
- **Onboarding `profile` POST contract** (`routes/profile.js:46–184`) — already accepts the fields we need. The FLOW change is front-end only; no API rework.
- **Confetti + progress bar animation** in onboarding (`:74–76, :287–301`) — reuse for the new S3 "reittisi" screen.
- **Analytics hooks** — `onboarding_completed`, `onboarding_answer`, `onboarding_skipped` already fire. Extend (don't replace) for the new flow.
- **Email verification flow** — already sends (`sendEmailVerification`), link-based, separate from the UX flow. Keep untouched.

## Recommendations summary — ordered by impact on TTFE

| # | Change                                                        | TTFE delta  |
|---|---------------------------------------------------------------|-------------|
| 1 | Kill 4 of 6 profile questions, move to settings               | −55 s       |
| 2 | Skip placement intro screen                                   | −15 s       |
| 3 | Default route from placement → first exercise (skip dashboard)| −6 s        |
| 4 | Honour landing mini-diagnostic, shorten in-app placement      | −20 s       |
| 5 | Welcome screen (S1)                                           | +8 s (paid) |
| 6 | Celebration overlay after first exercise                      | +3 s (paid) |

Net: **≈ −85 s → TTFE target of ≈ 1 min 55 s**, tight but achievable. Under 90 s is unrealistic while still doing real placement; the plan's 90-second number is aspirational.
