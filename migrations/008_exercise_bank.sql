-- ============================================================
-- Exercise bank: reuse AI-generated exercises to cut costs
-- ============================================================

-- Bank of generated exercises
CREATE TABLE IF NOT EXISTS exercise_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mode TEXT NOT NULL,           -- 'vocab', 'grammar', 'reading'
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'spanish',
  payload JSONB NOT NULL,       -- the full exercise/question JSON
  quality_score NUMERIC DEFAULT 1.0,
  reported_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exercise_bank_lookup
  ON exercise_bank (mode, level, topic, language)
  WHERE quality_score > 0;

CREATE INDEX IF NOT EXISTS idx_exercise_bank_reported
  ON exercise_bank (reported_count)
  WHERE reported_count > 0;

-- Track which exercises each user has seen recently
CREATE TABLE IF NOT EXISTS seen_exercises (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise_bank (id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_seen_exercises_user ON seen_exercises (user_id, seen_at);

-- RLS
ALTER TABLE exercise_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE seen_exercises ENABLE ROW LEVEL SECURITY;

-- Cleanup old seen records (> 30 days) — add to existing cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_rows()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_cache WHERE expires_at < now();
  DELETE FROM rate_limit_buckets WHERE window_start < now() - INTERVAL '2 hours';
  DELETE FROM seen_exercises WHERE seen_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
