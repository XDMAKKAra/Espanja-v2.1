-- ============================================================
-- Pass 5 Phase 2 · Migration 031
-- Replays migration 027. See db/AUDIT.md §1.4.
-- Adds reading_pieces_consumed to user_profile so the Pass 4 Commit 8
-- reading soft→hard gate actually trips at piece #3 for free users.
-- ============================================================

ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS reading_pieces_consumed INT NOT NULL DEFAULT 0;
