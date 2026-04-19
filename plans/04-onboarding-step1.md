# Pass 4 — Onboarding + paywall · Step 1 (design only)

Goal: the first 90 seconds after signup decide whether a student stays. Today that window is unclear. This pass designs a tight onboarding flow + tunes paywall timing.

**Prerequisites:** Passes 1, 2, 3 merged.

## Skills

- `.claude/skills/ui-ux-pro-max/SKILL.md`
- `.claude/skills/frontend-design/SKILL.md`

## Scope

Design (no code) the first-run experience and the paywall behavior.

## Deliverables

### 1. `onboarding/AUDIT.md`
Walk through current signup → first exercise flow. Screenshots, time-to-first-exercise measurement, every friction point cited with file + line.

### 2. `onboarding/FLOW.md`
The new flow — 3 to 5 screens max, mobile-first:
- **S1 — Welcome.** Exam countdown, single promise ("We'll get you exam-ready in X days"), one primary CTA.
- **S2 — Quick placement.** 6–8 items, adaptive, 2 minutes max. Reuse placement infra from `lib/placement.js`; just reskin and shorten.
- **S3 — Your path.** Shows the student's level, the gaps vs YTL B1, and the recommended weekly pace to exam day. Live countdown on this screen becomes permanent in the app top bar.
- **S4 — First exercise.** Adaptive router picks the best-fit item from the student's weakest topic. On finish, celebrate.
- **S5 — Set daily goal + push opt-in.** 3 options: Kevyt (5min) / Normaali (15min) / Intensiivinen (30min). Push permission ask worded honestly.

Each screen: Finnish copy, mobile + desktop mock, empty-state, error-state, skip-path (every step must be skippable except placement).

### 3. `onboarding/PAYWALL.md`
Current paywall timing: audit where it fires. Design new rules:
- **Never fire during the first session.** Give value first.
- **Fire after first "aha" moment** — when a student completes first exercise correctly, or when they unlock a new topic.
- **Fire at a dead-end, not a flow-break** — after finishing a session, not mid-exercise.
- **Copy:** emphasize exam-prep specificity ("Pro avaa 500+ tehtävää, YO-simulaatiot, AI-kirjoitusarviot").
- **Pricing:** inherit from Pass 3. Consistency between landing and paywall.

Include soft-gate vs hard-gate decision matrix per feature.

**⚠️ Y-tunnus constraint — no live payments this pass.** marcel does not yet have a Finnish business ID, so LemonSqueezy live checkout cannot be wired. This pass:
- Designs the paywall UI, copy, and timing logic in full.
- Wires the "Upgrade" button to a **placeholder** flow: either (a) a "Coming soon — join waitlist" page that captures email, or (b) for test accounts in `TEST_PRO_EMAILS`, a dev-only flag that flips the user to Pro in Supabase (no money moved).
- Does NOT touch `routes/stripe.js`, does NOT register live LemonSqueezy products, does NOT wire real webhooks to production billing.
- Live payments work happens as a separate mini-pass right before Pass 7 marketing, once marcel has y-tunnus.

The paywall design should still be production-quality — just don't connect the wires to real money. When y-tunnus lands, swapping the placeholder for live checkout is a one-commit job.

### 4. `onboarding/EMAILS.md`
Life-cycle email drip. Use Resend (already wired via `email.js`):
- **D0:** Welcome + set expectations.
- **D1:** "Here's your first weakness, let's fix it" — personalised from placement results.
- **D3:** "Your streak is at risk" + comeback CTA.
- **D7:** Upgrade offer if still on free; "congrats, keep going" if Pro.
- **Weekly:** progress summary + YO countdown. Continue existing weekly pattern from `routes/email.js` but tune content.
- **Exam -30:** "Exam is in 30 days — switch to exam-simulation mode." Auto-enables practice-exam mode in-app.
- **Exam -7:** Final-week plan.

Per-email: subject, preheader, body mock, Finnish, mobile + desktop render.

### 5. `onboarding/PLAN.md`
Commit sequence for Step 2. 10–12 commits. Screens first (S1 → S5), then paywall rule changes, then email drip. Each commit with files, test, acceptance.

## Stop here

Reply with flow summary, PLAN.md, open questions, ready-for-approval line.
