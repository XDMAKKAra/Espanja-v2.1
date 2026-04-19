# Puheo training-loop engine — as of 2026-04-19

Read-only map of the current monivalinta pipeline so five new exercise types can plug in without surgery. Every claim below is cited to file:line. Do not edit these files during Step 1.

---

## 1. Exercise JSON schema (today)

No database-level schema. Shape is **prompt-driven** — OpenAI returns JSON that the client consumes directly. Validation is partial and per-endpoint.

### Monivalinta (vocab) — the one type the UI actually renders
Defined by the prompt at [routes/exercises.js:169-187](../routes/exercises.js#L169).

```jsonc
{
  "id": 1,                       // int, required
  "type": "context",             // "context" | "translate" | "gap" | "meaning"
  "question": "Maria ___ feliz hoy.",   // string, required
  "options": ["A) ser", "B) estar", "C) haber", "D) tener"],  // 4 strings, "X) text" format
  "correct": "B",                // letter, required
  "explanation": "Hetkellinen tila → estar.", // Finnish, required
  "context": "Emotion + hoy → temporary state."  // required for "context" type, ≥10 chars (validateVocabBatch)
}
```

Server-side filter: [routes/exercises.js:225-245](../routes/exercises.js#L225) — `validateVocabBatch` requires non-empty `context`, rejects duplicate Spanish headwords, regenerates once on reject.

### Monivalinta (grammar)
[routes/exercises.js:333-364](../routes/exercises.js#L333). Same MC shape, plus `rule` (e.g. `"ser/estar"`), `instruction` (Finnish), `sentence` instead of `question` in some prompt variants.

### Reading (exam, fullExam)
[js/screens/fullExam.js:260-276](../js/screens/fullExam.js#L260) dispatches on `q.type`:
- `"multiple_choice"` → `options[]`
- `"true_false"` → boolean
- `"short_answer"` → text input

### Partially-implemented, **not rendered** today
Prompts + endpoints exist but no client calls them. Listed here because Step 2 can adopt/replace these schemas:
- `gap_fill` [routes/exercises.js:573-620](../routes/exercises.js#L573) — `{ sentence, hint, correctAnswer, alternativeAnswers[], explanation }`
- `matching` [routes/exercises.js:624-670](../routes/exercises.js#L624) — `{ type: "matching", pairs: [{spanish, finnish}] }`
- `reorder` [routes/exercises.js:674-722](../routes/exercises.js#L674) — `{ scrambled[], correct[], finnishHint, explanation }`
- `translate_mini` [routes/exercises.js:726-775](../routes/exercises.js#L726) — `{ finnishSentence, acceptedTranslations[], grammarFocus, explanation }`

**Integration point for new types:** extend the shared base from `exercises/SHARED.md` (§1). Do NOT ship a new top-level field if a renamed existing field would work.

---

## 2. Serve path

### Generating endpoints (all POST)
| Route | File:line | Purpose |
|---|---|---|
| `/api/generate` | [routes/exercises.js:116-218](../routes/exercises.js#L116) | Vocab batch |
| `/api/grammar-drill` | [routes/exercises.js:281-397](../routes/exercises.js#L281) | Grammar batch |
| `/api/reading-task` | [routes/exercises.js:401-482](../routes/exercises.js#L401) | Reading passage + Qs |
| `/api/adaptive-exercise` | [routes/exercises.js:856-912](../routes/exercises.js#L856) | Adaptive next-item |
| `/api/checkpoint/start` | [routes/exercises.js:941-1020](../routes/exercises.js#L941) | 20-Q checkpoint |
| `/api/focus-session` | [routes/exercises.js:1042-1138](../routes/exercises.js#L1042) | Weak-topic focus |
| `/api/adaptive/mastery-test/start` | [routes/adaptive.js](../routes/adaptive.js) | Adaptive mastery gate (fixed last pass) |
| `/api/mastery-test/start` | [routes/exercises.js:1164-1239](../routes/exercises.js#L1164) | Learning-path mastery |
| `/api/mixed-review` | [routes/exercises.js:1266-1312](../routes/exercises.js#L1266) | Mixed-topics review |

### OpenAI wrapper + cache
[lib/openai.js:136-209](../lib/openai.js#L136) — `callOpenAI(prompt, maxTokens, opts)`.
- Cache key: SHA-256 of `prompt + "::" + maxTokens + "::" + model` [lib/openai.js:149](../lib/openai.js#L149).
- TTL: 30 min for graders (maxTokens < 1500), 24 h for generators (≥ 1500). [lib/openai.js:144-146](../lib/openai.js#L144).
- Circuit breaker: 5 consecutive failures → open 60 s.
- Backing store: in-memory (dev) / Supabase `ai_cache` table (prod).

### Exercise bank
Before every generation [routes/exercises.js:37-85](../routes/exercises.js#L37), `tryBankExercise()` has ~50% probability of reusing a bank row (excluding items seen by this user in the last 30 days).

**Integration point for new types:** every new generator endpoint should flow through `callOpenAI` so the cache + breaker apply. Bank reuse is optional per type.

---

## 3. Client render pipeline

No single `renderExercise()`. Each mode has its own renderer that sniffs the shape:

- Vocab / adaptive: [js/screens/vocab.js:66-85](../js/screens/vocab.js#L66) — `logMistake()` sniffs on `ex.options && ex.correct` (MC), `ex.correctAnswer` (gap-fill), `ex.acceptedTranslations` (translate-mini), `Array.isArray(ex.correct)` (reorder).
- Grammar: [js/screens/grammar.js:83](../js/screens/grammar.js#L83) — `const exType = ex.type || "gap"`.
- Reading: [js/screens/reading.js:83-96](../js/screens/reading.js#L83) — dispatches on `q.type`.
- Exam: [js/screens/exam.js:131](../js/screens/exam.js#L131) + [js/screens/fullExam.js:260-276](../js/screens/fullExam.js#L260).
- Adaptive shell: [js/screens/adaptive.js:176](../js/screens/adaptive.js#L176).

Grade/submit handler for MC calls `reportAdaptiveAnswer(topic, isCorrect)` → POST `/api/adaptive-answer` → updates scaffold level.

**Integration point for new types:** add a `js/screens/exerciseRenderer.js` that owns a single `renderExercise(ex, opts)` and dispatches on `ex.type`. Each existing screen calls into it rather than reimplementing the sniff chain. See `SHARED.md` §2.

### Skeleton/loading UX (reused across all new types)
[js/ui/loading.js:36-86](../js/ui/loading.js#L36):
- `showSkeleton(container, "exercise" | "writing-task")` — already handles shimmer bars + 4 option placeholders + "Ladataan tehtävää…".
- `showFetchError(container, { title, subtext, retryFn })` — renders "Yritä uudelleen" button.
- CSS classes: `.skeleton-exercise`, `.skeleton-bar`, `.skeleton-option`, `.skeleton-hint`, `.fetch-error`, `.fetch-error-retry`.

Matching, aukkotehtävä, käännös, lauseen muodostus **reuse `"exercise"`** skeleton unchanged. Tekstinymmärrys gets a new `"reading-task"` variant (already exists) — see DESIGN for that type.

---

## 4. Server grade path

| Endpoint | File:line | Trusts client? | Notes |
|---|---|---|---|
| `/api/grade` | [routes/exercises.js:265-277](../routes/exercises.js#L265) | **YES — `{correct,total}` from req.body, unchecked.** | Audit-flag carrier. |
| `/api/grade-writing` | [routes/writing.js:63-89](../routes/writing.js#L63) | No (AI-graded server-side) | Max 2500 out tokens. |
| `/api/grade-translate` | [routes/exercises.js:779-820](../routes/exercises.js#L779) | No (AI-graded server-side) | Max 500 out tokens. |

**Client-side grading (exploitable):**
- Vocab MC: extracts chosen letter, compares to `ex.correct` — client-only.
- Gap-fill, matching, reorder: same pattern — client-reports-correct.

**YTL mapping:** [lib/grading.js](../lib/grading.js) — `pointsToYoGrade(points, maxPoints)` is the single source. `GRADE_THRESHOLDS_PCT` — L ≥ 80, E ≥ 65, M ≥ 50, C ≥ 35, B ≥ 20, A ≥ 10, else I.

**Integration point for new types:** every new type's grading lives behind the server. See `SHARED.md` §2 for the unified `/api/grade` dispatcher design.

---

## 5. Adaptive router

[routes/adaptive.js](../routes/adaptive.js) — fixed in the last pass; now under `/api/adaptive/*`.

Input on answer: POST `/api/adaptive-answer` [routes/exercises.js:916-937](../routes/exercises.js#L916).
```jsonc
{ "topic": "ser_estar", "isCorrect": true }
```
Output:
```jsonc
{ "scaffoldLevel": 1, "scaffoldChanged": true, "direction": "up", "scaffold": "Näytä sääntövihje" }
```

Type picker: [lib/exerciseComposer.js:32-49](../lib/exerciseComposer.js#L32) — `pickExerciseType(topic, recentTypes, userPref)` uses `TYPE_TOPIC_AFFINITY` at [lines 15-24](../lib/exerciseComposer.js#L15):

```js
const TYPE_TOPIC_AFFINITY = {
  vocab: ["multichoice", "matching", "gap_fill", "translate_mini"],
  grammar: ["gap_fill", "multichoice", "reorder", "translate_mini"],
  ser_estar: ["gap_fill", "multichoice", "reorder"],
  subjunctive: ["gap_fill", "multichoice", "translate_mini"],
  preterite_imperfect: ["gap_fill", "multichoice", "reorder"],
  verbs: ["gap_fill", "reorder", "translate_mini"],
  writing: ["translate_mini"],
  reading: ["multichoice"],
};
```

**Integration point for new types:** extend `TYPE_TOPIC_AFFINITY`, add a `case` in the compose switch [lib/exerciseComposer.js:89-195](../lib/exerciseComposer.js#L89). Partial scaffolding for `matching`, `gap_fill`, `reorder`, `translate_mini` already lives there.

---

## 6. SR queue

Client: [js/features/spacedRepetition.js:27](../js/features/spacedRepetition.js#L27) — `srReview(ex, grade, language)` POSTs to `/api/sr/review`.

Server + SM-2: [routes/sr.js:9-77](../routes/sr.js#L9). Row shape (`sr_cards` table):
```
user_id · word · language · question? · ease_factor (2.5 init) · interval_days · repetitions · next_review · last_grade · updated_at
```

Grade scale: `0 Again · 1 Hard · 3 Good · 4 Easy · 5 Perfect`. Grade < 3 resets.

Guest fallback: `localStorage["puheo_sr_queue"]`, FIFO cap 20.

**Integration point for new types:** each type must decide *what to schedule* — the word, the gap, the sentence stem, the passage title. Spelled out per-type in each DESIGN.md §2.5.

---

## 7. Mastery scoring

Threshold: `MASTERY_THRESHOLD = 0.80` · size: 20Q ([lib/learningPath.js:13-14](../lib/learningPath.js#L13)).

Flow: generate 20Q at next level, no scaffold → client grades → POST `/api/mastery-test/submit` [routes/exercises.js:1241](../routes/exercises.js#L1241) with `{topicKey, correct, total}` → writes `learning_path_progress.status = "mastered"` on pass.

**Integration point for new types:** if a new type is offered in a mastery test, the client grader needs to handle it (today mastery only ships MC + gap-fill). The server trust-flaw applies here too — fix it in the unified grader.

---

## 8. Path level / XP

No "XP" column. Progression is driven by **rolling accuracy** and **questions-at-level**.

Tables:
- `user_level_progress` ([routes/progress.js:37](../routes/progress.js#L37)) — per-mode (`vocab`/`grammar`/`reading`): `current_level`, `questions_at_level`, `mastery_test_eligible_at`, `last_demotion_at`, `adaptive_enabled`.
- `user_level` ([lib/levelEngine.js:24](../lib/levelEngine.js#L24)) — `rolling_accuracy_30d`, `rolling_sessions_30d`.

7 levels: **I → A → B → C → M → E → L**.

Promotion: `computeEligibility()` in `lib/adaptive.js` — min questions / days / sessions / avg % / session-% / consistency (std dev ≤ 15). Demotion: < 45% avg over 8 recent sessions, ≥ 6 bad, after 14 days at level.

**Integration point for new types:** every exercise submission already updates `questions_at_level` via POST `/api/progress`. New types inherit this for free as long as they submit `{correct, total}` per answer.

---

## 9. Latency / cost baselines (ceiling for new types)

From the last training pass + observed prompt/maxToken pairs:

| Existing call | Prompt in | Max out | Typical out | Cost (gpt-4o-mini) |
|---|---|---|---|---|
| Vocab batch (6 Q) | ~500-700 | 2000 | ~1000 | $0.0008 |
| Grammar batch (6 Q) | ~500-800 | 2500 | ~1300 | $0.0012 |
| Writing grader | ~500-800 + essay | 2500 | ~300-400 | $0.0012 |
| Translate grader | ~300 | 500 | ~150 | $0.0002 |
| Checkpoint (20Q × 2 calls) | — | 1500 each | — | $0.004-0.008 |

**Ceiling rule for every new AI-graded type:** keep prompt ≤ 800 chars and `max_tokens ≤ 2500`. Flag anything that would exceed in the type's DESIGN.md §2.6.

---

## Integration-point summary (cheat sheet)

| Concern | Touch point |
|---|---|
| Schema | Extend base in `SHARED.md` §1; type-specific fields in each DESIGN §2.1. |
| Serve | Reuse `/api/adaptive-exercise` via composer switch; per-type endpoints avoided. |
| Compose prompt | Add `case` in [lib/exerciseComposer.js:89](../lib/exerciseComposer.js#L89) switch. |
| Type affinity | Extend [`TYPE_TOPIC_AFFINITY`](../lib/exerciseComposer.js#L15). |
| Render | New `js/screens/exerciseRenderer.js` dispatcher (SHARED §2). |
| Grade | Unified `/api/grade` dispatcher (SHARED §2). Server authoritative. Never trust client `correct`. |
| Skeleton | Reuse `js/ui/loading.js` helpers. |
| SR | Call `srReview(ex, grade, lang)` with a type-specific "card" per DESIGN §2.5. |
| Mastery | Include type in mastery pools only if client grader handles it. |
| Progress/XP | Submit `{correct, total}` per answer — inherited free. |
| Telemetry | `posthog.capture('exercise_submitted', {type, correct, partial, latency_ms})` — see SHARED §5. |
