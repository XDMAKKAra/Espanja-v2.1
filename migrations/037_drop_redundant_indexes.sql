-- ============================================================
-- Pass 5 Phase 2 · Migration 037
-- Drops btree indexes that duplicate the unique-constraint indexes
-- already covering the same column (db/AUDIT.md §Dead columns /
-- redundant indexes). UNIQUE constraints are themselves btree
-- indexes — the separate idx_* entries are wasted inserts/space.
-- ============================================================

DROP INDEX IF EXISTS public.idx_password_resets_token;
DROP INDEX IF EXISTS public.idx_password_resets_email;
DROP INDEX IF EXISTS public.idx_email_verifications_token;
