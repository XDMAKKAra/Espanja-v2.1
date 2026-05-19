# Task 3 — Static writing-task prompt bank (ES/FR/DE)

**Date:** 2026-05-19
**Scope:** one PR, `auto/task3-writing-bank`

## Problem

`POST /api/writing-task` invokes OpenAI on every request to generate a
task prompt (the situation + Spanish/French/German task instruction +
3 Finnish requirements + text-type label). Grading still needs AI when
the student submits, but the prompt itself is a finite design space that
doesn't need on-demand generation.

## Solution

Pre-generate 75 prompts per language (50 short + 25 long), stored as
JSON arrays at `data/exam-pools/writing-tasks/{lang}/{short|long}.json`.
Route checks the bank first; AI fallback runs only if a slot is empty.

## Schema

Bank entries are shaped exactly like the existing
`POST /api/writing-task` response so the client needs no changes:

```jsonc
{
  "id": "es-short-01",
  "taskType": "short",          // or "long"
  "topic": "synttärit",         // for analytics
  "register": "informal",       // or "formal"
  "rubric_focus": "...",        // YTL-rubric area this stresses
  "points": 20,                 // 20 short, 40 long
  "charMin": 160, "charMax": 240, // 300/450 for long
  "situation": "Suomenkielinen tilannekuvaus",
  "prompt": "Tehtävänanto kohdekielellä",
  "requirements": ["1", "2", "3"], // exactly 3
  "textType": "esim. WhatsApp-viesti / sähköposti"
}
```

## Generation method

3 parallel `claude-sonnet-4-6` sub-agents, one per language. Each writes
short.json + long.json directly via the Write tool. Pedagogy directives:
- surface feature variation across the 50 shorts
- topic spread across 12 arkiset YO-koe topics
- register split ~70% informal / 30% formal for shorts
- 3 concrete verifiable requirements per prompt
- internal `rubric_focus` field naming the YTL stress-area

The DE prompt adds an explicit JSON-validity rule — German direct speech
uses curly quotes that break JSON parsers if the agent embeds them as
ASCII `"` inside string values.

## Components

- `lib/writingBank.js` — loader + `pickWritingTaskFromBank(...)` with
  weakness-aware first pass (matches rubric_focus against the client's
  `recentWeaknesses` categories), unseen filter, random fallback.
- `routes/writing.js` `POST /writing-task` — bank lookup before AI,
  returns `{ task, source: "static-bank" }` on hit.
- `tests/writing-bank.test.js` — schema validation: counts, ids unique,
  taskType matches file, charMin/Max/points match type, requirements
  exactly 3, register ∈ {informal, formal}.

## Acceptance

- 6 JSON files committed (3 langs × 2 types), short ≥30, long ≥15.
- Route returns `source: "static-bank"` when slot is populated.
- `npm test` green.
- `sw.js` cache version bumped.
