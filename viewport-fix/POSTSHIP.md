# Viewport-fix POSTSHIP — Pass 1.5

Gate D of Pass 1 Step 2 already met the ≥960 px desktop bar on every app screen
by widening containers to `--w-desktop` (1080 px). Pass 1.5 closes the two
remaining gaps from `plans/01.5-viewport-correction.md`: the side-panel primitive
was flag-gated and unused, and the dashboard still stacked every section
vertically.

## What shipped

- **Side-panel primitive lives without a flag.** `css/components/side-panel.css`
  no longer scopes its rules to `body[data-ff-side-panel="1"]`. Any screen that
  uses `.split` / `.split__main` / `.split__aside` gets a sticky 380 px right
  rail at ≥1200 px and a stacked single column below. `js/features/flags.js`
  drops `side_panel` from its flag list; `tests/side-panel.test.js` rewritten
  to guard the simpler contract.
- **Dashboard pairs sections on desktop.** Two `.dash-grid-row` wrappers pair
  (Aktiivisuus heatmap + Kehitys chart) and (Suositukset + Viimeisimmät).
  Below 1024 px each child stacks as before; if one is `.hidden` the grid
  collapses to the visible child. No before-after width change — container
  stays at 1080 px — but the 30-day trend row and the "what next / what
  happened" row both flatten to half-height on a 1440 px laptop.
- **Audit artifact.** `viewport-fix/AUDIT.md` records the CSS-source audit.

## Before / after

| Screen | Before (Gate D) | After (Pass 1.5) |
|---|---|---|
| Dashboard | 1080 px wide, 13 sections stacked | 1080 px wide, heatmap+chart paired, recs+recent paired |
| All other app screens | 1080 px wide, single column | unchanged |
| `.split` primitive | flag-gated, no consumers | live, no consumers yet |

## Deferred

- **Exercise feedback in `.split__aside`.** Wiring `js/screens/exerciseRenderer.js`
  + `js/screens/writing.js` to render feedback / rubric / hints into the aside
  needs a screen-by-screen JS pass with visual review. Out of scope here.
- **Dashboard three-column stats header, learning-path tree+detail, exam two-
  column text+questions.** Each needs HTML restructuring that Gate D already
  explicitly deferred; same reasoning applies — should go through a proper pass
  with Playwright baselines, not a blind CSS edit.
- **Screenshots at 1440×900 and 390×844 + Playwright re-baselining.** Playwright
  browsers are not installed in this dev env (same blocker called out in
  design-system/POSTSHIP.md). Defer to whichever pass installs the harness.
- **Deploy to production.** Left to marcel; `fixes/viewport-priority` is on
  `main` but not pushed to remote by this pass.

## Verification

- `npm test` — 602/602 green after each commit on `fixes/viewport-priority`.
- marcel to open the app locally on a 1440×900 laptop and confirm the dashboard
  no longer feels phone-shaped, and on a 390×844 phone to confirm nothing
  regressed. Side-panel has no on-screen effect today (no consumers) but can
  be smoke-tested by adding `<div class="split"><div class="split__main">A</div><aside class="split__aside">B</aside></div>`
  to any screen.

## Commits (on `fixes/viewport-priority`)

1. `chore(audit): viewport-fix CSS-level audit`
2. `fix(layout): drop ff_side_panel flag — .split primitive is live`
3. `fix(layout): pair dashboard sections on desktop (heatmap+chart, recs+recent)`
4. `docs(viewport-fix): POSTSHIP — what shipped + deferred`
