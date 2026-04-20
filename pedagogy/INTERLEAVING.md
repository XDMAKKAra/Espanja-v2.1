# Interleaving & Session Composition Design

**App:** Puheo — Spanish YO-koe (lyhyt oppimäärä)
**Exam date:** 28.9.2026

---

## 1. Current state

There is no session-level topic scheduler today. Topic selection is entirely caller-driven: the frontend sends a `topic` parameter directly to the relevant endpoint, and the server trusts it without any interleaving logic.

Concretely:

- **`POST /api/grammar-drill`** (`routes/exercises.js:378`) accepts `topic` from the request body, validates it against `VALID_GRAMMAR_TOPICS`, and generates exercises for that single topic. If `topic=mixed` the AI is instructed to cover at least 3 distinct rules, but the choice of which 3 is left entirely to the model.
- **`POST /api/generate`** (vocab, `routes/exercises.js:119`) accepts a single `topic` per call. No cross-topic mixing.
- **`POST /api/adaptive-exercise`** (`routes/exercises.js:944`) receives a `topic` string and passes it straight into `composePrompt`. The `pickExerciseType` helper in `lib/exerciseComposer.js:32` varies the *exercise format* (gap_fill, multichoice, …) within a topic but never switches topic.
- **`POST /api/mixed-review`** (`routes/exercises.js:1354`) does spread across mastered topics, but it delegates the distribution to the AI model with the instruction "distribute roughly equally" — there is no deterministic round-robin or weighted scheduler on the server.
- **`POST /api/focus-session`** (`routes/exercises.js:1130`) is strictly single-topic by design.

**Summary:** today every session is one topic per call. There is no interleaving engine. The `lib/exerciseComposer.js` file exists but contains only exercise-format selection, not topic selection. `lib/adaptiveEngine.js` does not exist.

---

## 2. Why interleaving matters here

Blocked practice (drilling ser/estar for 30 items, then preterite/imperfect for 30 items) produces strong immediate-session performance but poor retention and transfer — learners develop recognition shortcuts tied to context rather than the underlying rule. Interleaved practice forces the retrieval cue to include topic identification, which is exactly what a yo-koe item requires: the student sees a gapped sentence with no label, must diagnose what grammar is being tested, then apply the rule.

For Spanish lyhyt oppimäärä the stakes are especially high on two interference pairs. Ser/estar and preterite/imperfect are the two points where Finnish learners most systematically apply the wrong form even after instruction, because Finnish has no copula distinction and no grammaticalised aspect distinction — the cognitive interference is structural, not accidental. Interleaving these with their "neighbours" (hay/estar, conditional) forces the discriminative comparison that makes the rule stick.

Research basis: Kornell & Bjork (2008) on inductive learning; Rohrer et al. (2015) showing interleaved maths practice outperforming blocked on delayed tests by ~40 percentage points; Goossens et al. (2014) specifically on second-language grammar interleaving.

---

## 3. Topic adjacency graph

Topics that are good interleaving partners — i.e., share enough surface form to cause productive interference, but test distinct rules. Presenting them in the same session forces discrimination.

Grammar topics (keys from `VALID_GRAMMAR_TOPICS` in `lib/openai.js:290`):

```
ser_estar         ↔  preterite_imperfect   [aspect judgment: ser/estar permanent vs. temporary mirrors preterite/imperfect completed vs. ongoing]
ser_estar         ↔  hay_estar             [locative confusion: ¿Hay/Está el banco? — existence vs. location of known referent]
ser_estar         ↔  conditional           [shared adjective+verb constructions: sería vs. estaría; La ciudad sería/estaría mejor]
preterite_imperfect ↔ conditional          [temporal framing: imperfect and conditional share -ía morphology — comía vs. comería]
preterite_imperfect ↔ subjunctive          [trigger overlap: no creo que + present-subj tests same aspectual awareness as pret/imp contrast]
subjunctive       ↔  conditional           [mood selection after si and querer que; ojalá+subj vs. gustaría+inf share wish semantics]
pronouns          ↔  ser_estar             [relative pronoun que + ser/estar predicate is a classic yo-koe sentence type]
pronouns          ↔  subjunctive           [para que + pronoun order; embedded clauses that require both relative pronoun and subjunctive]
hay_estar         ↔  pronouns              [hay una/el confusion trains article sensitivity needed for definite pronoun referents]
```

Vocab topics (keys from `VALID_VOCAB_TOPICS` in `lib/openai.js:273`) pair well with grammar topics that typically surface in that domain:

```
"health and body"        ↔  ser_estar             [estar enfermo, ser alto — health adjectives split across both copulas]
"travel and transport"   ↔  preterite_imperfect   [narrative travel anecdotes are the canonical preterite/imperfect context]
"work and economy"       ↔  conditional           [job interview register: me gustaría, podría, sería]
"society and politics"   ↔  subjunctive           [opinion/recommendation trigger: es importante que, no creo que + social topic]
"culture and arts"       ↔  pronouns              [relative clause descriptions: el libro que leí, el lugar donde vivía]
```

---

## 4. Per-session shape

Each "slot" has a type (review / new / easy-win / free) and a topic-selection rule. "SR-due" means the SR scheduler has flagged this item as due for review (see §5). "Weakest" means the topic with the lowest rolling accuracy in the last 30 days from `user_session_state` / `user_mastery`.

### Kevyt — 5 items

| Slot | Type | Topic-selection rule |
|------|------|----------------------|
| 1 | opener / review | Weakest-due topic (SR-due if any, else lowest rolling accuracy) |
| 2 | mixed review | Adjacency-neighbour of slot-1 topic (see §3) |
| 3 | mixed review | Different topic from slots 1–2; prefer SR-due |
| 4 | new | Current learning-path topic (first `available` or `in_progress` in `LEARNING_PATH`) |
| 5 | easy-win | Topic with highest rolling accuracy (confidence builder to close session) |

### Normaali — 15 items

| Slots | Type | Topic-selection rule |
|-------|------|----------------------|
| 1 | opener | Weakest-due topic |
| 2–6 | mixed review (5 items) | Round-robin across 3 topics: weakest-due, its adjacency neighbour, next SR-due topic |
| 7–9 | new (3 items) | Current learning-path topic (2 items) + adjacency neighbour (1 item) |
| 10–11 | easy-win (2 items) | Strongest topic (highest accuracy), exercise type = format user most recently succeeded on |
| 12–15 | free (4 items) | Weighted random from all unlocked topics (weight ∝ days since last seen, capped at 14 days) |

### Intensiivinen — 30 items

| Slots | Type | Topic-selection rule |
|-------|------|----------------------|
| 1 | opener | Most-overdue SR item's topic |
| 2–7 | SR review (6 items) | All items sorted by urgency (days overdue desc), interleaved by topic — no two same topic consecutively unless only one topic is due |
| 8–13 | mixed drill (6 items) | Round-robin across 4 topics: 2 grammar + 2 vocab that are adjacency-paired (see §3) |
| 14–18 | new (5 items) | Current learning-path topic (3 items) + 2 bridge items on the adjacency neighbour to prime transfer |
| 19–22 | challenge (4 items) | One level above current `scaffoldLevel` (drop hints); topic = weakest from the session so far |
| 23–26 | easy-win (4 items) | Strongest topic, full scaffold (maximum hints), exercise type = user's fastest correct-answer format |
| 27–30 | free (4 items) | Weighted random, same weight formula as Normaali free slots |

---

## 5. Interaction with SR scheduler

SR-due items always fill priority slots before any other topic selection logic runs. The algorithm:

```
1. Fetch all items from user_mastery / user_session_state where
   next_review_at <= now()   (SR due)
   ordered by (now() - next_review_at) DESC   → most overdue first

2. Group due items by topic_key.

3. Assign to priority slots using round-robin over topic groups:
   - Advance pointer through topic groups on each slot assignment
   - Reset pointer when all groups exhausted or all priority slots filled
   - This guarantees no two items with the same topic_key occupy consecutive slots
     unless there is only one overdue topic.

4. If fewer SR-due items than available priority slots:
   - Fill remaining priority slots with items from the topic adjacency graph
     (neighbours of the most-overdue topic) weighted by days-since-last-seen.

5. After all priority slots are filled, run the per-session shape logic (§4)
   for the remaining slots, excluding topics already saturated (≥3 items in session).
```

Saturation cap: no topic should appear more than 4 times in a Normaali session or 6 times in an Intensiivinen session, even if SR overdue items are concentrated on one topic. Excess SR-due items roll over to the next session.

---

## 6. Cold-start rule

Cold-start condition: **either** the user has completed fewer than 2 topics (i.e., `user_mastery` has fewer than 2 rows with `status='mastered'`) **or** the user has fewer than 40 mastered items total (`getMasteredTopics(userId)` from `lib/learningPath.js:226` returns fewer than 40 entries). The OR clause protects students who are progressing through smaller seed-bank topics (e.g. a topic with only 20 items can be "completed" with far fewer than 40 mastered items). Cold-start exits once **both** conditions are false: ≥2 completed topics AND ≥40 mastered items.

```js
// lib/sessionComposer.js — cold-start gate
const COLD_START_MIN_TOPICS  = 2;
const COLD_START_MIN_MASTERED = 40;

function isColdStart(masteredTopics, masteredItemCount) {
  return masteredTopics.length < COLD_START_MIN_TOPICS
      || masteredItemCount < COLD_START_MIN_MASTERED;
}
```

In cold-start the SR queue is too thin to drive session composition. Instead:

1. **Structured introduction sequence.** Walk the `LEARNING_PATH` array (`lib/learningPath.js:16`) in order. Each session covers the current `available` topic (per `getUserPath`) as its primary topic, with a single "peek" item from the next locked topic to seed future familiarity.

2. **Topic-affinity weights.** Use `TYPE_TOPIC_AFFINITY` from `lib/exerciseComposer.js:15` to select exercise formats with the highest affinity for the current topic — gap_fill and multichoice for grammar topics, multichoice and matching for vocab topics. This reduces cognitive load during first exposure.

3. **No interleaving for the first 2 sessions per topic.** Interleaving before a topic is even partially learned produces confusion rather than desirable difficulty. The switch to interleaved mode triggers once `best_pct >= 0.50` on a topic's mastery attempts (the `best_pct` field in `user_mastery`).

4. **Easy-win slot always present.** Even in cold-start, the last slot of every session is an item from a topic the student has already passed at ≥80%, to end on a success signal. If no such topic exists yet (very first session), the easy-win is a pre-seeded "present tense regular verbs" item from the seed bank (`lib/seedBank.js`).

---

## 7. Composer interface

The session composer should be implemented as `lib/sessionComposer.js` and expose a single async function. All routing endpoints that want a structured session (adaptive-exercise, mixed-review, any future "start session" endpoint) call this instead of generating topic/type ad-hoc.

```js
/**
 * Compose a full exercise session for a user.
 *
 * @param {Object}  params
 * @param {string}  params.userId        — Supabase user UUID
 * @param {string}  params.sessionLength — "kevyt" | "normaali" | "intensiivinen"
 * @param {string}  [params.mode]        — "grammar" | "vocab" | "mixed" (default: "mixed")
 * @param {string}  [params.language]    — default "spanish"
 * @param {string}  [params.forceTopic]  — override: pin all slots to one topic
 *                                         (used by focus-session endpoint)
 *
 * @returns {Promise<SessionPlan>}
 *
 * @typedef {Object} SessionPlan
 * @property {SlotDef[]} slots          — ordered slot definitions (not yet fetched exercises)
 * @property {string}    sessionId      — UUID for this session (for answer tracking)
 * @property {boolean}   coldStart      — true if cold-start logic was applied
 * @property {string[]}  topicSequence  — ordered list of topic keys as planned
 *
 * @typedef {Object} SlotDef
 * @property {number}  index            — 0-based position in session
 * @property {string}  slotType         — "opener"|"review"|"new"|"easy-win"|"challenge"|"free"
 * @property {string}  topic            — topic key (e.g. "ser_estar", "preterite_imperfect")
 * @property {string}  exerciseType     — format key (e.g. "gap_fill", "multichoice")
 * @property {number}  scaffoldLevel    — 0–3 from scaffoldEngine
 * @property {boolean} srDue            — true if this slot is filling an SR-due obligation
 * @property {string|null} bankHint     — suggested seed bank query params, or null → generate via AI
 */
export async function composeSession({ userId, sessionLength, mode = "mixed", language = "spanish", forceTopic = null }) { … }
```

Usage from a route:

```js
// routes/exercises.js — new "start-session" endpoint (future)
import { composeSession } from "../lib/sessionComposer.js";

router.post("/start-session", requireAuth, async (req, res) => {
  const { sessionLength = "normaali", mode = "mixed" } = req.body;
  const plan = await composeSession({
    userId: req.user.userId,
    sessionLength,
    mode,
    language: "spanish",
  });
  res.json({ plan });
});
```

The route then iterates `plan.slots` to fetch/generate each exercise lazily (on demand as the student advances) or eagerly in a single batch call, depending on whether the slot has a `bankHint` (seed bank fetch, ~0ms) or requires AI generation (~1.5s). Eager pre-fetching is recommended for Kevyt and Normaali; lazy fetch is safer for Intensiivinen to avoid a single 30-item AI call.

The `forceTopic` parameter preserves backward-compatibility with the existing `focus-session` endpoint, which already pins all exercises to one topic (`routes/exercises.js:1130`). Passing `forceTopic` bypasses all interleaving logic and forwards directly to the current single-topic generation path.
