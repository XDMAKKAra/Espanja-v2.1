-- Gate A2: SR scheduler v2
-- Adds state machine + quality/band tracking columns to sr_cards

ALTER TABLE sr_cards
  ADD COLUMN IF NOT EXISTS state          text    NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS last_quality   integer,
  ADD COLUMN IF NOT EXISTS last_band      text,
  ADD COLUMN IF NOT EXISTS reviews_total  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_correct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS mastered_at   timestamptz,
  ADD COLUMN IF NOT EXISTS lapsed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS topic         text;

-- Backfill state from existing SM-2 columns
UPDATE sr_cards SET state =
  CASE
    WHEN repetitions = 0 AND last_grade IS NULL          THEN 'new'
    WHEN repetitions <= 2 OR interval_days < 7            THEN 'learning'
    WHEN last_grade IS NOT NULL AND last_grade < 3        THEN 'lapsed'
    WHEN ease_factor >= 2.5 AND interval_days >= 21
         AND last_grade >= 3                              THEN 'mastered'
    ELSE 'review'
  END;

-- Seed reviews_total / reviews_correct from repetitions (best-effort)
UPDATE sr_cards SET
  reviews_total   = repetitions,
  reviews_correct = repetitions
WHERE repetitions > 0 AND reviews_total = 0;
