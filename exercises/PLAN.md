# Build plan — Step 2

Ordered, one-concern-per-commit. Each entry: title · scope · files · test · acceptance. Stop here for approval before Step 2 starts.

---

### 1. Unified exercise schema + migration map
- Define `ExerciseBase` + per-type `payload` discriminator (JSDoc in `js/types.js`).
- Write translation map for legacy monivalinta items (`options`/`correct` → `payload.monivalinta`).
- No behavior change; type-only introduction.
- **Files:** `js/types.js` (new), `lib/exerciseTypes.js` (new).
- **Test:** `tests/schema.test.js` — round-trip a legacy MC item through the translation map.
- **Accept:** existing vocab + grammar + adaptive tests still pass.

### 2. Client renderer dispatcher (extraction, no new types)
- New `js/screens/exerciseRenderer.js` with `renderExercise(ex, container, opts)`.
- Extract monivalinta branch from `vocab.js` / `grammar.js` / `reading.js` / `exam.js` / `fullExam.js` into `js/renderers/monivalinta.js`.
- Existing screens call dispatcher. Submit shape unchanged.
- **Files:** 1 new, 5 edited screens, 1 new renderer.
- **Test:** `tests/renderer-dispatcher.test.js` + Playwright smoke on each screen.
- **Accept:** all five existing screen e2e tests green; no visual diff > 1%.

### 3. Server grading dispatcher + retire client-side MC grading
- New `lib/grading/dispatcher.js` + `lib/grading/monivalinta.js` (server-side MC grader).
- `/api/grade` becomes a thin shim that calls dispatcher and returns `{correct, band, score, maxScore}`.
- `js/renderers/monivalinta.js` submits `{chosenOptionIndex}` instead of computing correctness.
- **Closes audit flag F1/F2 for monivalinta.**
- **Files:** `lib/grading/dispatcher.js`, `lib/grading/monivalinta.js`, `routes/exercises.js` (shim the handler), `js/renderers/monivalinta.js`.
- **Test:** supertest — client sends `correct: true` for a known-wrong answer, server responds `correct: false`.
- **Accept:** test passes; no existing tests regress.

### 4. Yhdistämistehtävä — matching (simplest new type first)
- New `js/renderers/yhdistaminen.js` — click-to-pair UI, all 4 sub-types (a-d) share it.
- New `lib/grading/yhdistaminen.js` — set-equality on pair IDs, server-authoritative.
- Schema extension under `payload.yhdistaminen = { leftItems, rightItems, correctPairs }`.
- Replaces dormant `/api/matching` server endpoint.
- **Files:** 2 new renderers, 1 grader, 1 composer case, `style.css` (matching skeleton + chips).
- **Test:** `tests/grading/yhdistaminen.test.js` (deterministic); Playwright e2e for sub-type (a); server-trust supertest.
- **Accept:** sub-type (a) playable end-to-end on mobile + desktop; pair-success state feels correct (`@starting-style` transition, 160 ms ease-out).

### 5. Aukkotehtävä — typed gap-fill
- New renderer + grader. Grader is deterministic with AI fallback.
- Grader order: exact → diacritic-fold → synonym list (from fixture) → Levenshtein ≤ 1 ("lähellä") → AI fallback.
- Finnish feedback banner per band.
- **Files:** `js/renderers/aukkotehtava.js`, `lib/grading/aukkotehtava.js`, `lib/grading/ai.js` (shared AI-grader infra), `lib/exerciseComposer.js` (adopt existing template).
- **Test:** `tests/grading/aukkotehtava.test.js` — matrix of 20 fixture inputs covering diacritic, misspelling, wrong-language, empty, prompt-injection cases.
- **Accept:** each deterministic path never calls AI; AI fallback called for only the two "ambiguous" fixtures.

### 6. Käännös FI→ES — mini-translation
- Wraps existing `/api/grade-translate` behind dispatcher.
- New renderer with textarea (char counter bar reused from writing).
- Updates prompt to request bands (täydellinen/ymmärrettävä/lähellä/väärin) instead of 0-3 raw.
- **Files:** `js/renderers/kaannos.js`, `lib/grading/kaannos.js`, update prompt in-place via dispatcher.
- **Test:** `tests/grading/kaannos.test.js` with OpenAI mock — same essay, 4 different bands.
- **Accept:** p50 grader latency ≤ 1 s in mock; UI shows correct band.

### 7. Lauseen muodostus — sentence construction
- Student sees Finnish prompt + 3-5 required Spanish word chips; writes 1-2 sentences.
- Grader checks: (a) each required word appears stem-tolerantly, (b) meaning matches, (c) grammar is sane.
- Single AI call, JSON schema coerced.
- **Files:** `js/renderers/lauseenMuodostus.js`, `lib/grading/lauseenMuodostus.js`.
- **Test:** grader unit tests for each of (a/b/c) failing independently; Playwright e2e for happy path.
- **Accept:** grader p95 ≤ 2.8 s in mock; UI highlights missing required words in red after submit.

### 8. Tekstinymmärrys — reading + open answers (most complex)
- 80-150-word Spanish passage + 2-4 Finnish open-answer questions.
- **Single grader call for all N answers** (F9 mitigation).
- New skeleton variant `reading-passage` in `js/ui/loading.js`.
- New renderer handles sequential reveal of questions.
- **Files:** `js/renderers/tekstinymmarrys.js`, `lib/grading/tekstinymmarrys.js`, `js/ui/loading.js` (skeleton variant), `style.css`.
- **Test:** grader unit test — 3-Q rubric with one correct / one partial / one wrong → band per answer.
- **Accept:** grader p95 ≤ 4 s; `/details` element does not push question off-screen on 390×844.

### 9. Adaptive-router wiring for new types
- Extend `TYPE_TOPIC_AFFINITY` in `lib/exerciseComposer.js` with all 5 new types per topic.
- Cold-start rule: first time a type is seen by a user, scaffold = max(1, current-scaffold) so they see a hint.
- Emit `exercise_submitted` telemetry from dispatcher.
- **Files:** `lib/exerciseComposer.js`, `lib/grading/dispatcher.js`, `js/telemetry.js` (new).
- **Test:** simulation — 50 rounds of `pickExerciseType` across topics; assert all 6 types appear with ≥5% frequency on their affinity topics.
- **Accept:** existing adaptive-router tests pass; new simulation passes.

### 10. SR integration per type
- Wire `srReview()` calls with per-type "card" key per SHARED §7 / FINDINGS §F7.
- Tekstinymmärrys does NOT write SR (deferred).
- **Files:** each renderer calls `srReview` on submit; `routes/sr.js` unchanged.
- **Test:** supertest for each type — submit wrong → SR row created with interval=1; submit right → interval follows SM-2.
- **Accept:** 4 new types (excl. reading) create correct SR rows.

### 11. Finnish UI copy + PostHog telemetry + string table
- Extract all inline Finnish strings from new renderers into `js/ui/strings.js`.
- Emit `exercise_submitted` + `exercise_fetch_failed` events per SHARED §6.
- **Files:** `js/ui/strings.js`, every renderer (small edit).
- **Test:** grep test — no Finnish-word regex matches in `js/renderers/*.js`.
- **Accept:** lint passes; PostHog dashboard receives events in staging.

### 12. Full e2e — 6-type mixed session
- Playwright: scripted student session that routes through all 6 types in one adaptive flow.
- Screenshots at 390×844 and 1440×900 for each of: idle, submitted, correct, lähellä, väärin.
- Server-trust regression — one test per type submits `correct:true` on wrong answer, server overrides.
- **Files:** `tests/e2e/mixed-session.spec.js` (new).
- **Accept:** session completes without a retry; all 6 server-trust assertions pass; screenshots visually approved.

---

## Out-of-scope flags

These are deliberately **not** in this plan; defer:
- Per-endpoint circuit breakers (F14).
- Mastery test grader rewrite (F10) — follows once dispatcher is stable.
- `ex.type` namespace consolidation (F5) — soft-migrated via translation map; hard rename is a separate pass.
- Reading → SR integration (F7, reading line).

## Risks / push-back invitations

- **Commit 3** touches the renderer submit shape. If the user wants monivalinta grading to remain client-side (e.g. to preserve offline play), this breaks. Flag early.
- **Commit 8** is the single heaviest item (L-ish effort). If we want a faster first release, ship commits 1-7 + 9-12 and defer 8 to a follow-up — all 4 other new types work without reading.
- **12 commits as listed is the minimum.** If commit 4 gets split (matching renderer / matching grader / matching composer case) it grows to ~15. Flagging.

---

**Target: 12-15 commits. Stop for approval.**
