-- ============================================================
-- Migration 002: Add Viva payment columns + promo tables
-- ============================================================

-- 1. Add missing Viva payment columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS viva_order_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS viva_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'awaiting_payment', 'paid', 'failed'));

-- 2. Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create promo_sends table (tracks which promo emails were sent)
CREATE TABLE IF NOT EXISTS promo_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  promo_code TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS for promo_codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_promo_codes ON promo_codes
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY manager_all_promo_codes ON promo_codes
  FOR ALL USING (get_user_role() = 'manager')
  WITH CHECK (get_user_role() = 'manager');

CREATE POLICY service_role_all_promo_codes ON promo_codes
  FOR ALL USING (true)
  WITH CHECK (true);

-- 5. RLS for promo_sends
ALTER TABLE promo_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_promo_sends ON promo_sends
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY service_role_all_promo_sends ON promo_sends
  FOR ALL USING (true)
  WITH CHECK (true);

-- 6. Public read on promo_codes (for checkout validation)
CREATE POLICY public_select_promo_codes ON promo_codes
  FOR SELECT USING (true);

-- 7. Public insert on promo_sends (for checkout)
CREATE POLICY public_insert_promo_sends ON promo_sends
  FOR INSERT WITH CHECK (true);

-- 8. Index for faster Viva lookups
CREATE INDEX IF NOT EXISTS idx_orders_viva_order_code ON orders(viva_order_code) WHERE viva_order_code IS NOT NULL;
