-- L-V293-ONBOARDING-DIAGNOSTIC-1a: diagnostic onboarding tables.
-- Applied to remote via mcp__claude_ai_Supabase__apply_migration on 2026-05-23.
--
-- Two tables:
--   1. user_onboarding_diagnostic — ONE row per (user, language). Final result
--      of the mini-YO + multi-select + biography flow. Filled by L-V294 reasoner
--      with `inferred_skill_profile` after all steps complete.
--   2. mini_yo_progress — per-question answers for the diagnostic test.
--      Supports pause-resume: user closes tab, returns, test continues where
--      they left off. UPSERT pattern (latest answer per question wins) so
--      retries replace previous answers cleanly.

-- ─── 1. Diagnostic result table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_onboarding_diagnostic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (language IN ('es', 'de', 'fr')),
  mini_yo_status text NOT NULL DEFAULT 'in_progress'
    CHECK (mini_yo_status IN ('in_progress', 'completed', 'partial', 'skipped')),
  mini_yo_part_a_scores jsonb,
  mini_yo_part_b_score numeric,
  mini_yo_part_c_writing jsonb,
  courses_completed integer[] NOT NULL DEFAULT '{}',
  course_grades jsonb NOT NULL DEFAULT '{}'::jsonb,
  biography jsonb NOT NULL DEFAULT '{}'::jsonb,
  textbook_key text,
  inferred_skill_profile jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, language)
);

CREATE INDEX IF NOT EXISTS user_onboarding_diagnostic_user_idx
  ON user_onboarding_diagnostic (user_id);

-- Auto-bump updated_at on UPDATE.
CREATE OR REPLACE FUNCTION set_user_onboarding_diagnostic_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_onboarding_diagnostic_updated_at
  ON user_onboarding_diagnostic;
CREATE TRIGGER user_onboarding_diagnostic_updated_at
  BEFORE UPDATE ON user_onboarding_diagnostic
  FOR EACH ROW EXECUTE FUNCTION set_user_onboarding_diagnostic_updated_at();

-- ─── 2. Per-question progress table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mini_yo_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (language IN ('es', 'de', 'fr')),
  part text NOT NULL CHECK (part IN ('a_grammar', 'b_reading', 'c_writing')),
  question_index integer NOT NULL,
  question_id text NOT NULL,
  user_answer jsonb,
  is_correct boolean,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, language, part, question_index)
);

CREATE INDEX IF NOT EXISTS mini_yo_progress_user_lang_part_idx
  ON mini_yo_progress (user_id, language, part);

-- ─── 3. Row-Level Security ───────────────────────────────────────────────────

ALTER TABLE user_onboarding_diagnostic ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_yo_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own diagnostic"
  ON user_onboarding_diagnostic FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "users insert own diagnostic"
  ON user_onboarding_diagnostic FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "users update own diagnostic"
  ON user_onboarding_diagnostic FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "users select own progress"
  ON mini_yo_progress FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "users insert own progress"
  ON mini_yo_progress FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "users update own progress"
  ON mini_yo_progress FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "users delete own progress"
  ON mini_yo_progress FOR DELETE
  USING ((SELECT auth.uid()) = user_id);
