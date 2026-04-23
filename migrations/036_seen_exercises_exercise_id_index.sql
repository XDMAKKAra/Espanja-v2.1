-- ============================================================
-- Pass 5 Phase 2 · Migration 036
-- Adds the missing FK covering index on seen_exercises.exercise_id
-- (db/AUDIT.md §3.2 / supabase linter 0001_unindexed_foreign_keys).
-- The PK is (user_id, exercise_id) so lookups by exercise_id alone
-- — e.g. when cleaning up bank rows — currently seq-scan.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_seen_exercises_exercise
  ON public.seen_exercises (exercise_id);
