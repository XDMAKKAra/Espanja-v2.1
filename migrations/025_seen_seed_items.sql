-- Gate B2: track which seed-bank items a user has seen (deduplication)

CREATE TABLE IF NOT EXISTS seen_seed_items (
  user_id   UUID  NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  item_id   TEXT  NOT NULL,
  seen_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_seen_seed_user_seen
  ON seen_seed_items (user_id, seen_at);

ALTER TABLE seen_seed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY seen_seed_items_own ON seen_seed_items
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Extend cleanup function to purge records > 30 days old
CREATE OR REPLACE FUNCTION cleanup_expired_rows()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_cache         WHERE expires_at < now();
  DELETE FROM seen_seed_items  WHERE seen_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
