-- Adaptive level progression (per user, per mode)
CREATE TABLE IF NOT EXISTS user_level_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  current_level TEXT NOT NULL DEFAULT 'B',
  level_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  questions_at_level INT NOT NULL DEFAULT 0,
  mastery_test_eligible_at TIMESTAMPTZ,
  last_demotion_at TIMESTAMPTZ,
  adaptive_enabled BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, mode)
);

CREATE TABLE IF NOT EXISTS mastery_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  from_level TEXT NOT NULL,
  to_level TEXT NOT NULL,
  score_pct NUMERIC NOT NULL,
  higher_level_score_pct NUMERIC NOT NULL,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ulp_user ON user_level_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_mta_user ON mastery_test_attempts (user_id, mode);

ALTER TABLE user_level_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_test_attempts ENABLE ROW LEVEL SECURITY;
