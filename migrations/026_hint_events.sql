-- Gate C1: hint ladder event log

CREATE TABLE IF NOT EXISTS hint_events (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  item_id       TEXT NOT NULL,
  exercise_type TEXT NOT NULL,
  hint_step     INTEGER NOT NULL,
  attempt_number INTEGER,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hint_events_user
  ON hint_events (user_id, created_at);

ALTER TABLE hint_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY hint_events_own ON hint_events
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
