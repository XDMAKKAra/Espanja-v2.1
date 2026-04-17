-- Add LemonSqueezy columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS ls_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS ls_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscriptions_ls_customer ON subscriptions (ls_customer_id);
