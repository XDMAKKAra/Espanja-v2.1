# Puheo Spaced-Repetition Scheduler — Design Specification

**Exam date:** 28 September 2026  
**Target learner:** Finnish high-school student, Spanish lyhyt oppimäärä (B1 ceiling)  
**Item pool:** 1,440 seed items across 12 topics  
**Exercise types:** vocab, grammar drills, reading comprehension  
**Grading bands:** taydellinen (3 pts) / ymmarrettava (2 pts) / lahella (1 pt) / vaarin (0 pts)

---

## 1. Algorithm recommendation: SM-2 lite with exam-anchored interval cap

**Recommendation: SM-2 lite, extended with a hard exam-date ceiling.**

SM-2 is the right foundation here. FSRS (Free Spaced Repetition Scheduler) is more accurate for long-horizon personal knowledge libraries (Anki users with 5+ year decks), but its advantage comes from modelling memory-stability across hundreds of reviews per card. Puheo students have at most ~18 months before the September 2026 exam, and the majority of study will be concentrated in the final 2–3 months. With a shallow review depth (most cards will see 4–8 repetitions before the exam), FSRS's stability-estimation machinery provides no meaningful benefit over a well-tuned SM-2, and introduces substantial implementation complexity that would be hard to debug or explain.

A custom "from scratch" curve was also considered, but the existing codebase already ships `routes/sr.js` with a working SM-2 implementation and `migrations/010_sr_cards.sql` with the matching schema. Replacing the algorithm entirely would break existing card history. SM-2 lite preserves backward compatibility: existing `ease_factor`, `interval_days`, and `repetitions` columns continue to carry their current meaning.

The critical addition is an **exam-anchored interval cap**. Vanilla SM-2 has no concept of a deadline. If a card's computed next interval is 120 days and the exam is 90 days away, SM-2 would schedule a review that never happens before the exam. The fix is a ceiling function applied at scheduling time: `interval = min(sm2_interval, days_until_exam - 1)`. As the exam approaches this ceiling tightens automatically, compressing all intervals into the remaining window and ensuring every learned item gets at least one final consolidation review before 28.9.2026.

---

## 2. Item states and transitions

```
new → learning → review → mastered → lapsed
                               ↑         ↓
                               └─────────┘
```

| State | Definition | Entry condition | Exit / reset trigger |
|-------|-----------|-----------------|----------------------|
| `new` | Item has never been shown | Default on creation | First review answer recorded → `learning` |
| `learning` | Early repetitions, interval < 1 day or repetitions ≤ 2 | First answer OR any `vaarin` while in `review` | repetitions ≥ 3 AND interval_days ≥ 7 → `review` |
| `review` | Regular spaced reviews, interval ≥ 7 days | See above | ease_factor ≥ 2.5 AND interval_days ≥ 21 AND last grade ≥ 3 → `mastered`; grade < 3 → `lapsed` |
| `mastered` | Stable long-term memory; reduced urgency | ease_factor ≥ 2.5, interval ≥ 21 days, last grade ≥ 3 | Any `vaarin` or `lahella` (grade ≤ 1) → `lapsed` |
| `lapsed` | Item forgotten after being mastered or reviewed | grade < 3 from `review` or `mastered` | repetitions reset to 1, interval_days reset to 1, ease_factor decremented by 0.2 (min 1.3), re-enters `learning` |

**State is a derived column** — computed from `repetitions`, `interval_days`, `ease_factor`, and `last_grade`. It is stored in `sr_cards.state TEXT` for query performance (see §6) but always recomputed on write and never trusted as a source of truth independently.

---

## 3. Interval curve

The exam is on **28 September 2026**. The scheduler computes `days_until_exam` at review time and applies the caps below.

### Normal SM-2 intervals (no exam pressure)

| Repetition | Interval (days) | Notes |
|-----------|----------------|-------|
| 1 | 1 | Same day or next day |
| 2 | 6 | Standard SM-2 second step |
| 3 | `round(6 × EF)` | EF default = 2.5 → ~15 days |
| 4 | `round(prev × EF)` | ~38 days |
| 5 | `round(prev × EF)` | ~94 days |
| 6+ | `round(prev × EF)` | Grows unboundedly until exam cap |

### Exam-proximity interval caps

```
days_until_exam = date('2026-09-28') - CURRENT_DATE
effective_interval = min(sm2_interval, exam_cap)
```

| Repetition | Normal interval | Cap if exam ≤ 60 days | Cap if exam ≤ 14 days |
|-----------|----------------|----------------------|----------------------|
| 1 | 1 | 1 | 1 |
| 2 | 6 | 5 | 2 |
| 3 | ~15 | 10 | 3 |
| 4 | ~38 | 14 | 4 |
| 5 | ~94 | 21 | 5 |
| 6+ | grows | `min(val, days_until_exam - 1)` | `min(val, days_until_exam - 1)` |

**Hard floor:** In the last 14 days, minimum interval for `lapsed` items is 1 day (still show them daily). For `mastered` items within 14 days, force a review by setting interval to `ceil(days_until_exam / 2)` if they haven't been seen in the past 5 days.

**Hard ceiling:** No `next_review` date may ever be set past `2026-09-27` (the day before the exam). If SM-2 would compute an interval that pushes `next_review` beyond this date, clamp to `2026-09-27`.

### Implementation in `routes/sr.js`

```js
const EXAM_DATE = new Date('2026-09-28');

function examCap(interval_days) {
  const daysLeft = Math.floor((EXAM_DATE - new Date()) / 86400000);
  if (daysLeft <= 0) return 1; // exam passed, keep daily
  if (daysLeft <= 14) return Math.min(interval_days, Math.max(1, Math.floor(daysLeft / 3)));
  if (daysLeft <= 60) return Math.min(interval_days, 21);
  return Math.min(interval_days, daysLeft - 1); // never schedule past exam
}
```

---

## 4. Partial-credit handling

The grader returns one of four bands. These map to SM-2 quality scores (0–5 scale) as follows:

| Band | Points | SM-2 quality q | Rationale |
|------|--------|---------------|-----------|
| `taydellinen` | 3 | **5** | Perfect recall — ease_factor grows |
| `ymmarrettava` | 2 | **3** | Understandable but not perfect — neutral, no ease_factor change |
| `lahella` | 1 | **2** | Close but wrong — mild ease_factor decrease, no repetition reset |
| `vaarin` | 0 | **0** | Wrong — full reset to repetition 0, interval 1 |

**Formula (standard SM-2 ease_factor update):**

```
EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
EF' = max(1.3, EF')
```

Applied per quality level:

| q | EF delta (at default EF=2.5) |
|---|------------------------------|
| 5 | +0.10 |
| 4 | +0.00 |
| 3 | -0.14 |
| 2 | -0.32 |
| 1 | -0.54 |
| 0 | -0.80 |

**`ymmarrettava` as q=3** is a deliberate choice. In the YO-koe context, communicating meaning (2 pts) is a genuine competency — the student has learned the core vocabulary. Setting q=3 means the card is not penalised with a faster decay, but also does not earn the ease_factor boost it would get with perfect recall. This matches the exam's own partial-credit philosophy.

**`lahella` as q=2** triggers an ease_factor decrease but does NOT reset the repetition counter. The item stays in `review` state. This is the key divergence from vanilla SM-2, where q < 3 resets to 0. For lyhyt oppimäärä students who are frequently "almost right" on verb conjugations, a full reset would create thrashing — the same forms appearing every day but never advancing. Setting q=2 as a "soft penalty" lets the item decay to a shorter interval without losing all progress.

**`vaarin` as q=0** is a full reset: `repetitions = 0`, `interval_days = 1`, state → `lapsed`. No nuance needed here.

---

## 5. Daily review budget

Session lengths map to the following budgets. These assume ~20 seconds per item (read question, answer, see feedback) for review items, and ~30 seconds for new items (includes first exposure, read answer, contextual note).

| Session | Target time | Reviews (due cards) | New items | Total items | Notes |
|---------|------------|--------------------|-----------|--------------|-|
| **Kevyt** | ~5 min | **6** | **2** | 8 | Reviews first; new items only if < 6 reviews due |
| **Normaali** | ~15 min | **18** | **6** | 24 | Default session for daily use |
| **Intensiivinen** | ~30 min | **30** | **12** | 42 | Full study session |

**Priority order within a session:**
1. `lapsed` items (highest priority — recently forgotten)
2. Due `review` items ordered by `next_review ASC` (most overdue first)
3. Due `learning` items
4. `new` items (only after reviews are exhausted or budget allows)

**Adaptive new-item throttle:** If a student has > 30 due reviews accumulated (backlog), new items are paused entirely until the backlog drops below 20. This prevents the review pile from becoming demoralising.

**Exam-proximity new-item freeze:** When `days_until_exam ≤ 21`, no new items are introduced in any session. All budget goes to reviewing known items.

---

## 6. Storage schema

**Decision: ALTER TABLE on existing `sr_cards`.**

The `sr_cards` table (migration `010_sr_cards.sql`) already has `user_id`, `word`, `question`, `language`, `ease_factor`, `interval_days`, `repetitions`, `next_review`, `last_grade`. The existing `routes/sr.js` SM-2 logic reads and writes exactly these columns. Adding a new `sr_items` table would split the SR state across two tables for no benefit — we have no items not associated with a user, and the unique constraint `(user_id, word, language)` is already correct.

The following columns are added to support the new scheduler features:

```sql
-- Migration: 024_sr_scheduler_v2.sql
-- Adds state machine, exam-aware scheduling, and session budget tracking to sr_cards.

ALTER TABLE sr_cards
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'new'
    CHECK (state IN ('new', 'learning', 'review', 'mastered', 'lapsed')),

  -- Timestamps for state transitions (for debugging + analytics)
  ADD COLUMN IF NOT EXISTS first_reviewed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mastered_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lapsed_at          TIMESTAMPTZ,

  -- SM-2 quality score from last review (0–5), separate from raw band
  ADD COLUMN IF NOT EXISTS last_quality       SMALLINT CHECK (last_quality BETWEEN 0 AND 5),

  -- Source band as recorded (for audit / possible future re-weighting)
  ADD COLUMN IF NOT EXISTS last_band          TEXT
    CHECK (last_band IN ('taydellinen', 'ymmarrettava', 'lahella', 'vaarin')),

  -- Cumulative correct / total reviews (for per-card accuracy stats)
  ADD COLUMN IF NOT EXISTS reviews_total      INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_correct    INT NOT NULL DEFAULT 0,

  -- Topic tag (maps to the 12 seed topics; null for items created from open exercises)
  ADD COLUMN IF NOT EXISTS topic              TEXT;

-- Support fast state-filtered queries (e.g. "show me all lapsed items")
CREATE INDEX IF NOT EXISTS idx_sr_cards_state ON sr_cards (user_id, state, next_review);

-- Support topic-scoped budgeting queries
CREATE INDEX IF NOT EXISTS idx_sr_cards_topic ON sr_cards (user_id, topic);
```

No existing column is modified. The `state` column defaults to `'new'`, which is correct for all pre-existing rows because none of them will have `next_review` in the past at migration time (or they will be picked up by the backfill described in §7).

---

## 7. Migration plan

### Overview

The migration is zero-downtime. The old code path (`routes/sr.js`) continues to work unchanged until the new scheduler code is deployed — `state` and the new columns are additive only. The backfill runs as a separate SQL step after the schema migration, so there is no window where the app is broken.

### Step 1: Schema migration (run in Supabase SQL Editor)

Run `migrations/024_sr_scheduler_v2.sql` (see §6 above). This only adds columns with defaults and creates indexes. No existing rows are modified. The app continues to run during this step.

### Step 2: Backfill existing `sr_cards` rows

Run this immediately after step 1. It derives `state` from existing SM-2 fields:

```sql
-- Backfill: derive state from existing SM-2 data
-- Run after 024_sr_scheduler_v2.sql

UPDATE sr_cards
SET
  state = CASE
    -- Never reviewed (fresh insert that got no review call)
    WHEN repetitions = 0 AND last_grade IS NULL THEN 'new'

    -- Learning: has been reviewed but hasn't reached stable review cadence yet
    WHEN repetitions <= 2 OR interval_days < 7 THEN 'learning'

    -- Mastered: high ease_factor, long interval, recent good grade
    WHEN ease_factor >= 2.5
      AND interval_days >= 21
      AND last_grade >= 3 THEN 'mastered'

    -- Lapsed: last grade was failing (< 3) — item was known but was missed
    WHEN last_grade IS NOT NULL AND last_grade < 3 THEN 'lapsed'

    -- Default: in active review cycle
    ELSE 'review'
  END,

  -- Approximate first_reviewed_at from created_at (best available proxy)
  first_reviewed_at = CASE
    WHEN repetitions > 0 THEN created_at
    ELSE NULL
  END,

  -- reviews_total approximated from repetitions (SM-2 repetitions = successful reviews only)
  -- We cannot recover failed attempts from existing data, so set to repetitions as a floor
  reviews_total   = repetitions,
  reviews_correct = repetitions

WHERE state = 'new'; -- only touch rows that haven't been backfilled yet
```

### Step 3: Deploy new scheduler code

Deploy the updated `routes/sr.js` that:
- Calls `examCap()` on every computed interval
- Writes `state`, `last_quality`, `last_band`, `reviews_total`, `reviews_correct` on every upsert
- Computes `state` from SM-2 output using the transition rules in §2

No client-side changes are required in this step. The existing `js/features/spacedRepetition.js` continues to call `POST /api/sr/review` with the same payload shape.

### Step 4: Update client-side grade mapping (§4)

Update the call sites in `app.js` that invoke `srReview(ex, grade)` to map the grading band to the correct SM-2 quality score before sending. The mapping is:

```js
// In app.js grading handlers, before calling srReview():
function bandToGrade(band) {
  return { taydellinen: 5, ymmarrettava: 3, lahella: 2, vaarin: 0 }[band] ?? 0;
}
```

Currently the code passes raw 0/4 grades (`srAddWrong` → grade 0, `srMarkCorrect` → grade 4). The new mapping adds `ymmarrettava` (q=3) and `lahella` (q=2) as explicit values. The legacy `srAddWrong`/`srMarkCorrect` helpers remain for backward compatibility with vocab mode, which only has binary correct/wrong feedback.

### Rollback

If a rollback is needed before step 4 is deployed, drop the new columns:

```sql
ALTER TABLE sr_cards
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS first_reviewed_at,
  DROP COLUMN IF EXISTS mastered_at,
  DROP COLUMN IF EXISTS lapsed_at,
  DROP COLUMN IF EXISTS last_quality,
  DROP COLUMN IF EXISTS last_band,
  DROP COLUMN IF EXISTS reviews_total,
  DROP COLUMN IF EXISTS reviews_correct,
  DROP COLUMN IF EXISTS topic;

DROP INDEX IF EXISTS idx_sr_cards_state;
DROP INDEX IF EXISTS idx_sr_cards_topic;
```

The old code never touched these columns, so a rollback is clean.

---

## Appendix: Complete exam-cap logic (copy-paste ready)

```js
// routes/sr.js — replace existing sm2() function with this version

const EXAM_DATE = new Date('2026-09-28T00:00:00Z');

function daysUntilExam() {
  return Math.max(0, Math.floor((EXAM_DATE - new Date()) / 86400000));
}

function examCap(interval_days) {
  const left = daysUntilExam();
  if (left <= 0)  return 1;                                        // exam over, keep daily
  if (left <= 14) return Math.min(interval_days, Math.max(1, Math.ceil(left / 3)));
  if (left <= 60) return Math.min(interval_days, 21);
  return Math.min(interval_days, left - 1);                        // never past exam
}

function deriveState({ ease_factor, interval_days, repetitions, last_quality }) {
  if (repetitions === 0 && last_quality == null)      return 'new';
  if (repetitions <= 2 || interval_days < 7)          return 'learning';
  if (last_quality != null && last_quality < 3)       return 'lapsed';
  if (ease_factor >= 2.5 && interval_days >= 21 && last_quality >= 3) return 'mastered';
  return 'review';
}

function sm2(card, quality) {
  // quality: 0=vaarin, 2=lahella, 3=ymmarrettava, 5=taydellinen
  let { ease_factor, interval_days, repetitions } = card;

  if (quality < 3) {
    // vaarin (0) or lahella (2): reset or penalise
    if (quality <= 1) {
      // vaarin: full reset
      repetitions  = 0;
      interval_days = 1;
    } else {
      // lahella (2): penalise ease but keep repetition count
      interval_days = Math.max(1, Math.round(interval_days * 0.5));
    }
  } else {
    repetitions += 1;
    if (repetitions === 1)      interval_days = 1;
    else if (repetitions === 2) interval_days = 6;
    else                        interval_days = Math.round(interval_days * ease_factor);
  }

  // Apply exam cap
  interval_days = examCap(interval_days);

  // Update ease factor
  ease_factor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  if (ease_factor < 1.3) ease_factor = 1.3;
  ease_factor = Math.round(ease_factor * 100) / 100;

  const next_review = new Date();
  next_review.setDate(next_review.getDate() + interval_days);
  // Hard ceiling: never past 2026-09-27
  const examEve = new Date('2026-09-27T00:00:00Z');
  if (next_review > examEve) next_review.setTime(examEve.getTime());

  const state = deriveState({ ease_factor, interval_days, repetitions, last_quality: quality });

  return {
    ease_factor,
    interval_days,
    repetitions,
    last_quality: quality,
    next_review: next_review.toISOString().slice(0, 10),
    last_grade: quality,
    state,
    ...(state === 'mastered' ? { mastered_at: new Date().toISOString() } : {}),
    ...(state === 'lapsed'   ? { lapsed_at:   new Date().toISOString() } : {}),
  };
}
```
