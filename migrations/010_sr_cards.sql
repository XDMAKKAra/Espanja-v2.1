-- SM-2 spaced repetition cards
CREATE TABLE IF NOT EXISTS sr_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  question TEXT,
  language TEXT NOT NULL DEFAULT 'spanish',
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 0,
  repetitions INT NOT NULL DEFAULT 0,
  next_review DATE NOT NULL DEFAULT CURRENT_DATE,
  last_grade INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, word, language)
);

CREATE INDEX IF NOT EXISTS idx_sr_cards_due ON sr_cards (user_id, language, next_review);
ALTER TABLE sr_cards ENABLE ROW LEVEL SECURITY;
