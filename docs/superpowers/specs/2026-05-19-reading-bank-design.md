# Task 2 — Static reading-comprehension bank (ES/FR/DE)

**Date:** 2026-05-19
**Scope:** one PR, `auto/task2-reading-bank`

## Problem

`POST /api/reading-task` hits OpenAI on every cold-cache request (~$0.005
per text). The existing DB-backed `exercise_bank` warms up only after a
user generates a text — first user on a (lang, topic, level) slot always
pays for AI. With three languages × six topics × five levels = 90 slots,
the cold-start tax is real.

## Solution

Pre-generate 60 reading texts per language (3 langs = 180 texts total),
six topics × 10 texts per topic, level-mixed 4×B + 3×C + 3×M. Store as
JSON files at `data/exam-pools/reading-bank/{lang}/{topic_slug}.json`.

Route checks the static bank first; falls through to the DB bank, then
to OpenAI. Static hit returns in <50ms and costs nothing.

## Generation method

3 parallel `claude-sonnet-4-6` sub-agents (one per language), each writing
6 JSON files directly via the Write tool. Pedagogy directives in the
prompt cover:
- surface feature variation across 10 texts per category
- level calibration (sentence avg, tense scope) per B/C/M
- plausible multiple-choice distractors targeting Finnish-learner errors
- true/false `justification` quoted verbatim from text body
- short_answer with 1-3 accepted phrasings

## Components

- `lib/readingBank.js` — pure-function loader with in-process cache,
  `pickReadingFromBank({ language, topic, level, recentTitles })` →
  matching text or `null`. Fallback ordering: exact level + unseen →
  exact level → any level + unseen → any level.
- `routes/exercises.js` `POST /reading-task` — call `pickReadingFromBank`
  before `tryBankExercise`; return `{ reading, source: "static-bank" }`
  on hit.
- `scripts/build-reading-bank.mjs` — coverage report (lang × topic × level
  matrix); fails with exit 1 on missing/broken files.
- `tests/reading-bank.test.js` — schema validation: every text has valid
  level, ≥4 questions, ≥2 multiple_choice, true_false justification
  appears verbatim in body, short_answer has ≥1 accepted answer.

## Acceptance

- 18 JSON files committed (3 langs × 6 topics), each with ≥10 texts.
- `node scripts/build-reading-bank.mjs` exits 0.
- `npm test` green including `reading-bank.test.js`.
- Route returns `source: "static-bank"` for an unauthenticated GET when
  the slot is populated.
- `sw.js` cache version bumped.
