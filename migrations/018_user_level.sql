-- ============================================================
-- Persistent user level (slow-moving mastery indicator)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_level (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level TEXT NOT NULL DEFAULT 'B',
  level_since TIMESTAMPTZ DEFAULT now(),
  rolling_accuracy_30d REAL DEFAULT 0,       -- 0.0–1.0
  rolling_sessions_30d INT DEFAULT 0,
  last_checkpoint_at TIMESTAMPTZ,
  checkpoint_passed BOOLEAN DEFAULT false,
  level_down_warned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_level ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own level"
  ON user_level FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own level"
  ON user_level FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own level"
  ON user_level FOR INSERT
  WITH CHECK (auth.uid() = user_id);
