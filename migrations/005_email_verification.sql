CREATE TABLE IF NOT EXISTS email_verifications (
  email TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications (token);
