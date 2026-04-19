# Käännös FI→ES — mini-translation

One Finnish sentence → one Spanish sentence. AI grades meaning first, grammar second. Multiple valid translations accepted via bands.

Note: server endpoint `/api/grade-translate` already exists at [routes/exercises.js:779-820](../routes/exercises.js#L779). This type adopts it behind the unified dispatcher.

---

## 2.1 Schema

```jsonc
{
  "id": "gen:c7a1d9e3",
  "type": "kaannos",
  "cefr": "B1",
  "level": "C",
  "topic": "subjunctive",
  "skill_bucket": "production",
  "prompt": "Toivon, että tulet juhliin.",
  "instruction": "Käännä espanjaksi",
  "explanation": "Toivomus + subjunktiivi (que vengas).",
  "payload": {
    "kaannos": {
      "acceptedTranslations": [
        "Espero que vengas a la fiesta.",
        "Ojalá vengas a la fiesta.",
        "Espero que puedas venir a la fiesta."
      ],
      "grammarFocus": "present_subjunctive",
      "minChars": 10,
      "maxChars": 140
    }
  }
}
```

**Required payload fields:** `acceptedTranslations` (≥ 2, ≤ 5), `grammarFocus` (optional).

The existing `translate_mini` dormant schema maps cleanly: `finnishSentence` → `prompt`, `acceptedTranslations` → `payload.kaannos.acceptedTranslations`, `grammarFocus` kept as-is.

---

## 2.2 Grading rubric

### System prompt

```
You grade a Finnish→Spanish translation for a YO-koe student (lyhyt oppimäärä, ≈ B1).

Finnish source: "{{prompt}}"
Accepted translations: {{acceptedTranslations | json}}
Grammar focus: {{grammarFocus}}
Student translation: "{{studentTranslation}}"

Grade by meaning first, grammar second. A different-but-equivalent translation is fully correct.

Return STRICT JSON:
{
  "band": "taydellinen"|"ymmarrettava"|"lahella"|"vaarin",
  "meaningMatch": 0-3,
  "grammarScore": 0-3,
  "bestAccepted": string,   // the closest accepted translation
  "corrections": [
    { "span": string, "correction": string, "note": string ≤ 60 Finnish chars }
  ],                         // max 3
  "feedback": string ≤ 120 Finnish chars
}
No markdown. Max 400 tokens.
```

### Band (server-derived)
- `meaningMatch = 3 && grammarScore = 3` → `täydellinen`
- `meaningMatch ≥ 2 && grammarScore ≥ 2` → `ymmärrettävä`
- `meaningMatch ≥ 2 && grammarScore < 2` → `lähellä` (meaning there, form off)
- `meaningMatch < 2` → `väärin` regardless of grammar

### Deterministic pre-check
Before AI: if `studentTranslation` equals any `acceptedTranslations[i]` ignoring case/punctuation/whitespace → `täydellinen` with feedback `"Oikein!"`, no AI call.

---

## 2.3 Server-side validation

```
POST /api/grade
{ "type": "kaannos", "exerciseId": "...", "payload": { "studentTranslation": "Espero que vengas." } }
→ { correct: true, band: "taydellinen", score: 3, maxScore: 3, feedback: "Oikein!", ... }
```

`acceptedTranslations` are **never** sent to the client. Client sends raw student text; server matches + grades.

---

## 2.4 UI spec

### Mobile (390×844)
```
┌──────────────────────────────┐
│ ← Käännös FI→ES          ⋯   │
├──────────────────────────────┤
│  Käännä espanjaksi           │
│                              │
│  "Toivon, että tulet         │   prompt, 18 px, quoted
│   juhliin."                  │
│                              │
│  ┌────────────────────────┐ │
│  │ Kirjoita käännös…      │ │   textarea 96 px, lang=es
│  └────────────────────────┘ │
│  ▁▁▁▁▁▁░░░░░░ 42/140         │
│                              │
│  [ Vihje ]        [Tarkista]│
└──────────────────────────────┘
```

### Desktop
560 px column, textarea 120 px.

### Feedback states
- **Idle** — submit disabled (< `minChars`).
- **Deterministic-täydellinen** — instant green band, no spinner.
- **AI-loading** — inline `"Arvioidaan…"` in band badge area, ≤ 2 s typical.
- **Täydellinen** — green, `"Oikein!"`, accepted translations shown in a collapsible `<details>` ("Muita hyväksyttäviä käännöksiä").
- **Ymmärrettävä** — blue, feedback + inline corrections highlighted.
- **Lähellä** — amber, `bestAccepted` shown below student text with a diff.
- **Väärin** — red, explanation expanded.

Inline correction rendering: student text is split by `corrections[i].span`; span replaced with `<span class="correction">{span}<sup class="correction-arrow">→</sup><span class="correction-target">{correction}</span></span>` plus tooltip on hover carrying the `note`.

### Accessibility
Same as lauseen-muodostus (lang=es, spellcheck off).

---

## 2.5 Adaptive / SR / mastery integration

| Concern | Behavior |
|---|---|
| Adaptive signal | Band → as SHARED §3; confidence = `meaningMatch/3`. |
| SR card | Hash of Finnish prompt — `{ word: "kaannos:" + sha8(prompt), question: prompt, language: "es" }`. Scheduled so same stem returns for review. |
| Mastery | `skill_bucket: "production"`, weight 1.3. |
| Path XP | 1.5 XP täydellinen/ymmärrettävä, 0.75 lähellä. |
| Cold-start | First exposure: prompt ≤ 6 Finnish words, acceptedTranslations ≥ 3. |

---

## 2.6 Cost model

- Prompt in: ~300 tokens.
- Max out: 400 tokens (reduced from existing 500 since we need less corrections detail than writing grader).
- Typical out: ~150 tokens.
- Cost: ~$0.0002/grade.
- Deterministic hits save ~25% of calls.
- Cache key: `sha256("kaannos-v1" + normalize(studentTranslation) + exerciseId)`.
- Cache hit-rate: 10% (common mistakes recur).
- **Effective cost: ~$0.00015/submission.**

Latency: p50 ~ 900 ms, p95 ~ 2 s.

---

## 2.7 Content sourcing

- Generated on demand; existing dormant `/api/translate-mini` prompt adopted.
- CEFR: A2 (present tense, 4-6 words) → B1 (multi-tense, 6-10) → B2 (subjunctive/conditional, 8-14).
- Topic taxonomy: reuse grammar topics (subjunctive, ser_estar, preterite_imperfect, etc.).
- Seed bank: ~150 items across B1/B2.

---

## 2.8 Abuse / edge cases

1. **Empty** — submit disabled; 400 from API.
2. **Student writes in Finnish** — language detect (>50% non-Spanish chars) → `err.wrongLang`.
3. **Copy-paste from `acceptedTranslations`** (if leaked elsewhere) — not possible since server never sends them.
4. **Prompt injection** — interpolated as quoted value; literal-only output schema.
5. **Very long input** — cap 140 chars.
6. **Idiomatic equivalent not in accepted list** — AI band handles gracefully.
7. **English instead of Spanish** — language detect + AI will score meaning 0 anyway.
8. **Single-word answer** (e.g. student writes just `"sí"`) — AI grades meaning 0 → väärin with feedback `"Vastaus on liian lyhyt."`.

---

## 2.9 Test plan

### Unit (`tests/grading/kaannos.test.js`)
- Exact match (any accepted translation) → `täydellinen`, no AI call (assert `callOpenAI` not invoked).
- Meaning-ok-grammar-off → `lähellä`.
- Wrong meaning → `väärin` regardless of grammar.
- Malformed AI JSON → `lähellä` + generic feedback.
- Language detect rejects Finnish input.

### Fixtures
`tests/fixtures/openai/kaannos.json` — 15 `{input, expected_output}`.

### E2e
- Deterministic-täydellinen happy path.
- AI-graded lähellä path.
- Inline correction tooltip renders on hover.
- Server-trust: client forces `correct:true` on wrong answer → server overrides.
- Screenshots × 4 bands × 2 viewports.
