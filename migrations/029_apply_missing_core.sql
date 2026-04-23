-- ============================================================
-- Pass 5 Phase 2 · Migration 029
-- Replays migration 007 idempotently: the ai_cache + rate_limit_buckets
-- tables plus the cleanup_expired_rows() function were never applied
-- to the live DB. Without them, lib/openai.js has no prod cache (every
-- hit falls back to per-invocation memory on Vercel) and every limiter
-- in middleware/rateLimit.js fails open. See db/AUDIT.md §1.1, §1.2.
-- ============================================================

-- AI response cache (used by lib/openai.js dbGetCached / dbSetCache).
CREATE TABLE IF NOT EXISTS public.ai_cache (
  key        TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_expires
  ON public.ai_cache (expires_at);

-- Rate-limit buckets (used by middleware/rateLimit.js supabaseRateLimit).
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key          TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count        INT NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_window
  ON public.rate_limit_buckets (window_start);

-- RLS. Both tables are server-only (writes via service_role key); no
-- policies are needed — RLS-enabled-no-policy denies all non-bypass roles,
-- which is the correct posture for these.
ALTER TABLE public.ai_cache            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets  ENABLE ROW LEVEL SECURITY;

-- Cleanup function. search_path pinned per Supabase linter
-- (function_search_path_mutable). Schedule separately — either via
-- pg_cron once enabled, or via Vercel cron calling a server route.
CREATE OR REPLACE FUNCTION public.cleanup_expired_rows()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.ai_cache           WHERE expires_at   < now();
  DELETE FROM public.rate_limit_buckets WHERE window_start < now() - INTERVAL '2 hours';
END;
$$;
