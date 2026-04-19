# Viewport-fix AUDIT — Pass 1.5

**Method.** Playwright browsers aren't installed in this dev env (design-system/POSTSHIP.md
notes the same constraint), so this audit is CSS-source based rather than screenshot based.
For every app screen the container rule is cited; layout column count and whether the
container already honours the `≥960 px on desktop` bar is recorded.

## Summary

Gate D of Pass 1 Step 2 already widened every app-screen container to `--w-desktop` (1080 px).
**Width bar is met everywhere.** The remaining Pass-1.5 gap is:

1. Every screen is still single-column at desktop. Two-column pairings (stats+chart,
   exercise+feedback, editor+rubric) from the Pass-1.5 plan are not wired.
2. The `.split` side-panel primitive (`css/components/side-panel.css`) is gated behind
   `body[data-ff-side-panel="1"]`. No screen consumes it.

## Per-screen state

| Screen | Container selector | File:line | Width (desktop) | Columns | Uses the laptop? |
|---|---|---|---|---|---|
| Dashboard | `.dashboard-inner` | style.css:1760 | 1080 px | 1 | Yes, but tall — heatmap / chart / recent stack vertically; laptop viewport scrolls a lot. |
| Learning path | `.learning-path-inner` (via shared `.exercise-inner`) | style.css:3281 | 1080 px | 1 | Single column; topic tree + detail stack. |
| Vocab exercise | `.exercise-inner` | style.css:533 | 1080 px | 1 | Exercise + feedback stack; no side rail. |
| Grammar exercise | `.exercise-inner` (shared) | style.css:533 | 1080 px | 1 | Same as vocab. |
| Reading exercise | `.reading-inner` | style.css:1635 | 1080 px | 1 | Text + question + feedback vertical. |
| Writing exercise | `.writing-inner` | style.css:1354 | 1080 px | 1 | Editor + char counter inline; rubric not on-screen. |
| Exam screen | `.exam-inner` | style.css:2205 | 1080 px | 1 | Text + questions vertical per FINDINGS. |
| Mode pages (vocab/grammar/reading/writing) | `.mode-page` | style.css:2280 | 1080 px | 1 | OK — mode pages are menu-like. |
| Settings | `.exercise-inner` reuse | style.css:533 | 1080 px | 1 | OK — settings are a list. |
| Onboarding | `.onboarding-inner` | style.css:2500 | see rule | 1 | Wizard, single-column is correct. |
| Auth | `.auth-inner` | style.css:1692 | narrow (form) | 1 | Correct (form-page). |

Mobile behaviour at 390×844: every rule falls back to `max-width: 100%` under the Gate D
`@media (max-width: 768px)` overrides — mobile experience remains whatever Step 2 shipped
and is unchanged by this pass.

## Side-panel pilot status

- Primitive: `.split` / `.split__main` / `.split__aside` — defined, hidden behind
  `body[data-ff-side-panel="1"]` (css/components/side-panel.css:16).
- Kicks in at `@media (min-width: 1200px)` with `grid-template-columns: minmax(0, 1fr) 380px`.
- No screen wires an aside today; flag was shipped as infrastructure and never consumed.

## What this pass does

1. **Drop the feature flag.** `.split` becomes a live layout primitive. Single-column on
   phone, two-column rail on desktop. Screens adopt it incrementally.
2. **Dashboard pairing.** Pair heatmap + chart, and recommendations + recent activity, on
   desktop via `.dash-grid-row` wrappers. Two new minimal HTML wrappers; no section
   content changes.
3. **Out of scope for this pass.** Exercise / writing side-rail wiring — that's a JS change
   in `exerciseRenderer.js` and `writing.js` that belongs to a screen-by-screen pass, not
   to a CSS-only layout correction. Documented under "Deferred" in POSTSHIP.md.

## What this pass does not do

- No screenshots at 1440×900 or 390×844 (Playwright unavailable).
- No re-baselining of `exercises/baselines/` visual regression snapshots.
- No deploy to production. marcel verifies locally.
