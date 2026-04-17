-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_password_resets_token ON password_resets (token);
CREATE INDEX idx_password_resets_email ON password_resets (email);

-- Email preferences (per user opt-in/out)
CREATE TABLE IF NOT EXISTS email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  weekly_progress BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-cleanup expired reset tokens (run periodically or via cron)
-- DELETE FROM password_resets WHERE expires_at < now();
