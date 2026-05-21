-- v262 (follow-up) — narrow waitlist anon-INSERT WITH CHECK so the
-- advisor no longer flags it as "always true". Validates that email +
-- product columns are non-empty, sane length, and email looks email-like.
-- The table already has NOT NULL constraints, so this is defense in depth.

DROP POLICY IF EXISTS waitlist_anon_insert ON public.waitlist;
CREATE POLICY waitlist_anon_insert ON public.waitlist
  FOR INSERT TO anon
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) BETWEEN 3 AND 254
    AND email LIKE '%@%'
    AND product IS NOT NULL
    AND length(trim(product)) BETWEEN 1 AND 64
  );
