-- ============================================================
-- Full database setup for Kielio
-- Run this in Supabase SQL Editor for a fresh project
-- ============================================================

-- 1. Exercise logs
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  level TEXT,
  score_correct INT,
  score_total INT,
  ytl_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_user ON exercise_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_mode ON exercise_logs (user_id, mode);

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free',
  ls_customer_id TEXT,
  ls_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_ls_customer ON subscriptions (ls_customer_id);

-- 3. Password resets
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets (email);

-- 4. Email preferences
CREATE TABLE IF NOT EXISTS email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  weekly_progress BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Email verifications
CREATE TABLE IF NOT EXISTS email_verifications (
  email TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications (token);

-- 6. RLS policies - allow service_role full access (API uses service_role key)
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically, so no policies needed for API access
