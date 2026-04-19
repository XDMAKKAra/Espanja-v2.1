# Findings from mapping the engine

Stuff I found while writing ENGINE.md that affects Step 2. Ordered by severity (how much it'll bite).

---

## CRITICAL

### F1. Server trusts client `correct` on `/api/grade`
[routes/exercises.js:265-277](../routes/exercises.js#L265). The audit flag from last pass is still live. Any logged-in student can POST `{correct: 10, total: 10}` and get a perfect grade written to their progress row. Fix is non-negotiable in Step 2 — see SHARED.md §8.

### F2. Monivalinta is graded *entirely* client-side
[js/screens/vocab.js:66-85](../js/screens/vocab.js#L66) extracts the chosen letter and compares to `ex.correct` in the browser. There is no server recomputation. Implication: retiring `/api/grade` as a shim is not enough — the renderer itself has to be rewritten to submit the raw choice and trust the server reply. This is bigger than "add new types" and should be scoped into the Step 2 plan (it is, as commit #1).

---

## HIGH

### F3. Dormant partial implementations for 4 of 5 new types
Prompts + server endpoints exist today for `gap_fill` / `matching` / `reorder` / `translate_mini`:
- [routes/exercises.js:573-775](../routes/exercises.js#L573)
- Composer templates at [lib/exerciseComposer.js:89-195](../lib/exerciseComposer.js#L89)
- Type affinity entries at [lib/exerciseComposer.js:15-24](../lib/exerciseComposer.js#L15)

Save work: **adopt these prompt scaffolds rather than rewriting from scratch.** They're not perfect (see F6) but they're a ~40% head start.

What they're missing:
- Client renderers (none exist).
- Server grading (today they'd fall through `/api/grade` client-trust path).
- Finnish-instruction banners.
- Proper schema under the unified base from SHARED §1.

### F4. No single `renderExercise()`
Each screen sniffs shapes independently — `vocab.js`, `grammar.js`, `reading.js`, `exam.js`, `fullExam.js` all have their own dispatch. Adding five types without a central dispatcher means 5 × ~5 = 25 sniff branches. Step 2 commit #2 extracts a single `js/screens/exerciseRenderer.js`.

### F5. "Type" field is inconsistent
Today `ex.type` means different things in different files:
- Vocab: `"context" | "translate" | "gap" | "meaning"` (MC subtype label)
- Grammar: `"gap" | "correction" | "transform" | "pick_rule"`
- Reading: `"multiple_choice" | "true_false" | "short_answer"`
- Composer: `"multichoice" | "gap_fill" | "matching" | "reorder" | "translate_mini"`

Four namespaces overlapping on one field. Step 2 proposal: rename vocab/grammar subtypes to `subtype`, keep top-level `type` as the render-dispatch discriminator using the composer's namespace (`monivalinta`, `aukkotehtava`, etc.). Migration is lazy — old items without the rename keep working via a translation map.

---

## MEDIUM

### F6. Existing gap-fill prompt accepts a *list* of alternatives, not synonyms-by-rule
[routes/exercises.js:573-620](../routes/exercises.js#L573) — `alternativeAnswers[]` is hand-curated by the model per item. The new Aukkotehtävä design needs diacritic-folding and Levenshtein, which the existing scaffold doesn't cover. We extend rather than replace: server-side grader uses the existing `alternativeAnswers[]` **plus** generic rules.

### F7. SR schedules on `word` + `question` keys
[routes/sr.js:77](../routes/sr.js#L77). For types where the "learnable unit" isn't a single word (matching pairs, reading passages, sentence construction), we need a convention for what to write. Proposal per-type in each DESIGN §2.5:
- Aukkotehtävä → the gap word.
- Lauseen muodostus → each *required word* (so construction failures surface as vocab drills).
- Käännös → a hash of the Finnish stem (so user sees same stem reviewed).
- Tekstinymmärrys → **does not enter SR** (too coarse; schedule only on vocab it exposes, deferred).
- Yhdistäminen → each pair as a separate card keyed on the Spanish side.

### F8. No writing-grader `graderVersion` field
If we bump the aukkotehtävä grader prompt mid-cycle, cached grades from v1 and v2 collide on the SHA-256 key. Add `graderVersion` as a cache-key component from day one. `SHARED.md` §2 already specifies this.

### F9. Reading-comprehension cost scaling
A reading passage has 2-4 open questions in Finnish. If we grade each question in its own call, a single passage costs ~2s × N ≈ 8s p95 and ~$0.002-0.004. **Mitigation:** single grader call takes all N answers + rubric and returns an array. Brings cost back to ~1× writing-grader and p95 to ~4s. See tekstinymmarrys DESIGN §2.6.

---

## LOW

### F10. `lib/learningPath.js` mastery test grades client-side
[routes/exercises.js:1241](../routes/exercises.js#L1241) — `/api/mastery-test/submit` takes `{topicKey, correct, total}`. Same flaw as F1 in a new skin. Same fix applies when the dispatcher lands.

### F11. `ex.topics[]` vs `ex.topic` inconsistency
Adaptive mode uses `topics[]` (array), learning-path uses `topic` (single). The unified base makes `topic` required and `topics?` optional — documented in SHARED §1.

### F12. Skeleton CSS assumes `.skeleton-options` has 4 children
[js/ui/loading.js:41-46](../js/ui/loading.js#L41). Matching and aukkotehtävä don't have 4 options. Either parameterize (`showSkeleton(container, kind, { count })`) or add variants. Cheaper: add variants. Listed in SHARED §4.

### F13. No telemetry beyond `/api/progress`
No PostHog instrumentation on exercise submit today. Net-new for Step 2. Good news: clean slate = consistent naming from commit 1.

### F14. Circuit breaker shared across all AI calls
[lib/openai.js:138-204](../lib/openai.js#L138) is global. One flaky grader can open the breaker on generators too. Not blocking, but worth a dedicated breaker per endpoint family later — noted here and **explicitly out of scope for Step 2**.

### F15. Fixtures for grader unit tests
`tests/fixtures/openai/` already has `grammar.json` and `reading.json` (seen in `git status`). Reuse this pattern for per-type grader fixtures. Add `aukkotehtava.json`, `lauseen.json`, `kaannos.json`, `tekstinymmarrys.json`, `yhdistaminen.json` — each a bank of `{ input, expected_output }` pairs the grader unit tests mock `callOpenAI` to return.

---

## Summary for the three integration surprises (for the Step-1 reply)

1. **4 of 5 new types have dormant prompt + endpoint scaffolding already.** We don't start from zero.
2. **Retiring client-side grading is bigger than the audit flag suggests.** Monivalinta itself grades in the browser; new types and old must converge on one server dispatcher in the same pass.
3. **No central renderer.** Every screen re-sniffs shapes. We get a ~25-branch combinatorial mess unless Step 2 opens with a renderer-dispatcher extraction (commit #2).
