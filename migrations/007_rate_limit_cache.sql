-- ============================================================
-- Supabase-backed AI cache + rate limiting for serverless
-- ============================================================

-- AI response cache (replaces in-memory Map)
CREATE TABLE IF NOT EXISTS ai_cache (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache (expires_at);

-- Rate limit buckets (sliding window counters)
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_expires ON rate_limit_buckets (window_start);

-- Cleanup function: remove expired cache + old rate limit windows
CREATE OR REPLACE FUNCTION cleanup_expired_rows()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_cache WHERE expires_at < now();
  DELETE FROM rate_limit_buckets WHERE window_start < now() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Schedule cleanup every 10 minutes (requires pg_cron extension)
-- Run this separately if pg_cron is enabled:
-- SELECT cron.schedule('cleanup-expired', '*/10 * * * *', 'SELECT cleanup_expired_rows()');
