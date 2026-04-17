-- ============================================================
-- Diagnostic / placement test results (audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS diagnostic_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  placement_level TEXT NOT NULL,
  chosen_level TEXT NOT NULL,        -- what user actually chose (may differ)
  total_correct INT NOT NULL,
  total_questions INT NOT NULL,
  score_by_level JSONB NOT NULL,     -- {"A":{correct:2,total:2,pct:100},...}
  question_ids TEXT[],               -- which questions were used
  is_retake BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_user
  ON diagnostic_results (user_id, created_at DESC);

ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own diagnostics"
  ON diagnostic_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnostics"
  ON diagnostic_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
