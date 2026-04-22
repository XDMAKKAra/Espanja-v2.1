# Onboarding Flow — Puheo (new)

> 5 screens, mobile-first, Finnish.
> Goal: first exercise completed in ≤ 2 min 30 s from signup.
> Every step skippable **except S2 placement** (we cannot personalise without it).

## Flow diagram

```
REGISTER
   │
   ▼
[ S1 Tervetuloa ]  ──(skip: "Hyppää väliin")──┐
   │                                          │
   ▼                                          │
[ S2 Tasotesti ]    (NOT skippable)           │
   │                                          │
   ▼                                          │
[ S3 Reittisi ]   ──(skip: "Näytä sovellus")──┤
   │                                          │
   ▼                                          │
[ S4 Ensimmäinen harjoitus ]  ──(skip)────────┤
   │                                          │
   ▼                                          │
[ S5 Tavoite + muistutukset ] ──(skip)────────┤
   │                                          │
   └──────────────► DASHBOARD ◄───────────────┘
```

Skipping anything except S2 sets `onboarding_completed = true` but records `onboarding_skipped_at_step` so we can measure how lossy the flow is. S2 skip is suppressed — we default to level B with a visible warning ("Arvaamme tasoksi B1 — tarkennamme myöhemmin").

---

## S1 — Tervetuloa

### Goal
Deliver the single promise, anchored on the exam date. No form fields. One CTA.

### Mocks

**Mobile (≤ 480px)**
```
┌──────────────────────────────┐
│                              │
│                              │
│      ESPANJAN YO-KOE         │   ← eyebrow, mono, muted
│                              │
│         126 päivää           │   ← display font, 56px
│                              │
│       28.9.2026 klo 9:00     │   ← mono, muted
│                              │
│  ────────────────────────    │   ← dashed divider
│                              │
│   Saamme sinut kokeeseen     │
│   valmiiksi. Aloitetaan      │   ← serif italic, 20px
│   2 minuutin tasotestillä.   │
│                              │
│                              │
│   ┌────────────────────┐     │
│   │ Aloita tasotesti → │     │   ← primary, full-width
│   └────────────────────┘     │
│                              │
│          Hyppää väliin       │   ← tertiary link
│                              │
└──────────────────────────────┘
```

**Desktop (≥ 1024px)**
Same content, centered column `max-width: 520px`, everything else stretches. No two-column — this screen is intentionally single-focus.

### Copy (Finnish, exact)

| Slot            | Text                                                     |
|-----------------|----------------------------------------------------------|
| Eyebrow         | `Espanjan yo-koe`                                        |
| Countdown       | `{n} päivää` (computed from `28.9.2026 09:00 EEST`)      |
| Exam label      | `28.9.2026 klo 9:00`                                     |
| Promise         | `Saamme sinut kokeeseen valmiiksi. Aloitetaan 2 minuutin tasotestillä.` |
| Primary CTA     | `Aloita tasotesti →`                                     |
| Skip link       | `Hyppää väliin`                                          |

### Empty / error / skip

- **Empty state:** N/A — screen has no data dependencies.
- **Error state:** if `examMs - now <= 0` (exam day passed), show `Seuraava yo-koe kevät 2027. Valmistaudutaan ajoissa.` and swap countdown for the `Kevät 2027` placeholder.
- **Skip:** sets `onboarding_completed = true`, marks `onboarding_skipped_at_step = 1`, skips S2–S5, routes to dashboard with all 4 tiles visible. Placement is implicitly level B.

### PostHog events
- `onboarding_welcome_viewed` on mount.
- `onboarding_welcome_cta` on primary click.
- `onboarding_skipped { step: 1 }` on skip.

---

## S2 — Tasotesti (NOT skippable)

### Goal
6–8 adaptive placement items, ≤ 2 minutes. Reuse `lib/placement.js` scoring. No "are you ready" intro — first item is the screen.

### Mocks

**Mobile**
```
┌──────────────────────────────┐
│ ▓▓▓▓▓░░░░░░░░░░░░░░░░░  2/7  │   ← progress bar + counter, 4px tall
│                              │
│   KYSYMYS 2 / 7              │   ← eyebrow, mono, muted, 11px
│                              │
│   Ayer yo ___ a Madrid       │   ← serif, 22px, 1.5 line-height
│   con mis amigos.            │
│                              │
│   ┌────────────────────┐     │
│   │ A  voy             │     │   ← option, 54px tall
│   └────────────────────┘     │
│   ┌────────────────────┐     │
│   │ B  fui             │     │
│   └────────────────────┘     │
│   ┌────────────────────┐     │
│   │ C  iba             │     │
│   └────────────────────┘     │
│   ┌────────────────────┐     │
│   │ D  he ido          │     │
│   └────────────────────┘     │
│                              │
│      En tiedä — hyppää       │   ← tertiary, tiny
│                              │
└──────────────────────────────┘
```

After an answer: option tints green/red with one-line feedback for 500 ms → auto-advance. No "next" button. Speed matters more than reflection here; real learning starts at S4.

**Desktop**
Same layout in a centered `max-width: 620px`. Keyboard A/B/C/D selects.

### Copy

| Slot                | Text                                        |
|---------------------|---------------------------------------------|
| Eyebrow             | `Kysymys {n} / {total}`                     |
| "Don't know"        | `En tiedä — hyppää`                         |
| Completion message  | `Valmis. Tasosi on **{level}**.`            |

### Adaptive selection

- Starts on level B.
- After each answer: if correct, next item is one level up (capped at L). If wrong, one level down (floor A).
- Pre-seeded from `localStorage.puheo_diagnostic_v1` when present: start at the average of landing-diagnostic answers; ask 5 items instead of 7 (we already have signal).
- 6 items minimum, 8 maximum. Stop early if 3 consecutive answers at the same level converge.
- Ties go to the lower level (under-promise).

### States

- **Empty / loading:** skeleton for the question block, no skeleton for the options (they slide in with the question).
- **Error (API fail):** single retry button: "Yhteys katkesi. Yritä uudelleen →". After second failure: "Emme saaneet yhteyttä. Arvaamme tasoksi B — tarkennamme myöhemmin." Proceed with level B.
- **Skip:** not permitted. "En tiedä" links count as wrong, don't skip the flow.
- **Placement result screen (brief, 2 s):** `Valmis. Tasosi on B1.` → auto-advance to S3.

### PostHog events
- `placement_started` on first item render.
- `placement_answer { level, item_id, correct, time_ms }` per answer.
- `placement_completed { level, items, duration_ms, used_diagnostic_seed }`.
- `placement_api_failed` on fallback.

---

## S3 — Reittisi

### Goal
Show what we now know: level, weakest area(s), recommended weekly pace. The countdown that was in S1 now becomes the permanent top-bar element.

### Mocks

**Mobile**
```
┌──────────────────────────────┐
│ 📅 126 pv YO-kokeeseen       │   ← top bar, persistent from here on
│──────────────────────────────│
│                              │
│   TASOSI NYT                 │   ← eyebrow
│                              │
│          B1                  │   ← huge, display font, 72px
│                              │
│   Vähän alle YTL-tavoitteen  │   ← sub, muted
│   (B1.1 → B2.1)              │
│                              │
│  ────────────────────────    │
│                              │
│   HEIKOIN ALUE               │
│   Sanastossa epäsäännölliset │
│   preterit-verbit.           │   ← serif italic, 18px
│                              │
│  ────────────────────────    │
│                              │
│   SUUNNITELMASI              │
│                              │
│   ● 15 min / päivä           │
│   ● 18 viikkoa jäljellä      │
│   ● ~12 harjoitusta / viikko │
│                              │
│                              │
│   ┌────────────────────┐     │
│   │ Jatka → 1. harj.   │     │   ← primary
│   └────────────────────┘     │
│                              │
│       Näytä sovellus         │   ← skip
│                              │
└──────────────────────────────┘
```

**Desktop**
Two-column on ≥ 960 px: left column = tasosi + heikoin alue, right column = suunnitelma. CTA under both columns, centered.

### Copy

| Slot           | Text                                                                   |
|----------------|------------------------------------------------------------------------|
| Top bar        | `📅 {n} pv YO-kokeeseen`                                               |
| Eyebrow 1      | `Tasosi nyt`                                                           |
| Gap line       | `Vähän alle / Juuri / Yli YTL-tavoitteen ({current} → {target})`       |
| Eyebrow 2      | `Heikoin alue`                                                         |
| Weakness       | One sentence named from placement data (see "Weakness sentence" below) |
| Eyebrow 3      | `Suunnitelmasi`                                                        |
| Plan line 1    | `{min} min / päivä` (15 default; user picks in S5)                     |
| Plan line 2    | `{weeks_to_exam} viikkoa jäljellä`                                     |
| Plan line 3    | `~{n} harjoitusta / viikko` (weekly_minutes / 90 s per exercise)       |
| Primary        | `Jatka → 1. harjoitus`                                                 |
| Skip           | `Näytä sovellus`                                                       |

### Weakness sentence
Pick the placement item category with the lowest correct-rate and map to a human sentence:

| Category                       | Sentence                                            |
|--------------------------------|-----------------------------------------------------|
| `preterite_irregular`          | `Sanastossa epäsäännölliset preterit-verbit.`       |
| `subjunctive_present`          | `Subjunktiivin tunnistaminen käskymuodoissa.`       |
| `por_vs_para`                  | `Por- ja para-prepositioiden erottaminen.`          |
| `ser_vs_estar`                 | `Ser ja estar — tilapäinen vs. pysyvä.`             |
| `pronouns_reflexive`           | `Refleksiiviverbit ja pronominit.`                  |
| `gender_agreement`             | `Adjektiivien sukusopu.`                            |
| `vocab_food` / `vocab_travel` / ... | `Sanasto: {teema}.`                            |
| fallback (no clear weakness)   | `Yleinen sanasto ja kielioppi — vahvistamme kaikkea.`|

### Empty / error / skip

- **Empty:** shouldn't occur — every placement produces a score-by-level breakdown.
- **Error (placement data missing):** show the screen with level `B1`, plan `15 min / päivä`, and replace the weakness section with `Aloitetaan sanastosta ja katsotaan missä haasteet ovat.` Log `onboarding_s3_fallback`.
- **Skip:** `onboarding_skipped_at_step = 3`, routes to dashboard.

### PostHog events
- `onboarding_path_viewed { level, weakness_category }`.
- `onboarding_path_cta` on primary click.
- `onboarding_skipped { step: 3 }` on skip.

---

## S4 — Ensimmäinen harjoitus

### Goal
Adaptive-router picks a single exercise from the student's weakest topic. On completion: celebration overlay, then dashboard.

### Spec (not a new screen — reuses vocab/grammar renderer)

- The adaptive router (`lib/sessionComposer.js`) already handles topic-weighted selection. Call it with `{ first_session: true, preferred_category: weakness_category, max_items: 4 }`.
- Exercise mode for first session: **grammar if weakness is grammatical, vocab otherwise**. Never reading, never writing (those are Pro-gated and would poison S4).
- Session is 4 items. Shorter than the default 11 (Pass 0.5 standard) — we need the student to hit a complete-state inside 60 seconds.
- Result screen is the standard Pass 0.7 screen (`✓ Vahvistit / ✗ Harjoittele vielä / Seuraavaksi`).

### Celebration overlay (first-exercise only)

Fires ONCE per user, detected by `exercise_completed` count === 1. Overlays the result screen for 3 seconds then dims to let the student read the Pass 0.7 result content.

```
┌──────────────────────────────┐
│                              │
│         🎉                   │
│                              │
│     Ensimmäinen valmis.      │   ← serif, 28px
│                              │
│   Olet aloittanut — paras    │   ← sub, 16px
│   askel jo tehty.            │
│                              │
│                              │
│         [ dismiss ]          │
└──────────────────────────────┘
```

Confetti: reuse `onboarding.js:287–301` particle code.
Auto-dismiss after 3 s or on tap anywhere.

### Copy

| Slot                   | Text                                       |
|------------------------|--------------------------------------------|
| Celebration headline   | `Ensimmäinen valmis.`                       |
| Celebration sub        | `Olet aloittanut — paras askel jo tehty.`  |

### Empty / error / skip

- **Empty (session composer returns 0 items — shouldn't happen but possible):** show S3 again with an apology banner `Harjoitukset latautuvat hetken — palaamme tähän.` and retry after 3 s.
- **Error (exercise API 5xx):** generic retry modal (already exists — `js/screens/vocab.js` handles it).
- **Skip (mid-exercise):** tertiary "Hyppää väliin" link shown after the first item. Records `onboarding_skipped_at_step = 4` and routes to dashboard. No celebration overlay on skip.

### PostHog events
- `first_exercise_started { mode, level, category }`.
- `first_exercise_completed { mode, correct, total, duration_ms, time_since_signup_ms }` — the TTFE event.

---

## S5 — Tavoite + muistutukset

### Goal
Pick daily goal (labels, not minutes). Push opt-in. Exit to dashboard.

### Mocks

**Mobile**
```
┌──────────────────────────────┐
│ 📅 126 pv YO-kokeeseen       │
│──────────────────────────────│
│                              │
│   PÄIVITTÄINEN TAVOITE       │   ← eyebrow
│                              │
│   ┌────────────────────┐     │
│   │ Kevyt              │     │
│   │ 5 min / päivä      │     │   ← card, selectable
│   └────────────────────┘     │
│   ┌────────────────────┐     │
│   │ Normaali ✓         │     │   ← default selected, brand tint
│   │ 15 min / päivä     │     │
│   └────────────────────┘     │
│   ┌────────────────────┐     │
│   │ Intensiivinen      │     │
│   │ 30 min / päivä     │     │
│   └────────────────────┘     │
│                              │
│  ────────────────────────    │
│                              │
│   MUISTUTUKSET               │
│                              │
│   Muistutamme kerran         │
│   päivässä, jos streak on    │
│   vaarassa. Voit peruuttaa   │
│   milloin tahansa.           │
│                              │
│   ┌────────────────────┐     │
│   │ Salli muistutukset │     │   ← secondary, triggers browser push API
│   └────────────────────┘     │
│                              │
│   ┌────────────────────┐     │
│   │ Valmis →           │     │   ← primary
│   └────────────────────┘     │
│                              │
│         Ohita tämä           │   ← skip
│                              │
└──────────────────────────────┘
```

**Desktop**
Three goal cards horizontal, reminders block below, CTAs right-aligned.

### Copy

| Slot                  | Text                                                                |
|-----------------------|---------------------------------------------------------------------|
| Eyebrow 1             | `Päivittäinen tavoite`                                              |
| Kevyt card            | `Kevyt` / `5 min / päivä`                                           |
| Normaali card         | `Normaali` / `15 min / päivä`                                       |
| Intensiivinen card    | `Intensiivinen` / `30 min / päivä`                                  |
| Eyebrow 2             | `Muistutukset`                                                      |
| Reminder body         | `Muistutamme kerran päivässä, jos streak on vaarassa. Voit peruuttaa milloin tahansa.` |
| Reminder CTA          | `Salli muistutukset`                                                |
| Primary               | `Valmis →`                                                          |
| Skip                  | `Ohita tämä`                                                        |

### Data

- Goal maps to (`preferred_session_length`, `weekly_goal_minutes`):
  - Kevyt → (5, 35)
  - Normaali → (15, 105)
  - Intensiivinen → (30, 210)
- `Salli muistutukset` triggers `Notification.requestPermission()`. On grant → POST `/api/profile { notification_preference: 'push' }`. On deny or dismiss → leave as `email`.
- "Valmis →" sets `onboarding_completed = true` in `user_profile`.

### Empty / error / skip

- **Empty:** default Normaali is always pre-selected.
- **Error (Notification API unavailable — Safari iOS):** hide the "Salli muistutukset" button, replace with `Muistutamme sähköpostilla.` Don't block the flow.
- **Skip:** Normaali chosen implicitly, `notification_preference` left as email, `onboarding_skipped_at_step = 5`, route to dashboard.

### PostHog events
- `onboarding_goal_set { goal: 'kevyt' | 'normaali' | 'intensiivinen' }`.
- `push_permission_requested`.
- `push_permission_granted | denied | dismissed`.
- `onboarding_completed { level, goal, push_enabled, time_total_ms }`.

---

## Cross-cutting decisions

### Top bar countdown (persistent from S3)

Once the student reaches S3, the top bar gains a permanent `📅 {n} pv YO-kokeeseen` element. This replaces the currently-unused top-right slot in `app.html`. It updates hourly (reuse the countdown IIFE pattern from `index.html`).

**Dismissible:** yes, via a subtle `×` to the right of the count. For students who find an always-visible countdown anxiety-inducing (common in the last 2 weeks). Dismissal sets `localStorage.puheo_countdown_dismissed = true` and the bar hides for that session + future sessions on the same device.

Even when dismissed, the countdown still shows in three specific places: (a) the S3 path screen, (b) the dashboard grade widget caption, (c) email subject lines and bodies. The anxious student can hide it from the chrome but can't erase the exam from the product. Re-enable via Settings → `Näytä päivälaskuri`.

### Mobile-first constraints

- Viewport: target 360–414 px. All screens must be single-column on ≤ 480 px.
- Every interactive element ≥ 48×48 px (WCAG touch target).
- `font-display: swap` assumed (already set in Pass 1.7 CSS).
- Zero keyboard-traps; browser back works at every step.

### State model (front-end)

Add to existing state store:

```
state.onboarding = {
  currentStep: 1..5,
  completed: boolean,
  skippedAtStep: 1..5 | null,
  placement: { level, scoreByLevel, weakestCategory },
  goal: 'kevyt' | 'normaali' | 'intensiivinen',
  pushEnabled: boolean,
  startedAt: number (Date.now()),
}
```

Persist to `localStorage.puheo_onboarding_v2` so a refresh doesn't kick the student back to S1.

### Accessibility

- Each step has a single `<h1>`, no nested landmarks.
- Progress bar in S2 has `role="progressbar"` with `aria-valuenow`.
- Placement options use keyboard letter shortcuts (A/B/C/D) on desktop.
- Celebration overlay has `aria-live="polite"` + `role="status"` so screen readers announce it without stealing focus.

### Analytics summary

New funnel events (prefixed `onboarding_` or used cross-screen):
`onboarding_welcome_viewed` → `placement_started` → `placement_completed` → `onboarding_path_viewed` → `first_exercise_started` → `first_exercise_completed` → `onboarding_goal_set` → `onboarding_completed`.

Drop-off between any two consecutive events is the funnel metric to monitor on the PostHog dashboard.
