-- v250 (Bug 2 follow-up) — RLS policies for the remaining advisor-flagged
-- tables. Same root cause as v249: the backend's sb_secret_* API key maps
-- to auth.role() = 'authenticated' (with the last user's JWT leaked via
-- supabase.auth.getUser()), NOT to service_role. Tables with RLS enabled
-- but zero policies silently returned 0 rows on every backend query.
--
-- Empirical evidence (probe via debug RPC, then a one-shot count probe
-- with the user's JWT for testpro123 on 2026-05-21):
--   ai_cache               count=0   (DB had 12)
--   curriculum_kurssit     count=0   (DB had 8)
--   curriculum_lessons     count=0   (DB had 90)
--   email_verifications    count=0
--   password_resets        count=0   (DB had 1)
--   rate_limit_buckets     count=0
--   stripe_events          count=0
--   teaching_pages         count=0   (DB had 4)
--   waitlist               count=0
--
-- Side effects this was causing:
--   - AI cache misses → unnecessary OpenAI calls
--   - Rate limiting broken (counters always 0)
--   - Stripe webhook events potentially double-processed
--   - email_verifications + password_resets writes silently failing
--   - curriculum_kurssit reads fell back to static LANG_CURRICULA in
--     code, accidentally masking the bug
--
-- KNOWN ARCHITECTURAL TRADEOFF: the proper long-term fix is either
--   (a) provision a true service_role JWT key in env, or
--   (b) restructure the backend supabase client to not leak auth state
--       between requests (per-request client, or explicit session reset).
-- Both are out of scope for this migration. The policies below match the
-- access patterns the current architecture produces. Defense-in-depth is
-- the Express routes — the frontend has no Supabase API key configured,
-- so PostgREST is only reachable via backend code.
--
-- The Supabase advisor will flag ai_cache_all / email_verifications_all /
-- password_resets_all / rate_limit_buckets_all / stripe_events_all /
-- waitlist_all as `rls_policy_always_true` (WARN). Accepted tradeoff
-- until the service_role refactor lands.

-- ── Public catalog tables: anyone can read, no one writes via API ─────────
CREATE POLICY curriculum_kurssit_select_all  ON public.curriculum_kurssit  FOR SELECT USING (true);
CREATE POLICY curriculum_lessons_select_all  ON public.curriculum_lessons  FOR SELECT USING (true);
CREATE POLICY teaching_pages_select_all      ON public.teaching_pages      FOR SELECT USING (true);

-- ── Backend-managed counter / cache / idempotency tables ─────────────────
CREATE POLICY ai_cache_all              ON public.ai_cache              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY rate_limit_buckets_all    ON public.rate_limit_buckets    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY stripe_events_all         ON public.stripe_events         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY waitlist_all              ON public.waitlist              FOR ALL USING (true) WITH CHECK (true);

-- ── Token tables for anonymous flows (signup verify, forgot password) ────
-- Tokens are unguessable server-generated secrets.
CREATE POLICY email_verifications_all   ON public.email_verifications   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY password_resets_all       ON public.password_resets       FOR ALL USING (true) WITH CHECK (true);

-- Cleanup: drop the temporary debug RPC used to confirm the auth role.
DROP FUNCTION IF EXISTS public.debug_auth_context();
