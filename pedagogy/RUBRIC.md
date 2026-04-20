# Puheo Writing Rubric — YTL Lyhyt Oppimäärä Alignment

**Target exam:** Ylioppilastutkinto, Spanish lyhyt oppimäärä (short syllabus), 28.9.2026
**Target level:** B1 CEFR (realistically A2+/B1 for most candidates)
**Document purpose:** Replace the current content/vocabulary/grammar grader with a YTL-aligned 4-dimension rubric covering viestinnällisyys, kielen rakenteet, sanasto, kokonaisuus.

---

## 1. Current rubric audit

### 1a. Current AI grader prompt (verbatim from `lib/writingGrading.js` → `buildGradingPrompt`)

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

CRITICAL for "excerpt" fields: use the EXACT text from the student's writing, character-by-character. Do not paraphrase. Keep excerpts short (3-8 words usually) so they can be found and highlighted inline in the text.

CORRECTED TEXT: provide the student's text with ONLY actual errors fixed (grammar, agreement, conjugation, accents, wrong word). Preserve content, style, sentence count, and any deliberate choices. Do NOT rewrite for elegance. If the original is already correct Spanish, return the original UNCHANGED and "errors": [] (no invented mistakes).
LENGTH CAP: "correctedText" MUST NOT exceed ${Math.floor(charCount * 1.5)} characters — roughly 1.5× the student's input (${charCount} chars).
ERROR CAP: "errors" MUST NOT contain more than 10 entries. Pick the most impactful errors if you find more.

Return ONLY this JSON (no markdown):
{
  "criteria": {
    "content": { "score": <0-${criteria.content}>, "max": ${criteria.content}, "feedback": "<2-3 sentences in Finnish>" },
    "vocabulary": { "score": <0-${criteria.vocabulary}>, "max": ${criteria.vocabulary}, "feedback": "<2-3 sentences in Finnish>" },
    "grammar": { "score": <0-${criteria.grammar}>, "max": ${criteria.grammar}, "feedback": "<2-3 sentences in Finnish>" }
  },
  "correctedText": "<student's text with ONLY real errors fixed, OR the original verbatim if no errors>",
  "errors": [
    { "excerpt": "<EXACT text from student, 3-8 words>", "corrected": "<corrected version>", "category": "<grammar|vocabulary|spelling|register>", "explanation": "<brief Finnish explanation>" }
  ],
  "annotations": [
    { "excerpt": "<EXACT text from student, 3-8 words>", "comment": "<brief Finnish comment: why this is good>", "type": "positive" }
  ],
  "positives": ["<strength 1 in Finnish>", "<strength 2>"],
  "overallFeedback": "<2-3 sentences in Finnish — what to focus on to improve>"
}
```

### 1b. Dimensions currently scored

Three dimensions, with asymmetric scales that differ between short and long essays:

| Dimension                   | Short max | Long max |
|-----------------------------|-----------|----------|
| `content` (sisältö)         | 15        | 33       |
| `vocabulary` (laajuus)      | 10        | 33       |
| `grammar` (oikeellisuus)    | 10        | 33       |
| **Total**                   | **35**    | **99**   |

Grade mapping (from `pointsToGrade`): L≥90%, E≥77%, M≥63%, C≥49%, B≥35%, A≥20%, I<20%.

### 1c. Critical gaps vs. YTL lyhyt oppimäärä

1. **Missing the fourth YTL dimension.** YTL's writing assessment uses four axes: *viestinnällisyys, kielen rakenteet, sanasto, kokonaisuus*. The current rubric collapses `viestinnällisyys` and `kokonaisuus` into "content & comprehensibility" and has no explicit holistic / cohesion dimension. A student who ticks every bullet point with choppy isolated sentences currently gets the same "content" score as one who produces a smooth, well-connected text.

2. **Wrong max-point scale.** The app uses 35p (short) and 99p (long). YTL writing for lyhyt oppimäärä is reported on a 0–99 scale per task, but the *band thresholds given by the user* (L 80+, E 65+, M 50+, C 35+, B 20+, A 10+, I<10) only make sense on a 99/100 scale. The current 35p short scale distorts thresholds: 50% of 35p = 17.5p which the current code calls "C" via the 49% rule, but YTL's "M" is 50 points absolute, not 50%. The proportional-percentage mapping is not how YTL actually works — YTL uses **absolute point thresholds** on a fixed scale.

3. **Band thresholds are percentage-based, not absolute.** `pointsToGrade()` maps percentages (90/77/63/49/35/20). The user's spec gives absolute thresholds (80/65/50/35/20/10 out of 100). These disagree: e.g. 55/99 is 55.5% → "C" in current code, but 55 absolute points is clearly "M" in the real YTL scheme.

4. **Generic CEFR-ish descriptors instead of YTL language.** The prompt says "depth of treatment — goes beyond surface listing" — this is vague tutor-speak, not calibrated YTL language. YTL criteria talk specifically about *viesti välittyy*, *rakenteiden hallinta on epävarmaa / varmaa*, *sanasto on suppea / riittävä / monipuolinen*, *teksti on sidosteinen*. The current prompt does not anchor the model to YTL's exact descriptor vocabulary.

5. **Error-hunting skew.** The prompt front-loads "ERRORS TO FIND (be thorough — list ALL errors)" with a bulleted error catalogue. This pushes the model into a deficit-scoring mindset incompatible with YTL, where a B1 short-syllabus M-level essay *is expected to contain errors* that don't impede communication. Deficit framing pulls scores downward.

6. **No register / text-type weighting in viestinnällisyys.** Register is a sub-bullet of "content", not a named scored dimension. YTL weights register heavily under viestinnällisyys for short tasks (email to a neighbour vs. forum post have different register demands).

7. **No cohesion dimension.** Connectors are scored under "vocabulary range" — but cohesion (tekstin sidosteisuus, kappalejako) is a YTL `kokonaisuus` concern, not a vocabulary concern. Currently a text with rich vocabulary but zero cohesion can max out vocabulary.

8. **Short vs. long use different point caps but identical prose descriptors.** Nothing in the prompt tells the model that a 160-char short task has different expectations than a 450-char long task. The model will apply the same qualitative bar, causing short tasks to be systematically under-scored.

---

## 2. YTL lyhyt oppimäärä writing criteria (source of truth)

YTL's foreign-language writing assessment rests on four axes. Below is the calibration for lyhyt oppimäärä (B1 target, though the realistic ceiling for short-syllabus Spanish is B1 and the realistic floor is A2).

### 2.1 Viestinnällisyys — communicative effectiveness
*Does the text accomplish the communicative task?* Includes: task completion (all requirements addressed), clarity (does the message get through without the reader having to guess), register (tú/usted, formality level, greeting/closing appropriate to the text type), appropriateness of text-type conventions (email opens with *Hola/Estimado*, forum post doesn't).

### 2.2 Kielen rakenteet — grammatical structures
*Does the grammar serve the message?* Includes: accuracy of core B1 structures (present, pretérito indefinido, pretérito perfecto, imperfecto, ser/estar, gustar-type verbs, basic subjunctive in fixed expressions like *ojalá que*, *es importante que*), range of structures (not just present tense SVO), handling of agreement (gender, number), pronouns (me/te/le, direct vs. indirect object). At lyhyt-oppimäärä B1, errors are expected but should not systematically block meaning.

### 2.3 Sanasto — vocabulary
*Is the lexical choice precise and varied enough for the task?* Includes: range (does the student reach beyond *bueno/malo/cosa/hacer*), precision (right word for the situation: *pedir* vs. *preguntar*, *saber* vs. *conocer*, *llevar* vs. *traer*), idiomatic use (collocations: *tener ganas de*, *hace falta*, *dar un paseo*), avoidance of anglicisms / fennicisms, topic-appropriate vocabulary. At lyhyt level a student is not expected to be idiomatic throughout; using the right everyday word reliably is the bar.

### 2.4 Kokonaisuus — overall impression / cohesion
*Does the text hold together as a piece of writing?* Includes: cohesion (connectors, reference chains — *lo, eso, por esa razón*), paragraph structure where appropriate, logical flow, formatting conventions of the text type (email greeting + body + closing; forum post with a stance), meeting the length expectation (not just the character minimum but producing enough substance), overall reader impression.

### 2.5 What an "M" (50 pts) short-syllabus essay looks like
- All or almost all task requirements addressed.
- Message gets through on first reading; reader rarely has to re-parse.
- Register roughly appropriate (tú/usted not wildly wrong); greeting/closing present if the task demands it.
- Grammar: present-tense backbone correct; past tenses attempted with some errors; agreement errors present but not dominant; subjunctive attempts in fixed expressions partially correct.
- Vocabulary: everyday words used correctly; 1–2 topic-specific words; some repetition; occasional wrong word but meaning recoverable.
- Cohesion: 2–4 connectors used (*y, pero, porque, también, además*); the text reads as a text, not a list.
- Length: meets minimum.

---

## 3. New rubric design

### 3a. Scoring dimensions and scale

Four dimensions, each scored **0–5 integer**, identical scale for short and long tasks. Total 0–20.

Scoring dimensions:

- **Viestinnällisyys (V)**
- **Kielen rakenteet (R)**
- **Sanasto (S)**
- **Kokonaisuus (K)**

#### Viestinnällisyys (V)
- **0** — No communicative content; task ignored or text is unintelligible Spanish.
- **1** — One requirement partially met; reader must guess at meaning; register wrong (tú where usted required or vice versa).
- **2** — Some requirements met; message partially understandable but reader re-reads often; register inconsistent.
- **3** — Most requirements met; message clear with occasional ambiguity; register mostly appropriate. **This is the M anchor for viestinnällisyys.**
- **4** — All requirements met; message clear on first read; register appropriate throughout; text-type conventions respected (e.g. email greeting + closing).
- **5** — All requirements met with clear communicative intent; register nuanced (e.g. polite softeners); text-type conventions fully observed; reader understands effortlessly.

#### Kielen rakenteet (R)
- **0** — Grammar so broken that most sentences fail (no verbs, no agreement anywhere).
- **1** — Present tense partially works; past tenses absent or wholly incorrect; pervasive agreement errors; ser/estar essentially random.
- **2** — Present tense mostly correct; simple past attempted with many errors; agreement errors frequent; ser/estar 50/50; structures limited to SVO.
- **3** — Present and one past tense (usually pretérito perfecto or indefinido) mostly correct; agreement errors present but not dominant; ser/estar correct in common cases; some attempt at subordinate clauses. **M anchor.**
- **4** — Multiple tenses used with mostly correct forms; subjunctive attempted in fixed expressions (*ojalá que, espero que*); agreement largely correct; varied sentence structures.
- **5** — Range of B1 structures handled accurately; subjunctive used appropriately in *querer que / es importante que / ojalá*; conditional used for politeness; few errors and none that impede meaning.

#### Sanasto (S)
- **0** — Vocabulary absent or non-Spanish (English words filling gaps).
- **1** — Only the most basic words (*bueno, malo, cosa, hacer*); repeated; meaning often fails because wrong word chosen.
- **2** — Everyday vocabulary mostly correct; noticeable repetition; anglicisms or fennicisms when topic-specific words are needed.
- **3** — Everyday vocabulary used correctly; 1–2 topic-specific words attempted; some wrong-word errors (*saber/conocer, pedir/preguntar*) but meaning recoverable. **M anchor.**
- **4** — Topic-specific vocabulary mostly correct; some idiomatic collocations (*tener ganas de, hace falta*); little repetition; word-choice errors rare.
- **5** — Precise word choice throughout; idiomatic collocations used naturally; topic-specific vocabulary handled well; register-appropriate lexical choices.

#### Kokonaisuus (K)
- **0** — Not a connected text; fragments, bullet list, or copied task prompt.
- **1** — Sequence of disconnected sentences; no connectors; no opening/closing where required.
- **2** — Some connectors (*y, pero, porque*); opening or closing present but not both; flow interrupted.
- **3** — 2–4 connectors used; opening + closing both present for email/letter tasks; text reads as a text, minor flow issues. **M anchor.**
- **4** — Range of connectors (*además, sin embargo, por eso, aunque*); clear progression; paragraph break appropriate for long tasks; text-type format well observed.
- **5** — Cohesion devices varied and used correctly; clear logical progression with reference chains; formatting fully conforms to text-type conventions; reader impression of a polished short text for the level.

### 3b. Band mapping — 0–20 total to YTL band

YTL absolute thresholds are given on a 100-point scale (L 80, E 65, M 50, C 35, B 20, A 10). Linearly mapped to 20 points (i.e. divide by 5):

| YTL 100-scale | 0–20 equivalent | Band |
|---------------|-----------------|------|
| 80+           | **16+**         | L    |
| 65–79         | **13–15**       | E    |
| 50–64         | **10–12**       | M    |
| 35–49         | **7–9**         | C    |
| 20–34         | **4–6**         | B    |
| 10–19         | **2–3**         | A    |
| 0–9           | **0–1**         | I    |

**Justification.** The 80/65/50/35/20/10 thresholds correspond to percentages 80/65/50/35/20/10. On a 20-point scale those percentages are 16/13/10/7/4/2, which is what the table encodes. Rounding convention: use **floor** on the 20-scale (so 12.8 → M, not E) because YTL rounds against the candidate at boundaries. The M anchor (10/20) corresponds to "score 3 on every dimension", which in the descriptors above is the lyhyt-oppimäärä B1 target performance. This is load-bearing: if M shifts, the whole scale shifts.

**Sanity checks against the M anchor:**
- All-3 essay → 12/20 → M ✓ (a student who hits the "M anchor" descriptor on every dimension lands comfortably within the M band, not on the knife edge).
- All-2 essay → 8/20 → C (partial task completion, frequent errors — correctly C).
- Three 3s and one 2 → 11/20 → M ✓.
- Three 4s and one 3 → 15/20 → E ✓.

### 3c. Dimension descriptors table

| Score | Viestinnällisyys (V) | Kielen rakenteet (R) | Sanasto (S) | Kokonaisuus (K) |
|-------|----------------------|----------------------|-------------|-----------------|
| **5** | All requirements met with nuance; register fully appropriate including softeners and text-type conventions; reader understands effortlessly. | Range of B1 structures handled accurately; subjunctive in fixed expressions used correctly; conditional used for politeness; few errors and none block meaning. | Precise and varied word choice; idiomatic collocations used naturally; topic-specific vocabulary handled with confidence. | Varied connectors used correctly; clear logical progression with reference chains; text-type format fully observed; polished reader impression for B1. |
| **4** | All requirements met; message clear on first read; register appropriate throughout; greeting/closing present. | Multiple tenses mostly correct; subjunctive attempted in fixed expressions; agreement largely correct; varied sentence structures beyond SVO. | Topic-specific vocabulary mostly correct; some idiomatic collocations; little repetition; word-choice errors rare. | Range of connectors (*además, sin embargo, por eso, aunque*); clear progression; paragraph break if long task; format well observed. |
| **3 (M anchor)** | Most requirements met; message clear with occasional ambiguity; register mostly appropriate. | Present + one past tense mostly correct; agreement errors present but not dominant; ser/estar right in common cases; some subordination. | Everyday vocabulary correct; 1–2 topic-specific words attempted; wrong-word errors present but meaning recoverable. | 2–4 connectors used; opening + closing both present where required; text reads as a text despite minor flow issues. |
| **2** | Some requirements met; message partially understandable but reader re-reads; register inconsistent. | Present tense mostly correct; past tense attempted with many errors; frequent agreement errors; ser/estar about 50/50; mostly SVO. | Everyday vocabulary mostly correct with noticeable repetition; anglicisms or fennicisms fill topic-specific gaps. | Some connectors (*y, pero, porque*); either opening or closing missing; flow interrupted between sentences. |
| **1** | One requirement partially met; reader must guess at meaning; register clearly wrong (tú/usted mixed up). | Present tense partially works; past tenses absent or wholly wrong; pervasive agreement errors; ser/estar essentially random. | Only most basic words, repeated; meaning often fails because of wrong word choice. | Disconnected sentences with no connectors; no greeting/closing where required. |
| **0** | Task ignored or Spanish unintelligible. | Grammar so broken that most sentences fail (no verbs, random order). | Vocabulary absent or non-Spanish (English filler words). | Not a connected text (fragments, bullet list, or copied prompt). |

---

## 4. New AI grader prompt

Below is the complete replacement prompt. It assumes the caller still injects `task.situation`, `task.prompt`, `task.requirements`, `task.charMin`, and `studentText`. The short/long distinction is no longer a point-scale distinction (both use 0–20) — instead it is an **expectation** the prompt makes explicit. The under-length penalty is handled outside the prompt in `calculatePenalty` and applied to the 0–20 total.

```
You are a YTL (Finnish matriculation board) examiner grading a Spanish writing sample from a Finnish high school student taking the Spanish lyhyt oppimäärä (short syllabus) yo-koe. Target level is B1. Apply YTL lyhyt oppimäärä standards, NOT CEFR-generic or university standards.

TASK CONTEXT:
Situation: ${task.situation}
Instruction (in Spanish): ${task.prompt}
Requirements: ${(task.requirements || []).join(" | ")}
Task type: ${isShort ? "SHORT task (lyhyt kirjoitelma, 160–240 chars)" : "LONG task (pitkä kirjoitelma, 300–450 chars)"}
Min chars (no spaces): ${task.charMin}
Actual chars (no spaces): ${charCount}

STUDENT'S TEXT:
"""
${studentText}
"""

GRADING PHILOSOPHY — READ CAREFULLY:
- This is lyhyt oppimäärä, not pitkä. A B1 student with noticeable errors that do NOT block meaning can legitimately score M (50 / 100 in YTL terms, 10–12 / 20 here).
- Do NOT grade against a native-speaker ceiling. Do NOT grade against a pitkä-oppimäärä ceiling.
- Score the text that was written, not the text you wish had been written. Absence of advanced structures is not a fault at this level.
- Errors are expected. Penalise errors only to the extent that they (a) block meaning, (b) cluster so densely that the reader loses the thread, or (c) are on structures a B1 short-syllabus student is clearly expected to control (present tense, basic agreement, everyday word choice).

SCORE EACH OF FOUR YTL DIMENSIONS ON A 0–5 INTEGER SCALE:

1) VIESTINNÄLLISYYS (communicative effectiveness): task completion, clarity, register (tú/usted, formality), text-type conventions.
   - 3 = M anchor: most requirements met, message clear with occasional ambiguity, register mostly right.
   - 4 = all requirements met, clear first-read, register consistent, format respected.
   - 5 = nuanced communication, text-type conventions fully observed, effortless to read.
   - 2 = partial completion, reader re-reads, register inconsistent.
   - 1 = one requirement partly met, register wrong, reader must guess.
   - 0 = task ignored or text unintelligible.

2) KIELEN RAKENTEET (grammatical structures): accuracy AND range of B1 structures — present, pretérito indefinido/perfecto, imperfecto, ser/estar, gustar-type, basic subjunctive in fixed expressions, agreement, pronouns.
   - 3 = M anchor: present + one past tense mostly correct, agreement errors present but not dominant, ser/estar right in common cases, some subordination.
   - 4 = multiple tenses mostly correct, subjunctive attempted in fixed expressions, varied structures.
   - 5 = range of B1 structures accurate, few errors, none block meaning.
   - 2 = present mostly OK, past tense errors frequent, agreement shaky, mostly SVO.
   - 1 = only present tense partially works, pervasive agreement errors, ser/estar random.
   - 0 = grammar so broken most sentences fail.

3) SANASTO (vocabulary): range and precision of word choice appropriate to the topic and level.
   - 3 = M anchor: everyday vocabulary correct, 1–2 topic-specific words attempted, some wrong-word errors (saber/conocer, pedir/preguntar) but meaning recoverable.
   - 4 = topic-specific vocabulary mostly correct, some idiomatic collocations, little repetition.
   - 5 = precise word choice, idiomatic collocations used naturally, topic-specific vocabulary handled with confidence.
   - 2 = everyday vocabulary mostly correct, noticeable repetition, anglicisms/fennicisms when topic words are needed.
   - 1 = only basic words repeated, wrong-word errors cause meaning failure.
   - 0 = vocabulary absent or non-Spanish.

4) KOKONAISUUS (overall / cohesion): connectors, flow, text-type formatting (greeting+closing for email/letter, stance for forum post), paragraph structure for long tasks.
   - 3 = M anchor: 2–4 connectors used, opening + closing both present where required, text reads as a text with minor flow issues.
   - 4 = range of connectors (además, sin embargo, por eso, aunque), clear progression, format well observed.
   - 5 = varied connectors used correctly, reference chains, formatting fully conforms to text type.
   - 2 = some connectors (y, pero, porque), either greeting OR closing missing, flow interrupted.
   - 1 = disconnected sentences, no connectors, no greeting/closing where required.
   - 0 = not a connected text (fragments, bullet list, copied prompt).

Total = V + R + S + K (0–20).
Band mapping (apply strictly): 16+ L, 13–15 E, 10–12 M, 7–9 C, 4–6 B, 2–3 A, 0–1 I.

ALSO RETURN:
- `corrected_text`: the student's text with ONLY real errors fixed (grammar, agreement, conjugation, accents, wrong word). Preserve content, style, and sentence count. If the original is already correct Spanish, return it unchanged. Max length: ${Math.floor(charCount * 1.5)} characters.
- `errors`: up to 10 most impactful errors. Each: {excerpt (exact 3–8 words from student), corrected, category (grammar|vocabulary|spelling|register), explanation_fi (brief Finnish)}.
- `annotations`: 2–4 positive highlights. Each: {excerpt (exact from student), comment_fi, type:"positive"}.

OUTPUT: return ONLY this JSON, no markdown, no prose outside the JSON:

{
  "viestinnallisyys": { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "kielen_rakenteet": { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "sanasto":          { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "kokonaisuus":      { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "total": <0-20 integer>,
  "band": "<one of: L, E, M, C, B, A, I>",
  "overall_feedback_fi": "<2–3 Finnish sentences: what to focus on to improve, anchored to the weakest dimension>",
  "corrected_text": "<student's text with only real errors fixed>",
  "errors": [
    { "excerpt": "<exact 3–8 words>", "corrected": "<fix>", "category": "grammar|vocabulary|spelling|register", "explanation_fi": "<brief Finnish>" }
  ],
  "annotations": [
    { "excerpt": "<exact from student>", "comment_fi": "<why this is good>", "type": "positive" }
  ]
}

Self-check before emitting:
- total MUST equal the sum of the four dimension scores.
- band MUST follow the table above given total.
- Every `excerpt` MUST be a character-exact substring of the student's text.
- If the text is already correct Spanish, `errors` MUST be [] — do NOT invent errors.
```

---

## 5. Required JSON output schema

```json
{
  "viestinnallisyys": { "score": 0, "feedback_fi": "..." },
  "kielen_rakenteet": { "score": 0, "feedback_fi": "..." },
  "sanasto":          { "score": 0, "feedback_fi": "..." },
  "kokonaisuus":      { "score": 0, "feedback_fi": "..." },
  "total": 0,
  "band": "L|E|M|C|B|A|I",
  "overall_feedback_fi": "...",
  "corrected_text": "...",
  "errors": [
    { "excerpt": "...", "corrected": "...", "category": "grammar|vocabulary|spelling|register", "explanation_fi": "..." }
  ],
  "annotations": [
    { "excerpt": "...", "comment_fi": "...", "type": "positive" }
  ]
}
```

Constraints enforced server-side (mirror of existing `enforceGuardrails`):
- `errors` truncated to first 10 entries.
- `corrected_text` truncated to ≤ 1.5× `studentText.length`.
- `total` recomputed from the four scores on the server (don't trust the model's sum).
- `band` recomputed from server-side `total` via the 16/13/10/7/4/2 threshold table (don't trust the model's band).
- Under-length penalty: if `charCount < charMin`, subtract `ceil((charMin - charCount) / 40)` from `total` (rescaled: old rule was 1 pt per 10 chars under on a 99-scale, so on a 20-scale that's 1 pt per 40 chars under, approximately). Clamp to 0.

---

## 6. Calibration test — 10 sample essays

Each sample is short (3–5 sentences) and realistic for a Finnish B1 student preparing for the 2026 lyhyt oppimäärä exam. Task assumed for all: *"Kirjoita lyhyt sähköposti espanjalaiselle ystävällesi ja kerro, mitä teit viime viikonloppuna. Mainitse: mitä teit, kenen kanssa, ja miltä se tuntui."*

### Sample 1 — Top band (L)
**Text:**
> Hola María, ¿qué tal? El fin de semana pasado fui al campo con mi familia. Aunque hacía bastante frío, lo pasamos genial porque pudimos hacer una caminata larga y después cenamos en un restaurante pequeño del pueblo. La verdad es que hacía mucho tiempo que no me sentía tan relajada. Espero que tú también lo hayas pasado bien. ¡Un abrazo!

**Expected scores:** V=5, R=5, S=4, K=5. **Total 19/20. Band L.**
**Rationale:** All requirements met with nuance (softener *la verdad es que*). Varied tenses including subjunctive (*hayas pasado*), connector *aunque*, imperfecto + pretérito alternation. Register consistent, greeting + closing. Minor: vocabulary could be slightly more idiomatic, so S=4 not 5.

### Sample 2 — High E
**Text:**
> Hola Pedro, el sábado fui al cine con mis amigos. Vimos una película española muy interesante sobre una familia. Después comimos pizza en un restaurante cerca del cine. Lo pasé muy bien porque hacía mucho que no veía a mis amigos. Hasta pronto, Laura.

**Expected scores:** V=4, R=4, S=4, K=4. **Total 16/20. Band L** (just over threshold).
**Rationale:** This is the knife-edge case — everything is solidly "4" across the board. 16 = L minimum. If examiner intuition says this is E not L, the L threshold may need to be 17 instead of 16; this sample is the key calibration case. If the model scores this lower (say V=4 R=3 S=4 K=4 = 15) it correctly lands E.

### Sample 3 — Clean E
**Text:**
> ¡Hola Carlos! El fin de semana pasado visité a mis abuelos en el campo. Comimos juntos y hablamos mucho. También mi abuelo me enseñó fotos antiguas, que me gustaron mucho. Fue un fin de semana tranquilo pero bonito. Un abrazo, Emma.

**Expected scores:** V=4, R=4, S=3, K=4. **Total 15/20. Band E.**
**Rationale:** All requirements met, clear, good register, relative clause (*que me gustaron*). Vocabulary is correct but not especially rich — *tranquilo pero bonito* is everyday. No errors.

### Sample 4 — Clean M (the anchor)
**Text:**
> Hola Ana, el sábado fui al parque con mi hermana. Hacía buen tiempo y jugamos al fútbol. También comimos un helado porque teníamos mucho calor. Me gustó mucho porque no veo a mi hermana a menudo. Hasta luego, Sofía.

**Expected scores:** V=3, R=3, S=3, K=3. **Total 12/20. Band M.**
**Rationale:** The prototypical M essay. All requirements addressed, message clear, register right, two tenses used mostly correctly, 2–3 connectors (*y, porque, también*), greeting + closing. Everyday vocabulary, no topic-specific reach. This is the calibration anchor.

### Sample 5 — Weak M / strong C boundary
**Text:**
> Hola, el sábado fui al cine con mi amigo. La película era muy buena. Después fuimos a comer. Me gustó mucho. Adiós.

**Expected scores:** V=3, R=3, S=2, K=3. **Total 11/20. Band M** (just over).
**Rationale:** All requirements ticked (what / with whom / how it felt) but *muy buena* and *me gustó mucho* are bare-bones. No topic-specific vocabulary → S=2. Opening + closing present but minimal. Grammar clean → R=3.

### Sample 6 — Clear C
**Text:**
> Hola, en fin de semana yo ir al cine con mi amigo Juan. La pelicula es bueno. Despues nosotros comer pizza. Me gusta mucho pero yo estoy cansado. Adios.

**Expected scores:** V=2, R=1, S=2, K=2. **Total 7/20. Band C.**
**Rationale:** Requirements ticked but with errors (infinitives instead of conjugations: *yo ir, nosotros comer*). Present/past tense not handled. Agreement error *pelicula es bueno*. Missing accents. Message recoverable, so not B.

### Sample 7 — B / C boundary
**Text:**
> Hola Pedro. Sabado yo van cinema con amigo. Es bien. Comimos pizza. Me gusta. Adios.

**Expected scores:** V=2, R=1, S=1, K=2. **Total 6/20. Band B** (top).
**Rationale:** Task partly addressed but fragments (*es bien*, *me gusta* without context), agreement gone, English-origin *cinema*, missing accents. Greeting + closing present, a couple of connectors absent. This is a B that could be argued to C if the examiner is generous with viestinnällisyys.

### Sample 8 — Clear B
**Text:**
> Hola. Yo fue parque. Mi hermano. Comer helado. Es bueno. Adiós.

**Expected scores:** V=1, R=1, S=1, K=1. **Total 4/20. Band B** (minimum).
**Rationale:** Fragments, wrong verb forms (*yo fue*, infinitives), missing prepositions. Reader can guess at meaning but must work. Greeting/closing present so not 0 on kokonaisuus.

### Sample 9 — A
**Text:**
> Hola. Yo sabado cine. Amigo. Pizza. Bueno. Adios.

**Expected scores:** V=1, R=0, S=1, K=1. **Total 3/20. Band A.**
**Rationale:** Noun-string telegraphese, no verbs at all. Reader can half-guess the events. Not quite "I" because greeting + closing are present and some Spanish vocabulary is correctly chosen.

### Sample 10 — I (rejected)
**Text:**
> Hola. I went to cine with friend. It was good. Comida pizza. Gracias.

**Expected scores:** V=0, R=0, S=0, K=1. **Total 1/20. Band I.**
**Rationale:** Mostly English. Task effectively ignored in Spanish terms. Greeting barely earns K=1.

### Calibration acceptance criterion
Run the new prompt on all 10 samples. The rubric is calibrated if **every dimension score lands within ±1 of the expected value** and **the final band is correct on 9/10 samples** (allow one boundary disagreement on samples 2 or 5/7 which are intentionally on thresholds).

---

## 7. Diff vs. current rubric

| Aspect | Current (in `lib/writingGrading.js`) | New | Why it matters |
|---|---|---|---|
| Number of dimensions | 3 (content, vocabulary, grammar) | 4 (viestinnällisyys, kielen rakenteet, sanasto, kokonaisuus) | YTL's official 4 axes; separates task-completion from cohesion, so a bulletpoint-but-choppy essay and a connected-but-incomplete essay get different profiles. |
| Dimension scale | 0–15 / 0–10 / 0–10 for short, 0–33 each for long (asymmetric) | Four × 0–5 identical scales, total 0–20 | Consistent mental model for the grader; band mapping becomes clean integer thresholds (16/13/10/7/4/2); short and long use the same qualitative bar, differing only in what "task completion" requires. |
| Band threshold source | Percentages (90/77/63/49/35/20) | Absolute YTL thresholds (80/65/50/35/20/10) mapped linearly to 20-scale (16/13/10/7/4/2) | Matches the real YTL scheme. Current 63% → M means M starts at 22/35 ≈ 63% on short, but YTL's M is at absolute 50/100, which the current code does not honour. |
| M anchor definition | Implicit / none | Explicit: "score 3 on every dimension" with a prose descriptor per dimension | Gives the model a concrete calibration point. M is the most common real-world band and the most consequential to get right. |
| Short vs. long expectations | Same prompt text, different max points | Same 0–20 scale, but prompt explicitly names short vs. long and tells the model task-completion demands differ | Prevents systematic under-scoring of short tasks (the current behaviour, because short-task prompt has the same qualitative language as long-task prompt). |
| Deficit framing | "ERRORS TO FIND (be thorough — list ALL errors)" as a front-loaded instruction | "Errors are expected. Penalise only when they block meaning, cluster densely, or target structures a B1 student is clearly expected to control." | Current framing pulls scores down below the real YTL bar. At B1 short-syllabus, error presence is the norm. |
| Register | Sub-bullet under content | Named sub-dimension of viestinnällisyys with explicit 0–5 anchoring | Register is heavily weighted in real YTL grading for short tasks (email/message text types). |
| Cohesion | Mentioned under "vocabulary range" (connectors lumped with vocab) | Own dimension (kokonaisuus) covering connectors, flow, text-type formatting, paragraph structure | Matches YTL; stops a student being rewarded for rich vocabulary in a text with zero cohesion. |
| Language of descriptors | Generic tutor-speak ("depth of treatment — goes beyond surface listing") | YTL-anchored descriptors (*viesti välittyy*, *rakenteiden hallinta*, *sanasto on riittävä*, *sidosteinen*) | Aligns with how a YTL examiner actually thinks; improves consistency with human YTL grading. |
| Level calibration | None explicit; risks applying CEFR-B2 or even university bar | Explicit "B1 lyhyt oppimäärä, NOT pitkä, NOT CEFR-generic, NOT university" framing | Prevents the most common failure mode: gpt-4o-mini grading Finnish high-school Spanish as if it were a university essay. |
| Band computation trust | Model returns percentages / points; server computes grade via `pointsToGrade` | Model returns per-dimension scores; server recomputes total AND band server-side | Robust against model arithmetic errors and band-boundary drift. |
| Output schema | `criteria.content/vocabulary/grammar` | `viestinnallisyys/kielen_rakenteet/sanasto/kokonaisuus` (Finnish-named, matches UI language) | Finnish keys match the UI (frontend copy is Finnish). Avoids a Finnish↔English translation layer between grader and display. |
| Length penalty | 1pt per 10 chars under on a 99-scale (effectively huge on a short task) | 1pt per 40 chars under on a 20-scale (linearly rescaled so the penalty keeps the same real weight) | Keeps the penalty proportional to the new scale; otherwise a 30-char-short essay would lose 3/20 = 15% which is way too steep relative to YTL. |
| Corrected text + error list + annotations | Present | Preserved (carried over unchanged; key names updated) | No regression in the actionable-feedback features the student already sees. |

---

## Implementation checklist (for the engineer)

1. Rewrite `buildGradingPrompt` in `lib/writingGrading.js` with the Section 4 prompt.
2. Replace `SHORT_CRITERIA` / `LONG_CRITERIA` with a single 4×5 config (or inline constants).
3. Replace `pointsToGrade(points, maxScore)` with absolute table lookup on total (16/13/10/7/4/2).
4. Rewrite `sumScores` to sum the 4 new dimensions.
5. Update `calculatePenalty` to `ceil((charMin - charCount) / 40)` on the 20-scale.
6. Update `processGradingResult` to recompute total and band server-side (do not trust the model's `total` / `band`).
7. Update `enforceGuardrails` to read `corrected_text` / `errors` / `annotations` with the new key names.
8. Update frontend (`app.js`) where it reads `result.criteria.content/vocabulary/grammar` to read the four new Finnish-named fields.
9. Bump `sw.js` `CACHE_VERSION` (per project memory note).
10. Run `node --check` on all touched files (per project memory note — vitest does not catch parse errors in screen modules).
11. Run the 10 Section 6 samples through the new grader; verify ±1 per dimension and 9/10 bands.
