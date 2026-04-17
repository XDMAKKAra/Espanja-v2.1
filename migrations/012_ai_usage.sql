-- AI usage tracking for cost monitoring
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON ai_usage (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_month ON ai_usage (created_at);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
