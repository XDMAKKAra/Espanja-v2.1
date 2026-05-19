# Task 1 — Dashboard writing-first IA + confirm-modal Old-Spain restyle

**Date:** 2026-05-19
**Scope:** one PR, `auto/task1-dashboard-writingfirst-confirm`

## Problem

`#screen-path` renders five competing focal points (KPI row, day-CTA, course list, readiness card, recent list + chart). The hero competes with the KPI tiles; the SR-CTA points to a frozen review queue (vocab/grammar SR cards are no longer produced after PR #86); the confirm-modal uses dark Linear-tier tokens that don't match the rest of the app's writing-grader brand register.

## Decisions

**Sub-fix A — SR-CTA:** option **B** (chosen by user 2026-05-19). Remove the `srDueCount > 0` branch in `selectDashboardCta` so the day-CTA is always "Kirjoita päivän tehtävä". Keep `routes/sr.js`, `lib/scheduler.js`, and the `sr_cards` table in place (Task 4 / future work); just stop pointing the dashboard at them. Remove the hidden `#btn-start-review` trigger from `app.html` since nothing dispatches to it anymore.

**Sub-fix B — confirm-modal:** restyle `css/components/teaching-panel.css` `.confirm-dialog*` rules with Old-Spain tokens:
- card surface `--ed-bg-card` with `--ed-shadow-lg` and `--ed-rule` border
- title in `--ed-display` (Fraunces)
- secondary button = ghost on `--ed-bg-card` with `--ed-rule-strong` border, `--ed-ink-muted` text
- primary button = `--ed-accent` (brick) fill, `--ed-accent-ink` text (cream); confirm button is destructive in the "lopeta oppitunti" context, so the brick reads right
- backdrop `--ed-ink` at 0.55 alpha
- 220ms fade + 8px translate, `prefers-reduced-motion` zeros transition

**Sub-fix C — Dashboard IA:**
- Demote `.dash-kpi-row` below the course list (rail bottom on desktop, stack bottom on mobile). Stays accessible but no longer competes with the hero.
- Single primary above-the-fold CTA = day-CTA (writing). Greeting + CTA in one tight band.
- Keep `#path-courses-root` as the dominant left-column element.
- Empty-state rail card (`dash-empty-rail`) and recent/chart sections stay in the right rail.

## Non-goals

- Full Old-Spain reskin of `#screen-path` body (KPI tiles, course cards, chart) — that's a separate effort. This PR keeps dark Linear-tier theming for everything except the confirm-modal.
- Removing vocab.js/grammar.js/verbSprint.js (Task 4).
- Backend changes to `routes/sr.js` (kept for future writing-error-SR investment).

## Acceptance

- `selectDashboardCta` no longer returns `kind: "sr"`; covered by `tests/dash-cta.test.js` update.
- `#btn-start-review` removed from `app.html`.
- Confirm-modal renders cream card with Fraunces title, brick primary, ghost secondary; Esc/backdrop/outside-click close; focus returns to trigger.
- KPI row appears AFTER course list in DOM order, hidden on initial paint when `dash-kpi-row--empty`.
- `sw.js` `CACHE_VERSION` bumped.
- `npm test` green.
- `node --check` clean on touched JS.
