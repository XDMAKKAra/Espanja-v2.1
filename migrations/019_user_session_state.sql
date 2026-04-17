-- ============================================================
-- Session-internal scaffolding state (resets per session)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_session_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,                     -- 'vocab', 'grammar', 'ser_estar', etc.
  scaffold_level INT NOT NULL DEFAULT 2,   -- 0 (no help) – 3 (full scaffolding)
  correct_streak INT DEFAULT 0,
  wrong_streak INT DEFAULT 0,
  session_start TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_session_state_user
  ON user_session_state (user_id);

ALTER TABLE user_session_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own session state"
  ON user_session_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
