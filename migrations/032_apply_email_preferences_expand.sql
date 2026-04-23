-- ============================================================
-- Pass 5 Phase 2 · Migration 032
-- Replays migration 028. See db/AUDIT.md §1.5.
-- Adds Pass 4 drip category columns so unsubscribe flips persist.
-- ============================================================

ALTER TABLE public.email_preferences
  ADD COLUMN IF NOT EXISTS d1_weakness     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS d7_offer        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS exam_countdown  BOOLEAN NOT NULL DEFAULT true;
