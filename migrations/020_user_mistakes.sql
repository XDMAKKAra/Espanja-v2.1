-- ============================================================
-- Mistake taxonomy — track exactly what the user struggles with
-- ============================================================

CREATE TABLE IF NOT EXISTS user_mistakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topics TEXT[] NOT NULL,                -- 1-3 topic tags: ['subjunctive','ojala_expression']
  exercise_type TEXT,                    -- 'multichoice', 'gap_fill', 'translate_mini', etc.
  level TEXT,                            -- 'I','A','B','C','M','E','L'
  question TEXT,                         -- The question text (for context)
  wrong_answer TEXT,                     -- What the user answered
  correct_answer TEXT,                   -- The correct answer
  explanation TEXT,                      -- Brief explanation
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for weekly aggregation
CREATE INDEX IF NOT EXISTS idx_mistakes_user_recent
  ON user_mistakes (user_id, created_at DESC);

-- GIN index for topic array searches
CREATE INDEX IF NOT EXISTS idx_mistakes_topics
  ON user_mistakes USING GIN (topics);

ALTER TABLE user_mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mistakes"
  ON user_mistakes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mistakes"
  ON user_mistakes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mistakes"
  ON user_mistakes FOR DELETE
  USING (auth.uid() = user_id);
