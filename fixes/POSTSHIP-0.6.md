# Pass 0.6 — POSTSHIP

## The bug

User report: *"minun nettisivuni pitäisi tietää minun tasoni eri kohdissa… tuo että voin valita tasoni tuolla alhaalla on aika huono."*

Vocab / grammar / reading mode pages each rendered a manual "TASO" picker (B/C/M/E/L, plus I/A on vocab). Clicking a button set `state.level` and overrode whatever the adaptive engine (`user_level_progress.current_level`) had already concluded from placement + recent sessions. A user placed at M in vocab still saw the default-active "B" button and either guessed or picked their target grade, either way drifting off-level.

## Root cause

Two independent sources of truth for level: (a) the adaptive engine writing `user_level_progress.current_level`, (b) a DOM element the user clicked. (b) silently won every session because the start-button handlers read `.dataset.level` from the picker.

## What shipped

- **`GET /api/user-level?mode=…&topic=…`** (new, `routes/progress.js`). Resolves to `user_level_progress.current_level` → `diagnostic_results.chosen_level || placement_level` → mode default (B vocab, C grammar/reading). `topic` is accepted but currently ignored because `user_mastery` tracks status, not CEFR level — the Pass 0.6 plan's "per-topic current_level" assumption didn't match the schema.
- **`app.html`**: 6 manual level-picker blocks deleted. Mode pages gain a hidden `.user-level-display` slot; legacy inline picker ids survive as empty hidden divs so orphan `querySelector` calls still resolve. VerbSprint `#verbsprint-duration-picker` untouched — that's data-duration, not data-level.
- **`js/main.js`**: 3 picker-click listener blocks removed (mode-page + legacy). Start-button handlers now `await fetchUserLevel(mode, topic)` instead of reading `.dataset.level` from the DOM.
- **`js/screens/dashboard.js`**: the picker active-class toggling on saved-settings restore was pointless once the pickers vanished; removed.

## Regression guard

`tests/no-manual-level-picker.test.js` (10 assertions):
- 6 for the endpoint's resolution order (level_progress wins → placement → default, plus 400 on unknown mode).
- 3 HTML-shape guards (the 3 mode-page pickers are gone, verbsprint duration picker survives, no `<button class="lvl-btn" data-level=…>` remains).

Full suite: 605 green.

## Flagged / deferred

- **Per-topic level** (the "minun tasoni eri kohdissa" from the user report) still isn't per-topic — it's per-mode. To make it per-topic (e.g. "C in ser_estar but B in subjunctive") we'd need a schema migration adding `current_level` to `user_mastery`. Marcel declined the migration today; this pass hits the broader complaint (stop asking me to pick a level) without it.
- **"Kokeile vaikeampaa →"** affordance for users who want a harder setting is deferred to a later pass (design-system side-panel material).
- **`app.js`** (legacy bundled file, not loaded by any HTML) still contains duplicate picker handlers. Not edited — it's dead code. Flagged for a cleanup pass.
