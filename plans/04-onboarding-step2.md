# Pass 4 — Onboarding + paywall · Step 2 (build)

Step 1 produced `onboarding/` design docs. Read them first.

## Approved modifications from marcel

> _Fill before running._

## Commit sequence

Follow `onboarding/PLAN.md`. Rules:
- Each screen ships as one commit.
- Soft-gate logic ships as a shared helper (`lib/paywall.js`), then feature flags per paywall point.
- Emails ship one per commit so they can be A/B-tuned later.

## Phase gates

**Gate A — Onboarding screens.** S1–S5 built. Adaptive router integration on S4 uses the existing Pass 0 dispatcher. Placement shortened per FLOW §S2.

**Gate B — Paywall rules.** New `lib/paywall.js` helper. Every existing hardcoded paywall check migrated through it. Soft-gate vs hard-gate matrix enforced. **Upgrade button routes to placeholder flow** (waitlist page or TEST_PRO_EMAILS dev-flip), NOT to live LemonSqueezy checkout. Y-tunnus deferral applies — see PAYWALL.md.

**Gate C — Email drip.** D0, D1, D3, D7, exam-30, exam-7 emails shipped via Resend. Weekly email tuned. Unsubscribe respected (already in `routes/email.js`, verify).

**Gate D — Analytics + funnel.** PostHog events: `onboarding_started`, `placement_completed`, `first_exercise_completed`, `daily_goal_set`, `push_opt_in`, `paywall_shown`, `paywall_converted`, `paywall_dismissed`, `email_opened`, `email_clicked`. Dashboard set up.

## Quality bar

- Time-to-first-exercise ≤ 90 seconds for a median signup (measured).
- Zero paywall during first session — test proves it.
- Every email renders clean on Gmail mobile, Outlook mobile, Apple Mail, dark mode + light mode.
- Placement test grades honestly — test with a known-B1 answer set and assert B1 placement.
- Push permission ask only fires after explicit user interaction (Safari/iOS requirement).

## Done

- All 4 gates merged.
- Funnel dashboard live.
- `onboarding/POSTSHIP.md` written.
