# Pass 3 — Landing + conversion · Step 2 (build)

Step 1 produced `landing/AUDIT.md`, `RESEARCH.md`, `DESIGN.md`, `BLOG.md`, `DIAGNOSTIC.md`, `PLAN.md`. Read all first.

## Approved modifications from marcel

> _Fill before running._

- _(modification 1)_

## Commit sequence

Follow `landing/PLAN.md` exactly. Rules:
- One section per commit (hero, social proof, problem/solution, demo, features, pricing, FAQ, footer, diagnostic, blog template).
- Every commit: Finnish strings audited, mobile + desktop screenshots captured, Lighthouse mobile perf ≥90 (higher bar on landing since it's the conversion engine).
- Design system tokens only — no new colors, no new typography, no one-off styles.
- Test: PostHog events wired on every CTA (track `landing_cta_click`, `diagnostic_started`, `diagnostic_completed`, `diagnostic_email_captured`, `pricing_viewed`, `signup_from_landing`).

## Phase gates

**Gate A — Shell + hero.** New HTML shell inheriting design-system CSS. Hero with countdown + inline mini-diagnostic entry point. Old content still present below the fold (hybrid state) until later gates replace sections.

**Gate B — Core sections.** Problem/solution, embedded product demo (real exercise iframe, not image), features, pricing. Each shipped as a separate commit within the gate.

**Gate C — FAQ + footer + trust.** Objection-handling FAQ, footer with all legal links, trust signals tuned per RESEARCH.md.

**Gate D — Diagnostic redesign.** `diagnose.html` + `data/diagnose_questions.json` reworked per `DIAGNOSTIC.md`. Email-after-value flow. Clean CTA to app sign-up.

**Gate E — Blog refresh + new posts.** Existing 5 posts re-templated against design system. 10 new posts per `BLOG.md` drafted and published. SEO meta verified via Google Search Console (tag is already in place).

## Quality bar

- Lighthouse mobile perf ≥90, accessibility 100.
- Finnish text rendering: no ä/ö fallback-font bleed.
- Zero layout shift (CLS = 0) on hero — measure it.
- FCP ≤1.5s on 3G profile.
- Dark mode works on landing too — respects OS preference.
- Every CTA is PostHog-tracked before the commit lands.

## Done

- All 5 gates merged.
- PostHog dashboard set up with the landing funnel (landing view → diagnostic start → diagnostic complete → email captured → signup → first exercise).
- `landing/POSTSHIP.md` — one-page summary.
