# ERRONEOUS — Error-Correction Exercise Sub-type

Design specification for the `correction` sub-type within the grammar exercise system.
Exam target: YO-koe lyhyt oppimäärä, 28.9.2026.

---

## 1. Current state

### What exists

The "correction" sub-type **already appears in the AI prompt** sent by `routes/exercises.js`
(`POST /api/grammar-drill`, line 409):

```
TYPE "correction": Show a sentence WITH an error. Student must identify the corrected version.
  instruction: "Mikä on oikea muoto? Lauseessa on virhe."
```

This generates AI-driven, multiple-choice correction items dynamically. They are served as part
of the `grammar-drill` response; the AI picks A/B/C/D and the client grades advisory-only.

### What is missing

| Thing | Status |
|---|---|
| `correction` grader in `lib/grading/dispatcher.js` | **Missing.** Only `monivalinta`, `aukkotehtava`, `yhdistaminen` are registered (lines 27–31). |
| `data/seeds/grammar.json` | **Does not exist.** Seed files are: `aukkotehtava.json`, `matching.json`, `translation.json`, `sentence-construction.json`, `reading-passages.json`, `writing-prompts.json`, `index.json`. No grammar or correction seed. |
| Dedicated `/api/correction` endpoint | **Missing.** Grammar corrections are embedded inside `/api/grammar-drill` as one of four AI-generated types, not served from a curated seed bank. |
| Server-authoritative grader for free-text correction | **Missing.** The current `correction` type in grammar-drill is multiple-choice, graded client-side (advisory). A free-text "type the corrected sentence" variant has no grader. |

### Relevant file:line references

- `lib/grading/dispatcher.js:27–31` — grader registry (no correction entry)
- `routes/exercises.js:409–414` — AI prompt definition of "correction" MC type
- `lib/grading/aukkotehtava.js:1–91` — grader pattern to replicate
- `lib/seedBank.js:24–31` — seed bank loader (no grammar/correction collection)
- `lib/seedBank.js:34–49` — boot-time minimums guard

---

## 2. Exercise schema

Refined schema for a seed-bank correction item. The `errors` array supports multi-error items
(B2 level); single-error items (A2/B1) always have exactly one entry.

```json
{
  "id": "corr_ser_estar_001",
  "type": "grammar",
  "subtype": "correction",
  "topic": "ser_estar",
  "error_category": "ser_estar",
  "cefr": "B1",
  "erroneous_sentence": "Mi hermana es en casa ahora.",
  "errors": [
    {
      "position": "es",
      "token_index": 2,
      "error_type": "ser_estar",
      "correction": "está"
    }
  ],
  "correct_sentence": "Mi hermana está en casa ahora.",
  "alt_corrections": ["Mi hermana está en casa ahora mismo."],
  "explanation_fi": "Sijainti ilmaistaan aina estar-verbillä: está en casa. 'Es' on väärin, koska se = pysyvä ominaisuus.",
  "hint_fi": "Mikä verbi ilmaisee sijaintia?"
}
```

### Field notes

| Field | Notes |
|---|---|
| `id` | Pattern: `corr_{error_category}_{topic}_{NN}` using zero-padded three-digit counter. |
| `type` | Always `"grammar"` — aligns with the existing dispatcher key space. |
| `subtype` | `"correction"` — distinguishes from gap-fill within the grammar type. |
| `topic` | One of the six grammar topics: `ser_estar`, `hay_estar`, `preterite_imperfect`, `subjunctive`, `conditional`, `pronouns`. |
| `error_category` | One of the eight error categories defined in §3. May differ from `topic` when a sentence tests cross-cutting rules (e.g. topic=`pronouns`, error_category=`word_order`). |
| `token_index` | Zero-based index of the erroneous token within the erroneous sentence (split on spaces). Used for partial-credit comparison. |
| `errors` | A2/B1: exactly 1 entry. B2: 1–2 entries. Never more than 2 in this seed bank. |
| `correct_sentence` | The canonical correct form. Grader compares student input to this first. |
| `alt_corrections` | Valid alternative corrections (different but equally correct rewrites). May be empty. |
| `explanation_fi` | Shown after submission. States the rule. ≤160 chars, 1–2 sentences. |
| `hint_fi` | Optional pre-submission hint for scaffold mode. ≤80 chars. May be empty string. |

---

## 3. Error taxonomy

Eight categories covering the full YO-koe lyhyt oppimäärä grammar scope.

---

### 3.1 `ser_estar` — Copula confusion

**Description:** Student uses `ser` where `estar` is required (or vice versa). The most common
single error in Finnish learners' Spanish, because Finnish has no equivalent distinction.

**CEFR:** A2 (location/state) → B1 (event venue, resultant state with participle)

**Topic mapping:** `ser_estar`, `hay_estar`

**Examples:**

| Erroneous | Correct |
|---|---|
| Mi hermana *es* en casa ahora. | Mi hermana **está** en casa ahora. |
| La tienda *está* cerrada los domingos. | La tienda **está** cerrada los domingos. *(correct — trap item)* |
| El concierto *está* en el Bernabéu. | El concierto **es** en el Bernabéu. |

> Note: the third example (event location) is B1-level; Finnish learners routinely choose `está`
> because "location" feels like `estar`.

---

### 3.2 `agreement` — Gender/number agreement

**Description:** Noun-adjective or determiner-noun agreement error. Either gender mismatch
(masculine adjective with feminine noun) or number mismatch (singular adjective with plural noun).

**CEFR:** A2 (basic adjective agreement) → B1 (agreement across intervening words)

**Topic mapping:** `pronouns`, `ser_estar` (predicative adjectives)

**Examples:**

| Erroneous | Correct |
|---|---|
| Mi hermana es muy *alto*. | Mi hermana es muy **alta**. |
| Los niños están *cansada*. | Los niños están **cansados**. |
| Tengo una problema *serio*. | Tengo un problema **serio**. *(also: "un" not "una")* |

---

### 3.3 `tense` — Wrong tense selection

**Description:** Student selects a morphologically correct form but in the wrong tense:
present used instead of future, preterite used instead of imperfect (or vice versa), present
perfect confusion with preterite.

**CEFR:** B1 (preterite vs. imperfect in clear contexts) → B2 (subtle aspect in narrative)

**Topic mapping:** `preterite_imperfect`, `conditional`

**Examples:**

| Erroneous | Correct |
|---|---|
| Cuando era niño, *jugué* al fútbol todos los días. | Cuando era niño, **jugaba** al fútbol todos los días. |
| Ayer *comía* en ese restaurante y me encantó. | Ayer **comí** en ese restaurante y me encantó. |
| Mañana *voy* a España si puedo. | Mañana **iré** a España si puedo. *(or: voy a ir)* |

---

### 3.4 `mood` — Indicative vs. subjunctive

**Description:** Student uses indicative where subjunctive is required (or vice versa). Most
common trigger constructions in the lyhyt oppimäärä scope: `ojalá`, `querer que`, `para que`,
`esperar que`, `es importante que`.

**CEFR:** B1 (ojalá + subjunctive; querer que + subjunctive) → B2 (subtle doubt/volition)

**Topic mapping:** `subjunctive`

**Examples:**

| Erroneous | Correct |
|---|---|
| Ojalá te *gustará* mi regalo. | Ojalá te **guste** mi regalo. |
| Quiero que tú *vienes* con nosotros. | Quiero que tú **vengas** con nosotros. |
| Es importante que los estudiantes *estudian* mucho. | Es importante que los estudiantes **estudien** mucho. |

---

### 3.5 `por_para` — Preposition confusion

**Description:** `por` / `para` swap. Both are translated into Finnish as "puolesta", "kautta",
"varten", "jotta" depending on context, making the distinction opaque.

**CEFR:** B1 (purpose vs. cause; duration vs. deadline) → B2 (idiomatic `por`)

**Topic mapping:** `ser_estar` (ser + para origin traps), general grammar

**Examples:**

| Erroneous | Correct |
|---|---|
| Estudio español *por* trabajar en España. | Estudio español **para** trabajar en España. |
| Te llamo *para* las seis. | Te llamo **por** las seis. *(approximate time → por)* |
| Este regalo es *por* ti. | Este regalo es **para** ti. *(recipient → para)* |

---

### 3.6 `word_order` — Adjective placement / clitic order

**Description:** Adjective placed before noun when it should follow (or vice versa for
prenominal adjectives that change meaning); object/reflexive clitic placed after conjugated
verb instead of before it (or attached wrongly in periphrastic constructions).

**CEFR:** B1 (clitic placement with modal + infinitive) → B2 (prenominal meaning shifts)

**Topic mapping:** `pronouns`, general grammar

**Examples:**

| Erroneous | Correct |
|---|---|
| Tengo que *comprarlo* ahora. | Tengo que comprarlo ahora. *(correct — alternate clitic trap)* |
| No *lo puedo* hacer hoy. | No lo puedo hacer hoy. *(or: No puedo hacerlo — both correct)* |
| Ella tiene un *grande* coche. | Ella tiene un coche **grande**. |

---

### 3.7 `missing_pronoun` — Reflexive or object pronoun omitted / wrong

**Description:** Student omits a required reflexive pronoun (`levantarse`, `llamarse`), uses
the wrong object pronoun (le/lo/la confusion), or uses a stressed pronoun where an unstressed
clitic is required.

**CEFR:** A2 (reflexives with daily routine) → B1 (indirect object pronoun; gustar-type verbs)

**Topic mapping:** `pronouns`, `ser_estar`

**Examples:**

| Erroneous | Correct |
|---|---|
| Yo *levanto* a las siete cada mañana. | Yo **me levanto** a las siete cada mañana. |
| A mi madre gusta el café. | A mi madre **le** gusta el café. |
| El libro que *busco lo* ayer no estaba. | El libro que **lo** busqué ayer no estaba. *(word order fix)* |

---

### 3.8 `aspect` — Preterite/imperfect aspect distinction

**Description:** Morphologically same-tense error as `tense` category but specifically about
**aspectual choice** in narrative: preterite for completed, bounded events vs. imperfect for
ongoing states, habits, and background description. Distinct from `tense` because both forms
are past-tense — the error is aspectual, not temporal.

**CEFR:** B1 (clear foreground/background contrast) → B2 (subtle narrative framing)

**Topic mapping:** `preterite_imperfect`

**Examples:**

| Erroneous | Correct |
|---|---|
| Mientras *hablé* por teléfono, alguien llamó a la puerta. | Mientras **hablaba** por teléfono, alguien llamó a la puerta. |
| Cuando *entraba* al café, vi a mi profesora. | Cuando **entré** al café, vi a mi profesora. |
| De niño, *fui* al parque todos los domingos. | De niño, **iba** al parque todos los domingos. |

---

## 4. Server-side grading algorithm

### Function signature

```js
// lib/grading/correction.js
export function gradeCorrection(payload = {}) {
  // Returns: { ok, correct, band, score, maxScore, correctSentence, explanation_fi }
  // or:      { ok: false, error: string }
}
```

### Algorithm (detailed pseudocode)

```
function gradeCorrection(payload):

  1. VALIDATE INPUT
     id = payload.id          // required string
     studentCorrection = payload.studentCorrection  // required string
     if id is empty  → return { ok: false, error: 'id is required' }
     if studentCorrection is empty → return { ok: false, error: 'studentCorrection is required' }

  2. LOAD ITEM
     item = getSeedItemById(id, 'correction')
     if !item → return { ok: false, error: `unknown exercise id: ${id}` }

     student  = studentCorrection.trim().toLowerCase()
     correct  = item.correct_sentence.trim().toLowerCase()
     alts     = (item.alt_corrections ?? []).map(s => s.trim().toLowerCase())

     reveal = {
       correctSentence: item.correct_sentence,
       explanation_fi:  item.explanation_fi ?? '',
     }

  3. BAND DETERMINATION

     // Band 1 — Täydellinen (exact, full sentence match)
     if student === correct OR alts.includes(student):
       return { ok: true, correct: true, band: 'taydellinen', score: 3, maxScore: 3, ...reveal }

     // Band 2 — Ymmärrettävä (diacritic-folded full sentence match)
     sf = foldDiacritics(student)
     cf = foldDiacritics(correct)
     if sf === cf OR alts.some(a => foldDiacritics(a) === sf):
       return { ok: true, correct: false, band: 'ymmarrettava', score: 2, maxScore: 3, ...reveal }

     // Band 3 — Lähellä (partial credit: right word corrected, wrong form)
     //
     // Partial credit logic for sentences (different from single-word aukkotehtava):
     //
     //   a) Extract the erroneous token(s) from item.errors[].position
     //   b) Extract the expected correction(s) from item.errors[].correction
     //   c) Split student sentence into tokens (split on whitespace)
     //   d) For each error in item.errors:
     //        - Find the token in student sentence at the same relative position
     //          (item.errors[].token_index)
     //        - Check whether the student replaced the erroneous token with
     //          SOMETHING (i.e. token ≠ item.errors[].position) even if not
     //          exactly correct
     //        - Check Levenshtein(student_token, correction) ≤ 2
     //   e) If ALL errors have a plausible correction attempt → band = 'lahella'
     //   f) Additionally: Levenshtein(student, correct) ≤ 3 (one word off)
     //      → band = 'lahella'

     errorsFixed = item.errors.every(err => {
       studentTokens = student.split(/\s+/)
       idx = err.token_index
       studentToken = studentTokens[idx] ?? ''
       // Student changed the erroneous word (any change counts as attempt)
       changed = (studentToken !== err.position.toLowerCase())
       // AND the change is close to the correct form
       closeEnough = levenshtein(studentToken, err.correction.toLowerCase()) <= 2
       return changed && closeEnough
     })

     wholeSentenceClose = levenshtein(student, correct) <= 3

     if errorsFixed OR wholeSentenceClose:
       return { ok: true, correct: false, band: 'lahella', score: 1, maxScore: 3, ...reveal }

  4. DEFAULT — Väärin
     return { ok: true, correct: false, band: 'vaarin', score: 0, maxScore: 3, ...reveal }
```

### Scoring summary

| Band | Condition | Score / 3 |
|---|---|---|
| `taydellinen` | Exact match (or diacritic-exact alt) | 3 |
| `ymmarrettava` | Diacritic-folded match | 2 |
| `lahella` | Right token corrected, close form OR whole sentence ≤ 3 edits off | 1 |
| `vaarin` | None of the above | 0 |

### Why sentence-level Levenshtein needs a higher threshold than aukkotehtava

`aukkotehtava` compares a single word (≤ 1 edit for `lahella`). A corrected sentence is 6–15
words; an off-by-one diacritic on a bystander word outside the error position should still
qualify as `lahella`. Threshold of 3 (whole sentence) handles: one forgotten accent + one
space normalisation without over-crediting genuinely wrong answers.

---

## 5. Seed bank target

100 items total. Distribution by error type and CEFR level:

| Error category | A2 | B1 | B2 | Total |
|---|---|---|---|---|
| `ser_estar` | 8 | 10 | 2 | **20** |
| `agreement` | 6 | 6 | 0 | **12** |
| `tense` | 0 | 10 | 5 | **15** |
| `mood` | 0 | 10 | 5 | **15** |
| `por_para` | 0 | 8 | 4 | **12** |
| `word_order` | 2 | 6 | 2 | **10** |
| `missing_pronoun` | 4 | 6 | 0 | **10** |
| `aspect` | 0 | 4 | 2 | **6** |
| **Total** | **20** | **60** | **20** | **100** |

### Rationale

- `ser_estar` gets the largest share (20) because it is explicitly listed as a YTL error pattern
  and overlaps with `hay_estar`, giving compound practice.
- `tense` and `mood` each at 15 — both are high-frequency YO-koe errors and map directly to
  three of the six grammar topics.
- `aspect` has the smallest share (6) because it requires a B1 baseline to even perceive;
  A2-level seed items would be too ambiguous.
- B2 items (20 total) serve advanced students who may be sitting the exam from a stronger base
  or who have completed the full learning path.

### ID convention

```
corr_{error_category}_{NNN}
e.g. corr_ser_estar_001 ... corr_ser_estar_020
     corr_mood_001      ... corr_mood_015
```

---

## 6. Integration

### 6.1 `lib/grading/dispatcher.js`

Register under key `"correction"` (not `"grammar"`), parallel to `aukkotehtava`:

```js
// lib/grading/dispatcher.js — add import
import { gradeCorrection } from './correction.js';

// extend graders object
export const graders = {
  monivalinta:  gradeMonivalinta,
  aukkotehtava: gradeAukkotehtava,
  yhdistaminen: gradeYhdistaminen,
  correction:   gradeCorrection,    // <-- new
};
```

The client submits `{ type: "correction", payload: { id, studentCorrection } }` to
`POST /api/grade/advisory` — no new route needed for grading.

### 6.2 `lib/seedBank.js`

Add a new collection key and boot-minimum guard:

```js
// seedBank.js — in the seedBank object
export const seedBank = {
  // ... existing ...
  correction: load('correction.json'),   // <-- new
};

// MINIMUMS
const MINIMUMS = {
  // ... existing ...
  correction: 80,   // warn if fewer than 80 items at boot
};
```

### 6.3 `routes/exercises.js`

Add a new seed-serving endpoint following the exact pattern of `/api/aukkotehtava`:

```js
// POST /api/correction
// Returns correction items. erroneous_sentence and hint_fi are sent;
// correct_sentence and explanation_fi are withheld (revealed by grader).
router.post("/correction", requireAuth, async (req, res) => {
  const { topic, cefr, count = 5 } = req.body;
  const clamp = Math.max(1, Math.min(20, Number(count) || 5));
  const items = pickFromSeed("correction", { topic, cefr, count: clamp });
  if (!items.length) return res.status(404).json({ error: "Ei sopivia korjaustehtäviä" });
  res.json({
    exercises: items.map(({ id, topic, cefr, error_category, erroneous_sentence, hint_fi }) =>
      ({ id, topic, cefr, error_category, erroneous_sentence, hint_fi })
    ),
    source: "seed",
  });
});
```

Note: `correct_sentence`, `errors[].correction`, and `explanation_fi` are NOT sent to the
client at exercise-serve time — only revealed via the grader response after submission.

### 6.4 Client-side renderer

**Recommended approach: new `renderCorrection()` function in the corrections screen,
reusing the grader response display from `aukkotehtava.js`.**

The interaction model differs slightly from aukkotehtava (which fills a blank in a static
sentence). For correction, the student needs to:

1. Read the erroneous sentence (displayed read-only).
2. Type a corrected version in a `<textarea>` (not a single `<input>`).
3. Submit → call `POST /api/grade/advisory` with `{ type: "correction", payload: { id, studentCorrection } }`.
4. Display band badge + `correctSentence` + `explanation_fi` (same reveal UI as aukkotehtava).

The textarea approach is appropriate because students may correct word order, add/remove words,
or change multiple tokens — a single-word input is too restrictive. The existing `aukkotehtava`
reveal component (band badge + explanation block) can be reused without modification; only the
input widget changes.

A separate renderer function is cleaner than patching `aukkotehtava.js` because the payload
field name differs (`studentCorrection` vs. `studentAnswer`) and the input is multi-word.

---

## 7. Difficulty calibration

### A2 — Single obvious error, high-frequency vocabulary

- Error involves only `ser_estar` copula choice, basic noun-adjective agreement, or a missing
  reflexive pronoun in a daily-routine sentence.
- Vocabulary is entirely within A2 MCER wordlist (family, home, school, daily routine).
- The erroneous token is the **only unusual element** — the rest of the sentence is correct
  and expected.
- `hint_fi` is always populated (gives a metalinguistic cue, e.g. "Mikä verbi ilmaisee sijaintia?").
- Example: *Mi hermana es en casa ahora.* → one error (`es` → `está`), location context, A2 vocab.

### B1 — Single subtle error, may require aspect or mood knowledge

- Error type can be any of the eight categories.
- The error is **plausible** — a form that exists in Spanish and sounds natural to a Finnish
  student who over-generalises one rule.
- Vocabulary may include B1-range words (opinions, descriptions, social situations).
- Context clue for the correct form is present in the sentence but requires grammatical inference
  (e.g. `siempre` signals imperfect; `ojalá` signals subjunctive).
- `hint_fi` may be empty at B1 to increase challenge.
- Example: *Ojalá te gustará mi regalo.* → `gustará` (future) → `guste` (present subjunctive);
  the trigger word `ojalá` is the cue.

### B2 — One or two errors, at least one requiring nuanced mood/register awareness

- May contain **two errors** (both entries in `item.errors`). The second error is only introduced
  at B2.
- Error types include `mood` with non-obvious triggers, `por_para` in idiomatic expressions,
  or `aspect` in a narrative paragraph fragment.
- No `hint_fi` (field is empty string).
- Vocabulary and sentence length approach real yo-koe reading-text register.
- Example: *Aunque no *tengo* tiempo, iré *por* conocer la ciudad.* → two errors:
  `tengo` → `tenga` (subjunctive after `aunque` with uncertainty reading), `por` → `para`
  (purpose). Both errors independently testable; requiring both correct for `taydellinen`.

### CEFR summary table

| Calibration axis | A2 | B1 | B2 |
|---|---|---|---|
| Number of errors | 1 | 1 | 1–2 |
| Error categories allowed | ser_estar, agreement, missing_pronoun | all 8 | all 8 |
| Vocabulary range | A2 wordlist | B1 range | B1–B2 range |
| `hint_fi` | always present | optional | absent |
| Context cue for correct form | explicit | present but requires inference | minimal or absent |
| Token index distractor | no (wrong token is unambiguous) | mild | possible second token |
