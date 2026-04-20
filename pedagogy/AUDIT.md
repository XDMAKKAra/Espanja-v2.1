# Puheo — Pedagogical Audit
*Prepared 2026-04-20. Based on source at commit eb34451.*

---

## 1. Exercise selection

### How the next exercise is picked

The app has two parallel selection tracks:

**Track A — static seed bank (aukkotehtava / yhdistaminen / kaannos / lauseen_muodostus)**
`routes/exercises.js:312` — `pickFromSeed("aukkotehtava", { topic, cefr, count })` selects from the 1,440-item JSON bank. No per-user history drives the pick; items are chosen randomly from those matching the requested `topic`/`cefr` filter.

**Track B — AI-generated exercises (vocab, grammar-drill, reading-task, adaptive-exercise)**
Selection logic is in `routes/exercises.js:944-999` (`POST /adaptive-exercise`):

1. **Level (slow signal)** — `getUserLevel(userId)` from `lib/levelEngine.js:27` returns `user_level.current_level`, a persistent I→A→B→C→M→E→L value that only changes at checkpoints.
2. **Scaffold level (session signal)** — `getSessionState(userId, topic, level)` from `lib/scaffoldEngine.js:23` returns the current 0–3 scaffold, persisted in `user_session_state`. Initial scaffold is level-derived: I/A→3, B/C→2, M/E→1, L→0 (`lib/levelEngine.js:201`).
3. **Exercise type (variety signal)** — `pickExerciseType(topic, recentTypes)` from `lib/exerciseComposer.js:32`. Eligible types are filtered by `TYPE_TOPIC_AFFINITY` (line 15); if the same type appeared twice in a row it is excluded; 50% weight given to user preference if set; otherwise random from remainder.
4. The three signals are fed into `composePrompt()` (`lib/exerciseComposer.js:63`), which calls OpenAI.

**Exercise bank cache (vocab / grammar / reading)**
Before generating, `tryBankExercise()` (`routes/exercises.js:39`) queries `exercise_bank` filtered by `(mode, level, topic, language, quality_score > 0)` and excludes items the user has seen in the last 30 days (`seen_exercises` table). Up to 10 candidates are fetched; one is picked at random.

### Signals driving selection

| Signal | Where stored | Used for |
|---|---|---|
| Persistent level (I–L) | `user_level.current_level` | Difficulty calibration across all AI prompts |
| Session scaffold (0–3) | `user_session_state.scaffold_level` | Hint density within a single 30-min session |
| Exercise type history | Client sends `recentTypes[]` | Variety enforcement (no 3× same type in a row) |
| 30-day seen list | `seen_exercises` table | Avoids repeating bank items within a month |
| Past mistakes per topic | `user_mistakes` table | Used only in `/focus-session` and `/mastery-test/start` prompts |

There is **no per-item selection based on SM-2 intervals at the exercise-selection layer**. SR lives in a separate review queue, not in the primary exercise feed.

---

## 2. Wrong-answer handling

### What happens when a student gets an item wrong

**Scaffold engine** (`lib/scaffoldEngine.js:74-126`, called from `POST /adaptive-answer` at `routes/exercises.js:1004`):

```js
// scaffoldEngine.js:96-101
wrong_streak++;
correct_streak = 0;
if (wrong_streak >= 2 && scaffold_level < 3) {
  scaffold_level++;   // direction = "up" — more help on next exercise
  ...
}
```

Two consecutive wrong answers raise the scaffold level by 1 (up to max 3). On the next AI call the higher scaffold injects:
- level 1 → infinitive hint only
- level 2 → hint + 4 multiple-choice options
- level 3 → hint + options + Finnish translation

**Mistake logging** (`POST /api/mistake`, `routes/progress.js:199`): the client is expected to POST the question, wrong answer, correct answer, and topic tags to `user_mistakes`. These records are used in `/focus-session` (last 5 mistakes per topic, 14-day window: `routes/exercises.js:1144-1153`) and passively surface in `/weak-topics`.

**SR queue** (`js/features/spacedRepetition.js:110`): the legacy shim `srAddWrong(ex)` calls `srReview(ex, grade=0)`, which for logged-in users POSTs to `/api/sr/review`. For guests it pushes to a localStorage FIFO.

### Hint ladder

Yes — the scaffold system functions as a 4-step hint ladder (levels 3→2→1→0), but it only activates **after 2 consecutive wrong answers in the same session**. There is no single-item retry: the student moves on to the next AI-generated exercise at the raised scaffold level.

**No immediate re-presentation of the failed item.** The wrong item is logged and may appear in a future focus session or SR review, but it is not shown again in the same exercise sequence.

---

## 3. Spaced repetition

### Algorithm

SM-2, server-side for logged-in users. Implemented as an API call from `js/features/spacedRepetition.js`:

```js
// spacedRepetition.js:44-53  (logged-in path)
const res = await apiFetch(`${API}/api/sr/review`, {
  method: "POST",
  body: JSON.stringify({ word, question: ex.question, language, grade }),
});
```

Grades: 0 = Again, 1 = Hard, 3 = Good, 4 = Easy, 5 = Perfect (SM-2 scale).

The server-side SR route (`/api/sr/review`, `/api/sr/due`, `/api/sr/count`) is called but its implementation is not in the files audited — it is presumably a separate Express route not under `routes/`. The card fields returned by `/api/sr/due` include `ease_factor`, `interval_days`, `repetitions` (`spacedRepetition.js:76-81`), confirming the SM-2 schema is persisted in Supabase.

### Fields stored (inferred from `srGetDue` response shape)

| Field | SM-2 meaning |
|---|---|
| `ease_factor` | EF — controls interval growth rate |
| `interval_days` | Next review gap in days |
| `repetitions` | Number of successful reviews |

### Guest fallback

For unauthenticated users, `spacedRepetition.js:10-19` falls back to a `localStorage` FIFO (`puheo_sr_queue`, max 20 items). Wrong answers prepend; correct answers remove. This is not SM-2 — it is pure FIFO with no interval calculation.

### Integration with primary exercise flow

SR due cards are fetched separately via `srGetDue()` and mixed into the exercise feed by the client (app.js). SR is **not** the selection mechanism for regular exercises; it is an opt-in review queue. This means:

- Students who skip the SR queue get no spaced review of past errors from the primary flow.
- The SR queue is not exam-date-aware (no deadline-compression of intervals toward 28.9.2026).
- SR items come from the SR queue only; items that a student fails in the adaptive track are not automatically scheduled into the SR queue unless the client calls `srAddWrong(ex)` after each wrong answer — which relies on app.js doing so consistently.

---

## 4. Writing rubric

### Full AI grader prompt (verbatim from `lib/writingGrading.js:51-120`)

```
You are grading a Finnish high school student's Spanish writing for the yo-koe exam (lyhyt oppimäärä).

TASK:
${task.situation}
Instructions: ${task.prompt}
Requirements: ${(task.requirements || []).join(", ")}
Task type: ${isShort ? "Lyhyt kirjoitelma (max " + maxScore + "p)" : "Pitkä kirjoitelma (max " + maxScore + "p)"}

STUDENT'S TEXT (${charCount} chars without spaces, min required: ${task.charMin}):
"""
${studentText}
"""

${penalty > 0 ? `⚠️ UNDER MINIMUM LENGTH: ${charCount} chars, minimum is ${task.charMin}. Penalty: -${penalty} points (1 per 10 chars under minimum). Apply this AFTER scoring.` : ""}

GRADE using these EXACT YTL criteria:

1. SISÄLTÖ JA YMMÄRRETTÄVYYS (content & comprehensibility, max ${criteria.content}p):
   - Does the message come through clearly and naturally?
   - Are ALL task requirements addressed?
   - Is the register appropriate (tú/usted, formal/informal)?
   - Depth of treatment — goes beyond surface listing

2. KIELELLINEN LAAJUUS (vocabulary range, max ${criteria.vocabulary}p):
   - Vocabulary range and appropriateness
   - Use of connectors (además, sin embargo, por otro lado, aunque, por eso)
   - Varied sentence structures (not just SVO)
   - Idiomatic expressions and collocations

3. KIELELLINEN OIKEELLISUUS (grammatical accuracy, max ${criteria.grammar}p):
   - Grammar accuracy (ser/estar, hay/estar, subjunctive, tenses)
   - Spelling and accents (año, ñ, ú, é)
   - Agreement (gender, number)
   - Verb conjugation accuracy

ERRORS TO FIND (be thorough — list ALL errors):
- ser/estar confusion
- hay + definite article (hay las → hay)
- ojalá + indicative (should be subjunctive)
- Wrong conditional vs imperfect
- Missing relative pronouns
- Gender/number agreement
- Spelling and accent errors
- Register inconsistency

ALSO identify 2-4 POSITIVE HIGHLIGHTS: exact excerpts from the student's text that are particularly well-written (good vocabulary choice, correct subjunctive, nice connector, varied structure). These will be displayed with green highlights and a comment.
...
```

*(The prompt continues with instructions for `correctedText`, `errors[]`, `annotations[]`, and the JSON response schema — see `lib/writingGrading.js:96-120`.)*

### Scoring dimensions and scale

| Task type | Criterion | Max points |
|---|---|---|
| Short (`lyhyt kirjoitelma`) | Sisältö (content) | 15 |
| Short | Kielellinen laajuus (vocabulary range) | 10 |
| Short | Kielellinen oikeellisuus (grammar accuracy) | 10 |
| **Short total** | | **35** |
| Long (`pitkä kirjoitelma`) | Sisältö | 33 |
| Long | Kielellinen laajuus | 33 |
| Long | Kielellinen oikeellisuus | 33 |
| **Long total** | | **99** |

Source: `lib/writingGrading.js:3-11`.

Length penalty: −1 point per 10 characters below minimum (`lib/writingGrading.js:13-17`). No over-length penalty.

### YTL grade mapping

**Critical mismatch.** The writing grader uses its own `pointsToGrade()` function (`lib/writingGrading.js:33-42`) with these thresholds:

| Grade | Writing rubric threshold |
|---|---|
| L | ≥ 90 % |
| E | ≥ 77 % |
| M | ≥ 63 % |
| C | ≥ 49 % |
| B | ≥ 35 % |
| A | ≥ 20 % |
| I | < 20 % |

The authoritative YTL lyhyt oppimäärä thresholds (`lib/grading.js:10-18`, used for all non-writing exercises) are:

| Grade | Official YTL threshold |
|---|---|
| L | ≥ 80 % |
| E | ≥ 65 % |
| M | ≥ 50 % |
| C | ≥ 35 % |
| B | ≥ 20 % |
| A | ≥ 10 % |
| I | < 10 % |

The writing rubric is **not aligned with the official YTL bands**: L requires 90 % (vs 80 %), E requires 77 % (vs 65 %), and A starts at 20 % (vs 10 %). This means the writing grader systematically inflates difficulty and will under-report grades relative to the real exam.

The three criteria weights for the short task (content 15p / vocab 10p / grammar 10p) broadly match the YTL kirjoittaminen description, but the actual YTL rubric for lyhyt oppimäärä uses a single holistic 0–35 band table rather than three sub-scores. The dimension labels in Finnish (`sisältö ja ymmärrettävyys`, `kielellinen laajuus`, `kielellinen oikeellisuus`) match YTL terminology, so the structure is sound — only the grade cutoffs are wrong.

---

## 5. Progress / mastery

### "Mastered" determination

**Learning path mastery** (`lib/learningPath.js:159-220`):

A topic is marked `mastered` when a student scores ≥ 80 % (16/20) on a 20-question mastery test:

```js
// learningPath.js:13-14
export const MASTERY_THRESHOLD = 0.80;
export const MASTERY_TEST_SIZE = 20;
```

```js
// learningPath.js:164-166
const pct = total > 0 ? correct / total : 0;
const passed = pct >= MASTERY_THRESHOLD;
```

On passing, `user_mastery.status` is set to `"mastered"` and the next topic in `LEARNING_PATH` is unlocked (`learningPath.js:195-208`). Best score is retained across retries.

**Adaptive level mastery** (`lib/levelEngine.js:112-117`):

A checkpoint (level promotion) requires:
- 30-day rolling accuracy ≥ 70 % (`CHECKPOINT_THRESHOLD`)
- ≥ 15 sessions in the past 30 days (`MIN_SESSIONS_FOR_CHECKPOINT`)
- 7-day cooldown since last checkpoint

The checkpoint test itself (`POST /checkpoint/submit`) requires ≥ 80 % correct (`CHECKPOINT_PASS`, `lib/levelEngine.js:14`).

Demotion warning fires when rolling accuracy drops below 40 % (`LEVEL_DOWN_THRESHOLD`) with ≥ 10 sessions (`lib/levelEngine.js:121-125`).

There is also a separate `lib/adaptive.js` module with finer-grained `isPromotionReady()` / `isDemotionTriggered()` functions (requiring minAvgPct, minSessionPct, minQuestions, minSessions, minDays, maxStdDev). These are called from `routes/progress.js:73` when `POST /api/progress` is received, but the `lib/levelEngine.js` functions drive the checkpoint UI. The two systems operate in parallel and can produce inconsistent level change recommendations.

### "Needs review" surfacing

- **Weak-topics endpoint** (`GET /api/weak-topics`, `routes/progress.js:240`): aggregates `user_mistakes` for the past 7 days (configurable), groups by topic key, returns top 3 weak topics. This drives the focus-session entry point in the UI.
- **SR due count** (`srDueCount()`, `spacedRepetition.js:92`): displayed in the UI as a badge on the review queue. Cards are due when their `interval_days` has elapsed server-side.
- **Dashboard** (`GET /api/dashboard`, `routes/progress.js:112`): shows `modeStats[mode].avgPct` per mode, `estLevel`, streak, `modeDaysAgo`. No explicit "needs review" flag — the student must interpret their own stats.

There is **no automated prompt to the user to revisit a topic** once it has been introduced but not yet mastered (status = `"in_progress"`). The learning path shows locked/available/in_progress/mastered states, but in-progress topics with no recent activity generate no nudge.

---

## 6. Gap table

| Area | Gap | Cheapest credible fix |
|---|---|---|
| **Exercise selection** | Seed-bank items selected purely at random within topic/CEFR filter — no per-student history drives which items surface | Add `pickFromSeed` to check `seen_exercises` (same logic already used for AI bank items) — ~15 lines |
| **Exercise selection** | SR due cards and primary exercise feed are separate; wrong answers in the main flow are not automatically enqueued in SR unless `srAddWrong` is called client-side (consistency unverified) | Audit `app.js` wrong-answer handlers to confirm every path calls `srAddWrong`; add server-side enqueueing in `/api/grade/advisory` response |
| **Wrong-answer handling** | No immediate re-presentation of a failed item; student moves on without correcting the specific mistake | Add "try again" mode: after a wrong answer, show the same item again at scaffold+1 before advancing |
| **Wrong-answer handling** | Hint ladder only activates after 2 consecutive wrongs per session — a single wrong answer with a correct answer interleaved resets `wrong_streak` and never triggers extra help | Lower threshold to 1 wrong → scaffold up (or persist streak across items rather than requiring consecutive) |
| **Spaced repetition** | Guest fallback is a FIFO, not SM-2 — SR benefit is lost entirely for unauthenticated users | Not critical (guests should be pushed to sign up), but note it in onboarding |
| **Spaced repetition** | SR is not exam-date-aware — intervals can schedule review after 28.9.2026 | Add deadline-aware interval cap: `Math.min(calculatedInterval, daysUntilExam)` in the `/api/sr/review` handler |
| **Spaced repetition** | Two adaptive systems coexist (`lib/adaptive.js` and `lib/levelEngine.js`) with different thresholds and no reconciliation — the `POST /api/progress` adaptive path and the checkpoint UI path can disagree on level status | Choose one system as the single source of truth; deprecate or subordinate the other |
| **Writing rubric** | `pointsToGrade()` in `lib/writingGrading.js` uses wrong thresholds (L≥90%, E≥77%) instead of official YTL bands (L≥80%, E≥65%) — students will see inflated difficulty | Replace `writingGrading.js:33-42` thresholds with values from `lib/grading.js:GRADE_THRESHOLDS_PCT` — 5-line fix |
| **Writing rubric** | Short-task criterion weights (15/10/10 summing to 35) are app-internal, not drawn from an official YTL mark scheme; the real YTL awards a single holistic score | Align sub-score maxima with the official YTL kirjoittaminen instructions if/when published |
| **Progress / mastery** | `in_progress` topics with no recent activity generate no nudge | Add a daily-summary or dashboard widget: "Olet aloittanut mutta et ole suorittanut: [topic]" |
| **Progress / mastery** | `needs review` depends on user visiting `/api/weak-topics` — no push or in-session reminder | Fetch weak-topics on session start and inject one focus item into the next exercise batch |
