# Task 4 — Dead-code removal (mode pages + verbSprint)

**Date:** 2026-05-19
**Scope:** one PR, `auto/task4-dead-code-removal`

## Context

PR #86 cut the standalone vocab / grammar / verbsprint nav buttons from
the sidebar. The supporting HTML, hash routes, and `verbSprint.js`
module survived. They're unreachable through the UI but still in the
bundle, in the file tree, and in nav-routing maps.

`vocab.js` and `grammar.js` are NOT dead — `curriculum.js` calls
`loadNextBatch` and `loadGrammarDrill` to render lesson exercises, and
`lessonResults.js` dynamically imports them for the "try again" path.
Only the standalone-mode-page surface is dead.

## Removals

**app.html (339 lines):**
- `#screen-mode-vocab` mode page (74 lines)
- `#screen-mode-grammar` mode page (97 lines)
- `#screen-mode-verbsprint` mode page (86 lines)
- `#screen-verbsprint` drill UI (46 lines)
- `#screen-verbsprint-results` results screen (13 lines)
- `.paradigm-overlay` verb-paradigm modal (13 lines + spacing)

**js/main.js:**
- `lazyVerbSprint` lazy-screen loader
- `NAV_HASH.vocab` / `.grammar` / `.verbsprint` entries
- `navigateTo` branch for `verbsprint`
- `EXERCISE_TO_MODE_PAGE` entries for vocab + grammar
- `btn-start-vocab` click handler
- `btn-start-grammar` click handler
- `MODE_LEVEL_DEFAULTS`, `fetchUserLevel`, `showLevelForMode` (only fed
  the removed btn-start-vocab path)

**js/screens/verbSprint.js:** deleted.

## Retained

- `vocab.js` + `grammar.js` modules (curriculum + lessonResults still
  import).
- `import { initVocab, loadNextBatch, startReviewSession }` and
  `import { initGrammar, loadGrammarDrill }` in main.js — still
  initialized + passed to dashboard / onboarding / quickReview.
- `startGrammarDrill` function — `initQuickReview` still receives it
  as a dep for the kertaus drill launch.
- `screen-exercise` + `screen-grammar` target screens — these are
  where lessonRunner-driven curriculum exercises render.
- `btn-exit-exercise` / `btn-exit-gram` X-button handlers — they call
  `exitToSource(...)`, which already falls back to `screen-dashboard`
  when the mode-page target is absent. No behaviour change.
- `verbReference.js` — separate cleanup; brief targeted verbSprint
  only.

## Acceptance

- `node --check js/main.js` clean.
- `npm test` green — `tests/no-manual-level-picker.test.js` updated to
  expect `#verbsprint-duration-picker` to be ABSENT (was guarded as
  present pre-PR).
- `sw.js` bumped v192 → v193 + bundle rebuilt.
- Manual smoke (post-deploy): kurssipolku → kurssi → oppitunti
  (vocab-type) → screen-exercise renders + lesson exercises run —
  verifies curriculum path still hits `loadNextBatch`.
