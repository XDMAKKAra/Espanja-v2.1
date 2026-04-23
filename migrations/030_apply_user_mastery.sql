-- ============================================================
-- Pass 5 Phase 2 · Migration 030
-- Replays migration 021 idempotently. Table was defined in the repo
-- but never applied to prod (see db/AUDIT.md §1.3). Policy uses
-- (select auth.uid()) up-front to avoid the initplan lint.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_mastery (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_key    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'locked',
  best_score   INT DEFAULT 0,
  best_pct     REAL DEFAULT 0,
  attempts     INT DEFAULT 0,
  mastered_at  TIMESTAMPTZ,
  unlocked_at  TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, topic_key)
);

CREATE INDEX IF NOT EXISTS idx_user_mastery_user
  ON public.user_mastery (user_id, topic_key);

ALTER TABLE public.user_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own mastery" ON public.user_mastery;
CREATE POLICY "Users can manage own mastery"
  ON public.user_mastery FOR ALL
  USING      ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
