-- v260 — lock down password_resets RLS
--
-- The previous policy used USING(true) WITH CHECK(true) FOR ALL, meaning
-- anon and authenticated roles (anyone with the publishable key) could
-- SELECT every active reset token via the Data API → vault-of-passwords.
--
-- This migration replaces it with a deny-all policy for anon/authenticated.
-- The backend uses service-role, which bypasses RLS, so password reset
-- flows in routes/auth.js are unaffected.

DROP POLICY IF EXISTS password_resets_all ON public.password_resets;

CREATE POLICY password_resets_deny_all ON public.password_resets
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
