-- ============================================================
-- Pass 5 Phase 2 · Migration 033
-- Backfill RLS policies for the 8 tables flagged
-- `rls_enabled_no_policy` (db/AUDIT.md §2.1). Server currently works
-- because SUPABASE_SERVICE_ROLE_KEY bypasses RLS — these policies are
-- defense in depth so future anon-key usage is user-isolated correctly.
--
-- Intentionally skipped (kept server-only, RLS-enabled-no-policy is
-- the right posture): email_verifications, password_resets. Both are
-- pre-auth token tables; anon must not read them.
-- ============================================================

-- ai_usage: read-own only; writes are server-side (logAiUsage).
DROP POLICY IF EXISTS ai_usage_select_own ON public.ai_usage;
CREATE POLICY ai_usage_select_own ON public.ai_usage
  FOR SELECT USING ((select auth.uid()) = user_id);

-- email_preferences: read + update own; insert handled by trigger / server.
DROP POLICY IF EXISTS email_preferences_select_own ON public.email_preferences;
CREATE POLICY email_preferences_select_own ON public.email_preferences
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS email_preferences_update_own ON public.email_preferences;
CREATE POLICY email_preferences_update_own ON public.email_preferences
  FOR UPDATE USING      ((select auth.uid()) = user_id)
             WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS email_preferences_insert_own ON public.email_preferences;
CREATE POLICY email_preferences_insert_own ON public.email_preferences
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- exercise_bank: shared content — any authenticated user can SELECT;
-- writes are server-only.
DROP POLICY IF EXISTS exercise_bank_select_all ON public.exercise_bank;
CREATE POLICY exercise_bank_select_all ON public.exercise_bank
  FOR SELECT TO authenticated USING (true);

-- exercise_logs: read + insert own.
DROP POLICY IF EXISTS exercise_logs_select_own ON public.exercise_logs;
CREATE POLICY exercise_logs_select_own ON public.exercise_logs
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS exercise_logs_insert_own ON public.exercise_logs;
CREATE POLICY exercise_logs_insert_own ON public.exercise_logs
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- push_subscriptions: full own-row management.
DROP POLICY IF EXISTS push_subscriptions_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_own ON public.push_subscriptions
  FOR ALL USING      ((select auth.uid()) = user_id)
          WITH CHECK ((select auth.uid()) = user_id);

-- seen_exercises: full own-row management.
DROP POLICY IF EXISTS seen_exercises_own ON public.seen_exercises;
CREATE POLICY seen_exercises_own ON public.seen_exercises
  FOR ALL USING      ((select auth.uid()) = user_id)
          WITH CHECK ((select auth.uid()) = user_id);

-- sr_cards: full own-row management.
DROP POLICY IF EXISTS sr_cards_own ON public.sr_cards;
CREATE POLICY sr_cards_own ON public.sr_cards
  FOR ALL USING      ((select auth.uid()) = user_id)
          WITH CHECK ((select auth.uid()) = user_id);

-- subscriptions: SELECT own only. Writes are webhook-driven (service role).
DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT USING ((select auth.uid()) = user_id);
