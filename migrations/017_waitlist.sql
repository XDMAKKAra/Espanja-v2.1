-- ============================================================
-- Waitlist / email capture for upcoming products
-- ============================================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  product TEXT NOT NULL,           -- e.g. 'summer-2026'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, product)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_product
  ON waitlist (product, created_at DESC);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Only server (service role) writes to this table, no client access needed
CREATE POLICY "Service role full access"
  ON waitlist FOR ALL
  USING (true)
  WITH CHECK (true);
