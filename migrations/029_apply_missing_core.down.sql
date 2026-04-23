-- Rollback for 029_apply_missing_core.sql.
-- Use with caution — dropping rate_limit_buckets on a running server
-- re-creates the SEV-1 "rate limits fail open" state from db/AUDIT.md.

DROP FUNCTION IF EXISTS public.cleanup_expired_rows();
DROP INDEX    IF EXISTS public.idx_rate_limit_window;
DROP TABLE    IF EXISTS public.rate_limit_buckets;
DROP INDEX    IF EXISTS public.idx_ai_cache_expires;
DROP TABLE    IF EXISTS public.ai_cache;
