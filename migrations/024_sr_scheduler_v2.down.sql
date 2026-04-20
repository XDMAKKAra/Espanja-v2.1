-- Rollback Gate A2
ALTER TABLE sr_cards
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS last_quality,
  DROP COLUMN IF EXISTS last_band,
  DROP COLUMN IF EXISTS reviews_total,
  DROP COLUMN IF EXISTS reviews_correct,
  DROP COLUMN IF EXISTS first_reviewed_at,
  DROP COLUMN IF EXISTS mastered_at,
  DROP COLUMN IF EXISTS lapsed_at,
  DROP COLUMN IF EXISTS topic;
