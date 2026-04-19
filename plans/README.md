# Puheo — improvement plan (April 2026 → September 2026 exam)

Sequenced passes to take Puheo from "in-flight new-types build" to "polished, content-rich, converting product" by exam day 28.9.2026.

Every pass follows the two-phase pattern: a Step 1 design prompt (research + DESIGN.md + PLAN.md, stop for approval) and a Step 2 build prompt (gated commit sequence). Same pattern that worked for the training-improvement and new-types passes.

## Running order

| # | Pass | Step 1 | Step 2 | Target finish |
|---|---|---|---|---|
| 0 | Exercise types (in flight) | done | `exercise-types-step2-prompt.md` | ~May 10 |
| 0.5 | Critical live-site fixes | `00.5-critical-live-fixes.md` (single prompt, bugfix) | — | ~May 12 |
| 1 | Visual design system | `01-design-system-step1.md` | `01-design-system-step2.md` | ~May 19 |
| 2 | Content depth | `02-content-depth.md` (single prompt, content not code) | — | ~May 31 |
| 2.5 | Pedagogy hardening | `02.5-pedagogy-step1.md` | `02.5-pedagogy-step2.md` | ~Jun 7 |
| 3 | Landing + conversion | `03-landing-step1.md` | `03-landing-step2.md` | ~Jun 14 |
| 4 | Onboarding + paywall | `04-onboarding-step1.md` | `04-onboarding-step2.md` | ~Jun 21 |
| 5 | DB + cost hardening | `05-db-cost.md` (single prompt, audit+fix) | — | ~Jun 28 |
| 6 | Testing + reliability | `06-testing-step1.md` | `06-testing-step2.md` | ~Jul 10 |
| 6.5 | Live payments wire-up (after y-tunnus) | covered in `07-marketing.md` preface | — | ~Aug 10 |
| 7 | Marketing push | `07-marketing.md` (ongoing, not gated) | — | Aug–Sep |

## Skills reference per pass

- Pass 0.5: no skill (bugfix discipline)
- Pass 1: `ui-ux-pro-max`, `design-taste-frontend`, `theme-factory`
- Pass 2: `claude-education-skills` — Vocabulary Tiering, Retrieval Practice Generator, Cognitive Load Calibrator, Academic Sentence Frames, Assessment Validity Checker, Scaffolded Task Modification
- Pass 2.5: `claude-education-skills` — Spaced Practice Scheduler, Interleaving Designer, Adaptive Hint Sequence, Rubric Logic Generator, Spacing Algorithm Customizer, Erroneous Example Generator
- Pass 3: `ui-ux-pro-max`, `redesign-existing-projects`
- Pass 4: `ui-ux-pro-max`, `frontend-design`
- Pass 5: `supabase`, `supabase-postgres-best-practices`
- Pass 6: `webapp-testing`
- Pass 7: `internal-comms`, `brand-guidelines`

## Rules that apply to every pass

- Finnish UI only. Internal prompts can be English; anything a student sees is Finnish.
- Server-side correctness validation is non-negotiable for new code (the legacy `routes/progress.js:14-28` audit flaw is not this work's problem, but nothing new should inherit it).
- Don't edit `lib/auth` or `lib/openai` wrappers. Creating new `lib/` files is fine.
- Two-phase (design → approve → build) for non-trivial passes.
- Phase gates with stop-and-summarize at the end of each gate.
- No `main` commits in a build pass except prerequisite chores; feature work lives on per-gate branches.
- **⚠️ No live payments work until y-tunnus.** marcel doesn't have a Finnish business ID yet, so no LemonSqueezy live integration in any pass. Paywall UI, pricing pages, email drip mentioning Pro — all fine to build. Live checkout button → routes to "Coming soon, join waitlist" placeholder. Live wiring happens as Pass 6.5 once y-tunnus is registered (~Aug 2026).
