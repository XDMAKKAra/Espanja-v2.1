# Tekstinymmärrys + avoin vastaus

80-150-word Spanish passage + 2-4 Finnish open-ended questions. AI grades all answers in a single call. Mirrors real YO-koe reading section.

**Flagged in SHARED §5 as the only type at risk of exceeding the writing-grader latency budget.** Mitigated via single-call grading (see §2.6).

---

## 2.1 Schema

```jsonc
{
  "id": "gen:d9f3a0b2",
  "type": "tekstinymmarrys",
  "cefr": "B1",
  "level": "C",
  "topic": "reading",
  "skill_bucket": "comprehension",
  "prompt": "Lue teksti ja vastaa suomeksi.",
  "instruction": "Lue teksti ja vastaa suomeksi",
  "payload": {
    "tekstinymmarrys": {
      "passage": "Cada verano, mi familia viaja a un pueblo pequeño en la costa de Asturias...",  // 80-150 words
      "passageTitle": "Veraneo en Asturias",
      "questions": [
        {
          "id": "q1",
          "question": "Mihin perhe matkustaa joka kesä?",  // Finnish
          "rubric": "Pieni kylä Asturian rannikolla.",       // canonical answer
          "acceptableKeys": ["kylä", "Asturia", "ranta"]     // accepted concept tokens
        },
        {
          "id": "q2",
          "question": "Mitä he tekevät siellä?",
          "rubric": "He käyvät rannalla ja syövät paikallisia kaloja.",
          "acceptableKeys": ["ranta", "kala", "syö"]
        }
      ],
      "maxAnswerChars": 200
    }
  }
}
```

**Required payload fields:** `passage` (80-150 words), `questions` (2-4, each with `id`, `question`, `rubric`, `acceptableKeys`).

Extends the existing `/api/reading-task` shape ([routes/exercises.js:401-482](../routes/exercises.js#L401)) minimally — we keep its `passage` + `questions` structure and add `rubric` + `acceptableKeys` to each question.

---

## 2.2 Grading rubric

**One AI call grades all N answers.** This is the cost-mitigation for F9.

### System prompt

```
You grade a reading-comprehension task for a Finnish YO-koe student.
The student read a Spanish passage and answered N questions IN FINNISH.

Passage (Spanish):
"""
{{passage}}
"""

Questions and rubrics:
{{questions | json}}   // array of { id, question, rubric, acceptableKeys }

Student's answers (Finnish):
{{studentAnswers | json}}   // array of { id, text }

For EACH answer, grade:
- comprehension: 0-3 (does the student show they understood the passage?)
- completeness: 0-3 (does the answer cover the rubric's key points?)
- language: 0-3 (Finnish clarity — do not penalize Finnish grammar heavily; this is a comprehension test, not a writing test)

Return STRICT JSON:
{
  "items": [
    {
      "id": string,
      "band": "taydellinen"|"ymmarrettava"|"lahella"|"vaarin",
      "scores": { "comprehension": 0-3, "completeness": 0-3, "language": 0-3 },
      "feedback": string ≤ 100 Finnish chars,
      "hint": string ≤ 80 Finnish chars (optional — shown if band ≠ täydellinen)
    }
  ]
}
No markdown. Max 700 tokens.
```

### Band (server-derived per item)
- all scores = 3 → `täydellinen`
- comprehension ≥ 2 AND completeness ≥ 2 → `ymmärrettävä`
- comprehension ≥ 2 AND completeness < 2 → `lähellä`
- comprehension < 2 → `väärin`

### Output validation
- `items.length` must equal `questions.length`.
- Each `items[i].id` must match a `questions[j].id`.
- Order-insensitive — server sorts by id.
- Malformed / missing item → that item graded `lähellä` + feedback `"Arviointi ei onnistunut."`, others returned normally.

### Overall exercise correctness
`correct = true` iff **all** items are `täydellinen` or `ymmärrettävä`. One `lähellä` or `väärin` → `correct = false`, but partial XP awarded per-item.

---

## 2.3 Server-side validation

```
POST /api/grade
{
  "type": "tekstinymmarrys",
  "exerciseId": "gen:d9f3a0b2",
  "payload": { "answers": [ { "id": "q1", "text": "..." }, { "id": "q2", "text": "..." } ] }
}
→ {
  "correct": true,
  "band": "ymmarrettava",      // worst of the items (that still = correct)
  "score": 5, "maxScore": 6,
  "items": [ { id, band, feedback, hint? }, ... ],
  "latency_ms": 2840
}
```

Rate limit: this endpoint has a per-user 10 s cooldown — a student cannot rapid-fire-submit. Protects grader budget.

Client never sees `rubric` or `acceptableKeys` before submission.

---

## 2.4 UI spec

### Mobile (390×844)

```
┌──────────────────────────────┐
│ ← Tekstinymmärrys        ⋯   │
├──────────────────────────────┤
│  Veraneo en Asturias         │   title, 20 px
│                              │
│  Cada verano, mi familia     │   passage, 15 px, line-height 1.6
│  viaja a un pueblo pequeño…  │   scroll within fixed 40vh area
│                              │
├──────────────────────────────┤
│  Kysymys 1/2                 │   progress, sticky
│  Mihin perhe matkustaa?      │
│  ┌────────────────────────┐ │
│  │ Vastaa suomeksi…       │ │   textarea 80 px
│  └────────────────────────┘ │
│                              │
│  [Seuraava kysymys]          │   advance button
└──────────────────────────────┘
```

Questions shown one at a time; answers persisted in memory until all filled, then single submit. This matches YO-koe pacing and lets the grader batch.

After all answered → `[Tarkista vastaukset]` → loading skeleton → results card with per-question bands.

### Desktop (1440×900)

Two-column: passage left (640 px), questions right (480 px) stacked with scroll. All questions visible at once on desktop.

### New skeleton variant `reading-passage`
```
.skeleton-passage
  > .skeleton-bar-wide × 6   (passage lines)
  > .skeleton-divider
  > .skeleton-bar-medium × 2 (question 1)
  > .skeleton-bar-medium × 2 (question 2)
```
Added to [js/ui/loading.js:36](../js/ui/loading.js#L36) as a new entry.

### Feedback states
- **Pre-submit** — passage visible, question `n/N` indicator, textarea active.
- **All answered, pre-grade** — single `[Tarkista vastaukset]` button.
- **Grading** — `reading-passage` skeleton + `"Arvioidaan vastauksia…"`, 2-4 s typical.
- **Results card** — per-question band chip + feedback + optional hint; overall score + YO-band at top.
- **Error** — `showFetchError` with `err.model.title`; preserves answers in textarea state.

### Accessibility
- Passage `lang="es"`; questions and textareas `lang="fi"`.
- Keyboard: Enter in textarea → no submit (multi-line); `Ctrl+Enter` on last question → submit.
- Passage region has `role="region"` + `aria-label="Luettava teksti"`.
- Progress announced: `aria-live="polite"` on `Kysymys n/N`.

---

## 2.5 Adaptive / SR / mastery integration

| Concern | Behavior |
|---|---|
| Adaptive signal | Per-item: correct/partial/wrong. Aggregate to topic `reading`: `correct = (all items ≥ ymmärrettävä)`. |
| SR | **Not scheduled.** (F7) — passage is too coarse, per-question is too fragmented. Vocabulary surfaced inside the passage enters SR via a separate vocab pass, deferred. |
| Mastery | `skill_bucket: "comprehension"`. Weight 1.0 per question (so a 4-Q passage = 4 mastery points). |
| Path XP | 1 XP per `täydellinen`/`ymmärrettävä` item, 0.5 per `lähellä`. Max 4 per passage. |
| Cold-start | First exposure: passage ≤ 100 words, 2 questions, CEFR A2-B1. |

---

## 2.6 Cost model

**This is the type to watch.**

- Prompt in: ~800-1100 tokens (passage + rubrics + student answers).
- Max out: 700 tokens.
- Typical out: ~350 tokens (with 3 questions).
- Cost: ~$0.0007/grade.
- Cache key: `sha256("reading-v1" + exerciseId + normalize(answers.joinById))`.
- Cache hit-rate: < 5% (answers are student-specific free text).
- **Effective cost: ~$0.0007/submission.**

Latency (single-call grading vs N-call): single call is ~1.3× more tokens in + 1× tokens out per question → ~$0.0007 total vs ~$0.0005 × N per-call. Single-call wins on both cost and p95 latency (single RTT).

p50 target ~2 s, p95 ~4 s. Flagged in SHARED §5 as **at the edge** of the latency budget; acceptable because reading is a low-frequency type (~1 per adaptive session vs 6+ monivalinta).

---

## 2.7 Content sourcing

- Generated via existing `/api/reading-task` prompt, extended to emit `rubric` + `acceptableKeys` per question.
- Passage: 80-150 Spanish words; YO topic whitelist (family, school, travel, environment, tech, health, work, culture).
- CEFR: A2 → 80-100 words, present tense, 2 questions. B1 → 100-130, multi-tense, 3 questions. B2 → 130-150, including subjunctive, 3-4 questions.
- Seed bank: ~40 passages (~120 questions) across topics and levels.
- Generator prompt budget: 1500 max_tokens — matches existing generator ceiling.

---

## 2.8 Abuse / edge cases

1. **All answers empty** — submit disabled; if bypassed, server returns 400.
2. **Answers in Spanish** (ignoring the "vastaa suomeksi" rule) — heuristic language detect → warning + send anyway (the rubric tolerates Spanish, but we flag to user: `"Vastaa suomeksi."`).
3. **Very short answers** ("kyllä") — AI will score `completeness = 0` → `väärin`.
4. **Prompt injection in answer** — interpolated as quoted value + literal-only output validation.
5. **Copy-paste of passage as answer** — trivially caught: detected via substring; pre-graded `comprehension: 0` server-side before AI.
6. **> `maxAnswerChars` (200)** — truncate server-side with telemetry.
7. **Rapid resubmit** — 10s cooldown per user.
8. **Single-question passage submitted with blanks on others** — require all questions answered before enabling submit; if bypassed, 400.
9. **Malformed grader response** (missing items[]) — each missing item defaults to `lähellä` + generic feedback; others return normally.

---

## 2.9 Test plan

### Unit (`tests/grading/tekstinymmarrys.test.js`)
- 3-question passage, grader returns per-item bands → server aggregates correctly.
- Missing item in grader response → defaulted to `lähellä`, others intact.
- Copy-paste-passage heuristic catches pre-AI.
- Rate-limit: second submit within 10s → 429.
- Server-trust: client sends overall `correct:true` → server overrides based on item bands.

### Fixtures
`tests/fixtures/openai/tekstinymmarrys.json` — 8 passages × 3 scenarios each (all-correct, mixed, all-wrong).

### E2e
- Mobile single-question-at-a-time flow; passage scroll area stays anchored.
- Desktop two-column layout; all questions visible.
- Results card renders per-question bands.
- `reading-passage` skeleton visible during grading; 2-4s budget.
- Screenshots × (pre-submit, grading, results-correct, results-mixed, error) × 2 viewports.
