-- Full exam session tracking
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_mode TEXT NOT NULL DEFAULT 'demo', -- 'full' (6h) or 'demo' (2h)
  seconds_remaining INT,
  current_part INT DEFAULT 1, -- 1-4
  parts_data JSONB, -- generated questions/tasks for each part
  answers JSONB DEFAULT '{}', -- user's answers, auto-saved
  part_scores JSONB, -- scores per part after grading
  total_points INT,
  max_points INT DEFAULT 199, -- 60+40+33+66
  final_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions (user_id, status);
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exam sessions"
  ON exam_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam sessions"
  ON exam_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam sessions"
  ON exam_sessions FOR UPDATE
  USING (auth.uid() = user_id);
