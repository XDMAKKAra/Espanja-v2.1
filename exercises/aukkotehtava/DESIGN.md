# Aukkotehtävä — typed gap-fill

Student types the missing word. No multiple-choice fallback. Grader is deterministic-first, AI-fallback only on genuinely ambiguous cases.

---

## 2.1 Schema

Extends `ExerciseBase` from `SHARED.md` §1.

```jsonc
{
  "id": "gen:a3f9c1b2",
  "type": "aukkotehtava",
  "cefr": "B1",
  "level": "C",
  "topic": "ser_estar",
  "skill_bucket": "grammar",
  "prompt": "Mi madre ___ médica.",
  "instruction": "Täydennä aukko",
  "context": "Profession → permanent trait.",
  "explanation": "Ammatti on pysyvä piirre → 'es' (ser).",
  "payload": {
    "aukkotehtava": {
      "answer": "es",
      "synonyms": ["es"],           // closed list of *also-correct* forms
      "acceptDiacriticFold": true,
      "acceptCase": "insensitive",   // "insensitive" | "sensitive"
      "nearMissThreshold": 1,        // Levenshtein ≤ this → "lähellä"
      "hintLetterOffset": null       // optional: if set, reveals N letters
    }
  }
}
```

**Required payload fields:** `answer`, `synonyms` (may equal `[answer]`).
**Optional:** `acceptDiacriticFold` (default `true`), `acceptCase` (default `"insensitive"`), `nearMissThreshold` (default `1`).

Existing `routes/exercises.js:573-620` dormant `gap_fill` maps cleanly to this — we adopt `alternativeAnswers[]` as the `synonyms` field.

---

## 2.2 Grading rubric

Server is authoritative. Order of checks (first match wins):

1. **Exact match** (case per `acceptCase`) → `täydellinen`.
2. **Diacritic-fold match** (e.g. `"esta"` vs `"está"`) → `ymmärrettävä` with hint `hint.accent`.
3. **Synonym-list match** → `täydellinen`.
4. **Levenshtein ≤ `nearMissThreshold`** → `lähellä` with hint `hint.spelling`.
5. **AI fallback** — only if none of 1-4 match AND input is non-empty and plausibly in Spanish (see §2.8). Called at most once per submission. Returns a band + short Finnish feedback.
6. Default → `väärin`.

### AI fallback prompt (English internally, Finnish outputs)

```
System: You are a Spanish language expert grading a fill-in-the-blank exercise for a Finnish high-school student preparing for the YO-koe (lyhyt oppimäärä).
The exercise is: "{{prompt}}"
The correct answer is: "{{answer}}" (also accepted: {{synonyms}})
The student typed: "{{studentInput}}"

Decide one of:
- "taydellinen" — student's answer is equivalent in meaning and grammar
- "ymmarrettava" — minor issue (gender, agreement) but meaning is clear
- "lahella" — understandable but wrong form
- "vaarin" — wrong

Return STRICT JSON:
{ "band": "taydellinen"|"ymmarrettava"|"lahella"|"vaarin",
  "feedback": string <= 120 chars, in Finnish, NO prescriptive tone,
  "correction": string <= 40 chars — the accepted form }

No other keys. No markdown. Max 200 tokens.
```

### Output validation (before caching or returning)
- `band` must be one of four literals.
- `feedback` trimmed, ≤ 120 chars, no `<`/`>` (strip HTML).
- `correction` ≤ 40 chars.
- Malformed → treat as `väärin` + feedback `"Vastaus ei kelvannut — katso selitys."` + log `exercise_grader_malformed` telemetry.

### Band → YO score
| Band | 0-3 score | Streak | XP |
|---|---|---|---|
| täydellinen | 3 | ✓ | 1.0 |
| ymmärrettävä | 3 | ✓ | 1.0 |
| lähellä | 1 | ✗ | 0.5 |
| väärin | 0 | ✗ | 0 |

---

## 2.3 Server-side validation

**Never trusts client `correct`.** Endpoint:

```
POST /api/grade
{
  "type": "aukkotehtava",
  "exerciseId": "gen:a3f9c1b2",
  "payload": { "studentInput": "es" }
}
→ { "correct": true, "band": "taydellinen", "score": 3, "maxScore": 3,
    "feedback": "Oikein!", "corrections": [], "latency_ms": 42 }
```

The exercise item (answer, synonyms, etc.) is fetched server-side by `exerciseId` from the session cache / bank. If the item is not found, the server returns `410 Gone` — client retries with fresh generation.

Client never sees `answer` before submission. Today's dormant `/api/gap-fill` returns `correctAnswer` in the payload — **Step 2 removes that field from the client-facing JSON**.

---

## 2.4 UI spec

### Mobile (390×844)
```
┌──────────────────────────────┐
│ ← Aukkotehtävä          ⋯   │   44 px header
├──────────────────────────────┤
│                              │
│  Täydennä aukko              │   instruction, 14 px
│                              │
│  Mi madre ___ médica.        │   prompt, 20 px, mono for ___
│                              │
│  Profession → permanent.     │   context, 13 px muted
│                              │
│  ┌────────────────────────┐ │
│  │ Kirjoita vastaus…      │ │   input, 48 px tall, autofocus
│  └────────────────────────┘ │
│                              │
│  [ Vihje ]        [Tarkista]│   buttons, 48 px tall
│                              │
└──────────────────────────────┘
```

### Desktop (1440×900)
Same layout centered in a 560 px column. Input 56 px tall. Buttons right-aligned.

### Feedback states
- **Idle** — input empty, submit disabled.
- **Submitted** — input locked, spinner-free (deterministic is instant, AI fallback shows inline spinner in the band badge for ≤ 2 s).
- **Täydellinen** — green band pill top of card, `"Oikein!"`, next-button auto-focuses.
- **Ymmärrettävä** — blue band pill, `"Hyvä, aksentti puuttui: está"`.
- **Lähellä** — amber band pill, `"Lähellä! Oikea muoto: está"`, diff-highlight on input text (wrong chars in red).
- **Väärin** — red band pill, `"Oikea vastaus: está"`, explanation expanded automatically.
- **AI-loading** — band badge: pulsing dot + `"Tarkistetaan…"`, max 2 s.
- **Error** — `showFetchError` with `err.network.title` + `Yritä uudelleen`.

### Accessibility
- Input: `autocomplete="off"`, `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`, `lang="es"`.
- Submit button: disabled until input non-empty.
- Enter key submits.
- Escape clears.
- All focusable elements ≥ 44 px tall.

---

## 2.5 Adaptive / SR / mastery integration

| Concern | Behavior |
|---|---|
| Adaptive signal | `täydellinen`/`ymmärrettävä` → correct; `lähellä` → partial (confidence 0.5); `väärin` → wrong. |
| SR card | The gap word — `{ word: payload.aukkotehtava.answer, question: ex.prompt, language: "es" }`. |
| SR grade map | täydellinen → 5 · ymmärrettävä → 4 · lähellä → 2 · väärin → 0. |
| Mastery | `skill_bucket: "grammar"` or `"vocab"` depending on `topic`. Weight 1.0. No decay shortcut. |
| Path XP | 1 XP per täydellinen/ymmärrettävä, 0.5 per lähellä. |
| Cold-start | First exposure: scaffold forced to ≥ 1 (context always shown, even if user's current scaffold is 0). |

---

## 2.6 Cost model (AI fallback only)

Deterministic path: **$0**, ~20 ms.

AI fallback (≤ 15% of submissions estimated):
- Prompt in: ~180 tokens.
- Max out: 200 tokens.
- Typical out: ~50 tokens.
- Cost: ~$0.00008 per fallback call.
- Cache key: `sha256("aukko-v1" + normalize(prompt) + normalize(studentInput) + normalize(answer))`.
- Cache hit-rate assumption: 20% (common misspellings recur).
- **Effective cost per submission: ~$0.00001.** Negligible.

---

## 2.7 Content sourcing

- **Generated on demand** via the existing composer (adopted `gap_fill` template at [lib/exerciseComposer.js:89-195](../lib/exerciseComposer.js#L89)).
- Bank reuse: 50% chance via `tryBankExercise` when available.
- CEFR: A2 at level I-A, B1 at B-C, B2 at M-E-L.
- Topics: reuse `TYPE_TOPIC_AFFINITY` keys.
- Seed bank: ~200 items generated into `exercise_bank` before ship (one-off author run; separate commit).

---

## 2.8 Abuse / edge cases

1. **Empty input** — submit disabled; if bypassed via API, server returns 400 with `err.empty`.
2. **Whitespace-only input** — same as empty.
3. **Wrong language** (Finnish/English typed where Spanish expected) — heuristic: >50% chars outside `[a-záéíóúüñ¿¡ ]` → reject with `err.wrongLang` before AI fallback.
4. **Prompt-injection** (`"ignore previous instructions"`) — grader prompt is fixed; student input is interpolated as a *value*, never as instructions. JSON schema coerced. Model output validated against literals → any deviation is treated as `väärin`.
5. **Extremely long input** — cap at 60 chars server-side. Longer → truncate + telemetry.
6. **All-caps / no-punctuation** — case normalization handles caps. Punctuation stripped before compare.
7. **Valid alternative the fixture didn't list** — AI fallback catches these; telemetry flags unexpected `täydellinen` from fallback so we can grow the synonym list.
8. **Unicode homoglyphs** (Cyrillic `а` in place of Latin `a`) — NFC-normalize + Latin-only filter after fold.
9. **Multiple gaps assumed** — schema only supports one gap per item. Multi-gap deferred to a future pass; enforce `prompt.match(/___/g).length === 1` server-side.

---

## 2.9 Test plan

### Unit (vitest, in `tests/grading/aukkotehtava.test.js`)
- Exact match → `täydellinen`.
- Diacritic fold (`"esta"` vs `"está"`) → `ymmärrettävä`.
- Synonym list hit → `täydellinen`.
- Levenshtein 1 (`"estoy"` vs `"estoy"` typo → `"estay"`) → `lähellä`.
- Levenshtein 3 → `väärin` (no AI call — confirm `callOpenAI` not invoked).
- Wrong language input → rejected pre-AI.
- Prompt injection in input → treated as text, graded `väärin`.
- Empty / whitespace → 400.
- 60-char truncation.
- Malformed AI JSON → fallback to `väärin` + Finnish generic feedback.

### Fixtures
`tests/fixtures/openai/aukkotehtava.json` — 20 `{input, expected_output}` pairs covering ambiguous cases only (where AI is actually called).

### E2e (Playwright, `tests/e2e/aukkotehtava.spec.js`)
- Happy path: submit correct answer → green band, advance.
- Lähellä: submit Levenshtein-1 typo → amber band, correct shown.
- Server-trust regression: intercept submit, force `correct:true` in request → server overrides to `correct:false` when student answer wrong.
- Screenshots at 390×844 and 1440×900 for each of: idle, loading, täydellinen, lähellä, väärin, error.
