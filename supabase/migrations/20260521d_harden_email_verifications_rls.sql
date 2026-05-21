-- v261 — lock down email_verifications RLS
--
-- Same pattern as v260 (password_resets). Previous USING(true) policy
-- exposed every active verification token to anon via the Data API.
-- Backend uses service-role so the verify flow in routes/auth.js is
-- unaffected.

DROP POLICY IF EXISTS email_verifications_all ON public.email_verifications;

CREATE POLICY email_verifications_deny_all ON public.email_verifications
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
