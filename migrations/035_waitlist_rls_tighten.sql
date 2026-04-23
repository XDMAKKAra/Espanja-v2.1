-- ============================================================
-- Pass 5 Phase 2 · Migration 035
-- Replaces the overly-permissive `USING (true) WITH CHECK (true) FOR ALL`
-- policy on public.waitlist (db/AUDIT.md §2.2). The existing policy
-- lets any anon-key holder read or rewrite the entire waitlist.
--
-- Server inserts waitlist rows via service_role (routes/waitlist.js or
-- the landing-page handler), so stripping public access is safe.
-- ============================================================

DROP POLICY IF EXISTS "Service role full access" ON public.waitlist;

-- Anon / authenticated: NO read or modify access. Writes happen
-- server-side via service_role which bypasses RLS. If anon-key-direct
-- waitlist signup is ever added, replace this with a narrow
-- FOR INSERT TO anon WITH CHECK (email IS NOT NULL AND length(email) < 255).
