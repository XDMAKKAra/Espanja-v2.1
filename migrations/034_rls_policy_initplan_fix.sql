-- ============================================================
-- Pass 5 Phase 2 · Migration 034
-- Rewrites 18 existing policies to wrap auth.uid() in a subquery so
-- Postgres evaluates it once per statement instead of once per row
-- (db/AUDIT.md §3.1 / supabase linter 0003_auth_rls_initplan).
-- Policy semantics unchanged.
-- ============================================================

-- exam_sessions
DROP POLICY IF EXISTS "Users can view own exam sessions"   ON public.exam_sessions;
CREATE POLICY "Users can view own exam sessions" ON public.exam_sessions
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own exam sessions" ON public.exam_sessions;
CREATE POLICY "Users can insert own exam sessions" ON public.exam_sessions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own exam sessions" ON public.exam_sessions;
CREATE POLICY "Users can update own exam sessions" ON public.exam_sessions
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- user_profile
DROP POLICY IF EXISTS "Users can read own profile"   ON public.user_profile;
CREATE POLICY "Users can read own profile" ON public.user_profile
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profile;
CREATE POLICY "Users can insert own profile" ON public.user_profile
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profile;
CREATE POLICY "Users can update own profile" ON public.user_profile
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- diagnostic_results
DROP POLICY IF EXISTS "Users can read own diagnostics"   ON public.diagnostic_results;
CREATE POLICY "Users can read own diagnostics" ON public.diagnostic_results
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own diagnostics" ON public.diagnostic_results;
CREATE POLICY "Users can insert own diagnostics" ON public.diagnostic_results
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- user_level
DROP POLICY IF EXISTS "Users can read own level"   ON public.user_level;
CREATE POLICY "Users can read own level" ON public.user_level
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own level" ON public.user_level;
CREATE POLICY "Users can insert own level" ON public.user_level
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own level" ON public.user_level;
CREATE POLICY "Users can update own level" ON public.user_level
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- user_session_state
DROP POLICY IF EXISTS "Users can manage own session state" ON public.user_session_state;
CREATE POLICY "Users can manage own session state" ON public.user_session_state
  FOR ALL USING      ((select auth.uid()) = user_id)
          WITH CHECK ((select auth.uid()) = user_id);

-- user_mistakes
DROP POLICY IF EXISTS "Users can read own mistakes"   ON public.user_mistakes;
CREATE POLICY "Users can read own mistakes" ON public.user_mistakes
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own mistakes" ON public.user_mistakes;
CREATE POLICY "Users can insert own mistakes" ON public.user_mistakes
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own mistakes" ON public.user_mistakes;
CREATE POLICY "Users can delete own mistakes" ON public.user_mistakes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- seen_seed_items
DROP POLICY IF EXISTS seen_seed_items_own ON public.seen_seed_items;
CREATE POLICY seen_seed_items_own ON public.seen_seed_items
  FOR ALL USING      ((select auth.uid()) = user_id)
          WITH CHECK ((select auth.uid()) = user_id);

-- hint_events
DROP POLICY IF EXISTS hint_events_own ON public.hint_events;
CREATE POLICY hint_events_own ON public.hint_events
  FOR ALL USING      ((select auth.uid()) = user_id)
          WITH CHECK ((select auth.uid()) = user_id);
