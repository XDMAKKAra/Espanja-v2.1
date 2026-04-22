-- Pass 4 Commit 11 — add Pass 4 lifecycle email categories to preferences.
-- Defaults to true so existing users receive the drip; users opt out per
-- category via /app.html?unsubscribe=<category>&token=<signed>.

ALTER TABLE email_preferences
  ADD COLUMN IF NOT EXISTS d1_weakness     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS d7_offer        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS exam_countdown  BOOLEAN NOT NULL DEFAULT true;
