# Pass 2.5 — Pedagogy Hardening · Commit Plan

*Generated 2026-04-20. Based on audit at commit eb34451.*

---

## Algorithm choice

**SM-2 lite with exam-anchored interval cap.**

The audit confirmed that SM-2 is already fully implemented server-side in `routes/sr.js` with `ease_factor`, `interval_days`, and `repetitions` persisted in the `sr_cards` Supabase table. FSRS's advantage — better stability estimation from early reviews — only materialises after many repetitions per card; at 18-month horizon and most cards seeing 4–8 reviews, SM-2 matches FSRS accuracy with zero added complexity and no need to migrate existing review history. The single critical addition vanilla SM-2 lacks is the **exam-date ceiling**: `interval = min(sm2_interval, days_until_exam - 1)`, ensuring no card is ever scheduled past 28.9.2026. The partial-credit quality mapping (`taydellinen→q=5`, `ymmarrettava→q=3`, `lahella→q=2`, `vaarin→q=0`) diverges from vanilla SM-2 at `lahella` deliberately — a full reset on "almost right" conjugations would thrash grammar items without advancing the learner.

---

## Commit sequence

### Gate A — Foundation (2 commits)

**A1 · Fix writing rubric thresholds** *(~5 lines, immediate correctness fix)*

Files: `lib/writingGrading.js:33-42`

Change: Replace `pointsToGrade()` percentage cutoffs (L≥90%, E≥77%, M≥63%, C≥49%, B≥35%, A≥20%) with official YTL values (L≥80%, E≥65%, M≥50%, C≥35%, B≥20%, A≥10%) from `lib/grading.js:GRADE_THRESHOLDS_PCT`. The writing grader and all other graders will now use consistent thresholds.

Test: `npm test` — existing grading tests; add one assertion that 26/35 (74%) maps to E not M.
Acceptance: `pointsToGrade(26, 35)` returns `"E"`.

---

**A2 · SR exam-date cap + partial-credit quality mapping + state column**

Files:
- `routes/sr.js` (or wherever `/api/sr/review` lives) — add `examCap(interval)` function and `deriveQuality(band)` mapping
- `supabase/migrations/024_sr_scheduler_v2.sql` — `ALTER TABLE sr_cards ADD COLUMN state text DEFAULT 'new'`, plus backfill query

Changes:
- `examCap(interval)`: `return Math.min(interval, Math.max(1, daysBetween(now(), new Date('2026-09-28')) - 1))`
- `deriveQuality(band)`: taydellinen→5, ymmarrettava→3, lahella→2, vaarin→0
- Grade path in `/api/grade/advisory`: when `band` is present in response, call `srReview(itemId, deriveQuality(band))` server-side so SR is updated even if client doesn't call it
- Migration backfills `state` from existing SM-2 fields (`repetitions=0 AND interval_days<=1` → `learning`; `interval_days>21` → `review`; `ease_factor>=2.5 AND repetitions>=4` → `mastered`)

Test: unit test for `examCap` — interval capped when exam <30 days away; uncapped when exam is 200 days away.
Acceptance: no card in `sr_cards` has a scheduled review past 2026-09-27 after migration.

---

### Gate B — Session Composition (3 commits)

**B1 · `lib/sessionComposer.js`**

Files: `lib/sessionComposer.js` (new)

Implements:
- `TOPIC_ADJACENCY` graph (9 grammar edges + 5 grammar-vocab edges from INTERLEAVING.md §3)
- `composeSession({ userId, sessionLength, mode, forceTopic? })` → `Promise<SlotDef[]>`
- Slot types: `review` (SR due), `new` (unseen seed item), `easy-win` (item user has scored taydellinen before)
- SR-due items sorted by urgency (days overdue), then topic round-robin to enforce spread
- Among non-due slots: adjacency-weighted topic fill from `TOPIC_ADJACENCY`
- Cold-start branch: if `getMasteredTopics(userId).length < 30`, walk `LEARNING_PATH` sequentially

Test: mock SR queue of 8 due items across 3 topics — assert no more than 3 consecutive same-topic items in a 15-item session.
Acceptance: `composeSession` returns slots that satisfy topic-spread invariant.

---

**B2 · Wire composer into routes + seed-bank deduplication**

Files:
- `routes/exercises.js` — replace single-topic selection in `/adaptive-exercise` and `/focus-session` with `composeSession()` output
- `routes/exercises.js:312` — extend `pickFromSeed` to exclude items in `seen_exercises` (same 30-day window already used for AI bank)
- `routes/progress.js` — on `POST /api/progress` session start, fetch top weak-topic and inject one focus slot into first batch

Test: integration test — call `/adaptive-exercise` 30 times for a user with 3 weak topics; verify all 3 topics appear within 30 calls.
Acceptance: no single topic exceeds 50% of slots in a 15-item session.

---

**B3 · Cold-start + stale-topic nudge**

Files:
- `lib/sessionComposer.js` — cold-start logic (walk LEARNING_PATH, threshold at 30 mastered items)
- `routes/progress.js:GET /api/dashboard` — add `staleTopics[]`: topics with `status="in_progress"` and no activity in 7 days
- Frontend: `js/screens/dashboard.js` (or equivalent) — surface stale-topic nudge widget

Test: user with 0 mastered items gets sessions following LEARNING_PATH order.
Acceptance: dashboard response includes `staleTopics` field; in_progress topics with >7d inactivity appear.

---

### Gate C — Hints + Erroneous Examples (3 commits)

**C1 · Hint ladder**

Files:
- `js/features/hintLadder.js` (new) — ladder state machine: `getHintStep(itemId)`, `advanceHint(itemId)`, `resetHint(itemId)`
- `js/renderers/aukkotehtava.js`, `kaannos.js`, `lauseenMuodostus.js`, `yhdistaminen.js` — add "Vihje" button that calls `advanceHint()`; auto-advance to Step 1 after 2nd wrong attempt
- `data/seeds/aukkotehtava.json` — add `hint_example_es` and `hint_example_fi` fields (parallel example sentence) — offline generation pass
- `supabase/migrations/025_hint_events.sql` — `CREATE TABLE hint_events (id, user_id, item_id, exercise_type, hint_step, attempt_number, created_at)`

Ladder definition per exercise type: see HINTS.md §2.
Finnish nudge copy: see HINTS.md §2 Step 1 strings — add all to `js/ui/strings.js`.

Test: simulate 2 wrong answers on aukkotehtava item — assert hint step advances to 1 automatically.
Acceptance: "Vihje" button visible in all 5 exercise renderers; ladder state resets between items.

---

**C2 · Correction seed bank + server-side grader**

Files:
- `data/seeds/correction.json` (new, 100 items) — distribute per ERRONEOUS.md §5 table
- `lib/grading/correction.js` (new) — `gradeCorrection({ id, studentCorrection })`: exact + diacritic-folded + Levenshtein ≤ 2 on corrected positions
- `lib/grading/dispatcher.js` — register `correction: gradeCorrection`
- `lib/seedBank.js` — add correction collection (boot-time minimum: ≥ 90 items)
- `routes/exercises.js` — `POST /api/correction`: serve one item, strip `correct_sentence` from response

Test: unit tests for `gradeCorrection` covering exact match, diacritic-folded match, partial (lahella), and wrong.
Acceptance: `gradeCorrection({ id: "corr_ser_estar_001", studentCorrection: "Mi hermana está en casa ahora." })` returns `{ band: "taydellinen", score: 3 }`.

---

**C3 · Correction renderer + session integration**

Files:
- `js/renderers/correction.js` (new) — textarea for corrected sentence, band reveal after submit; reuses `#translate-area` DOM
- `js/screens/exerciseRenderer.js` — register `correction: renderCorrection`
- `js/screens/vocab.js` — add `correction` to type labels + routing
- `lib/sessionComposer.js` — include correction items in grammar-topic slots (1 per 5 grammar slots)

Test: `node --check js/renderers/correction.js`
Acceptance: correction exercises appear in grammar sessions; band feedback displayed correctly.

---

### Gate D — Writing Rubric (3 commits)

**D1 · 4-dimension rubric prompt**

Files:
- `lib/writingGrading.js` — replace 3-dimension prompt with 4-dimension prompt from RUBRIC.md §4; update JSON output schema to include `viestinnallisyys`, `kielen_rakenteet`, `sanasto`, `kokonaisuus` (each 0–5); update `pointsToGrade()` to use 0–20 total with band mapping 16/13/10/7/4/2

Test: dry-run the new prompt against 3 of the 10 calibration samples from RUBRIC.md §6; assert output is valid JSON matching schema.
Acceptance: all 10 calibration samples land within ±1 sub-dimension point of expected scores (Marcel validates manually before merge).

---

**D2 · Surface per-dimension feedback in UI**

Files:
- `routes/writing.js` — update response to pass through `viestinnallisyys`, `kielen_rakenteet`, `sanasto`, `kokonaisuus` objects
- Frontend writing result screen — render 4 dimension cards with Finnish labels + score bars + `feedback_fi` text
- `js/ui/strings.js` — add dimension label keys: `dim.viestinnallisyys`, `dim.kielen_rakenteet`, `dim.sanasto`, `dim.kokonaisuus`

Test: render the writing result screen with mock data; assert 4 dimension cards appear.
Acceptance: Pro writing feedback shows 4 scored dimensions with Finnish explanatory text.

---

**D3 · Calibration test suite**

Files:
- `tests/writing-rubric.test.js` (new) — 10 sample essays from RUBRIC.md §6, each with expected band; test calls `buildGradingPrompt()` + live OpenAI (skipped in CI unless `RUN_CALIBRATION=1`)
- `pedagogy/RUBRIC.md` — add calibration results section once Marcel has validated

Test: `RUN_CALIBRATION=1 npm test -- writing-rubric` — all 10 samples within ±1 sub-dimension point.
Acceptance: calibration pass rate ≥ 9/10 before Gate D merges.

---

## Summary

| Gate | Commits | Key output |
|---|---|---|
| A | 2 | Writing grade bug fixed; SR exam-aware |
| B | 3 | `composeSession()` with interleaving + deduplication |
| C | 3 | Hint ladder in all renderers; 100-item correction seed bank |
| D | 3 | 4-dimension YTL rubric; calibrated and UI-surfaced |
| **Total** | **11** | |

Gates are ordered by risk/reward: A fixes a live correctness bug in 5 lines. B and C are additive. D is the most AI-dependent and needs Marcel's calibration sign-off before merge.
