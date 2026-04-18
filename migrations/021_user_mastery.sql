-- ============================================================
-- Learning path — per-topic mastery state
-- ============================================================

CREATE TABLE IF NOT EXISTS user_mastery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_key TEXT NOT NULL,            -- 'present_regular', 'preterite', etc.
  status TEXT NOT NULL DEFAULT 'locked',  -- 'locked', 'available', 'in_progress', 'mastered'
  best_score INT DEFAULT 0,           -- best mastery test score (0-20)
  best_pct REAL DEFAULT 0,            -- best percentage (0.0-1.0)
  attempts INT DEFAULT 0,
  mastered_at TIMESTAMPTZ,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic_key)
);

CREATE INDEX IF NOT EXISTS idx_user_mastery_user
  ON user_mastery (user_id, topic_key);

ALTER TABLE user_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mastery"
  ON user_mastery FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
