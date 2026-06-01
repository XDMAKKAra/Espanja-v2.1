-- L-V340 finding #1: rate-limit burst counting was broken.
--
-- middleware/rateLimit.js upserted {count:1} with onConflict (key,window_start),
-- which on conflict OVERWROTE count back to 1 instead of incrementing, and the
-- increment_rate_limit RPC it tried to call did not exist anywhere. Net effect:
-- per-minute buckets never accumulated, so a concentrated burst (many requests
-- in the same minute) was never counted and the limit was effectively never
-- enforced. Load test: 62,137 requests from one user, max=10/h, 0 blocked.
--
-- This function does the real atomic increment in a single round-trip and
-- returns the sliding-window total. Applied to prod via MCP apply_migration
-- 2026-06-01 (rate_limit_atomic_increment).
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key text,
  p_window_ms bigint
)
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''  -- advisor function_search_path_mutable; refs are schema-qualified
AS $$
DECLARE
  v_bucket timestamptz := date_trunc('minute', now());
  v_total  integer;
BEGIN
  INSERT INTO public.rate_limit_buckets (key, window_start, count)
  VALUES (p_key, v_bucket, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = public.rate_limit_buckets.count + 1;

  SELECT COALESCE(SUM(count), 0) INTO v_total
  FROM public.rate_limit_buckets
  WHERE key = p_key
    AND window_start >= now() - make_interval(secs => p_window_ms::numeric / 1000.0);

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_rate_limit(text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(text, bigint) TO service_role;
