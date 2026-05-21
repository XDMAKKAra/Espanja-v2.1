-- v262 — lock down internal tables; narrow waitlist to anon-INSERT-only.
--
-- ai_cache, rate_limit_buckets, stripe_events: all backend-internal, no
-- legitimate anon/authenticated access. Deny all.
--
-- waitlist: anon must keep INSERT (the landing form posts here). Block
-- SELECT/UPDATE/DELETE so the list can't be enumerated. Service-role
-- bypasses RLS for admin reads.

-- ai_cache
DROP POLICY IF EXISTS ai_cache_all ON public.ai_cache;
CREATE POLICY ai_cache_deny_all ON public.ai_cache
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- rate_limit_buckets
DROP POLICY IF EXISTS rate_limit_buckets_all ON public.rate_limit_buckets;
CREATE POLICY rate_limit_buckets_deny_all ON public.rate_limit_buckets
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- stripe_events
DROP POLICY IF EXISTS stripe_events_all ON public.stripe_events;
CREATE POLICY stripe_events_deny_all ON public.stripe_events
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- waitlist
DROP POLICY IF EXISTS waitlist_all ON public.waitlist;
CREATE POLICY waitlist_anon_insert ON public.waitlist
  FOR INSERT TO anon WITH CHECK (true);
