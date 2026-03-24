-- ============================================================
-- BOSY.BG Admin Panel — Initial Database Schema
-- Migration 001: Tables, Triggers, RLS Policies
-- ============================================================

-- =========================
-- 1. TABLES
-- =========================

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_price NUMERIC(10,2),
  category TEXT,
  images JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address JSONB DEFAULT '{}',
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_id UUID REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  speedy_tracking_number TEXT,
  speedy_parcel_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meta Ads Cache
CREATE TABLE meta_ads_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  status TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend NUMERIC(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  date DATE NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Klaviyo Cache
CREATE TABLE klaviyo_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Content Blocks
CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('banner', 'blog', 'review')),
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shipments
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  parcel_id TEXT,
  tracking_number TEXT,
  status TEXT,
  status_history JSONB DEFAULT '[]',
  label_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- 2. TRIGGERS
-- =========================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_content_blocks_updated_at
  BEFORE UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =========================
-- 3. ROW LEVEL SECURITY
-- =========================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE klaviyo_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------
-- Admin policies: ALL on every table
-- ---------------------------------------------------------
CREATE POLICY admin_all_users ON users
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY admin_all_products ON products
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY admin_all_customers ON customers
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY admin_all_orders ON orders
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY admin_all_meta_ads_cache ON meta_ads_cache
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY admin_all_klaviyo_cache ON klaviyo_cache
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY admin_all_content_blocks ON content_blocks
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY admin_all_shipments ON shipments
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ---------------------------------------------------------
-- Manager policies: ALL on everything EXCEPT users
-- ---------------------------------------------------------
CREATE POLICY manager_all_products ON products
  FOR ALL USING (get_user_role() = 'manager')
  WITH CHECK (get_user_role() = 'manager');

CREATE POLICY manager_all_customers ON customers
  FOR ALL USING (get_user_role() = 'manager')
  WITH CHECK (get_user_role() = 'manager');

CREATE POLICY manager_all_orders ON orders
  FOR ALL USING (get_user_role() = 'manager')
  WITH CHECK (get_user_role() = 'manager');

CREATE POLICY manager_all_meta_ads_cache ON meta_ads_cache
  FOR ALL USING (get_user_role() = 'manager')
  WITH CHECK (get_user_role() = 'manager');

CREATE POLICY manager_all_klaviyo_cache ON klaviyo_cache
  FOR ALL USING (get_user_role() = 'manager')
  WITH CHECK (get_user_role() = 'manager');

CREATE POLICY manager_all_content_blocks ON content_blocks
  FOR ALL USING (get_user_role() = 'manager')
  WITH CHECK (get_user_role() = 'manager');

CREATE POLICY manager_all_shipments ON shipments
  FOR ALL USING (get_user_role() = 'manager')
  WITH CHECK (get_user_role() = 'manager');

-- ---------------------------------------------------------
-- Staff policies: SELECT only on orders, customers, shipments
-- ---------------------------------------------------------
CREATE POLICY staff_select_orders ON orders
  FOR SELECT USING (get_user_role() = 'staff');

CREATE POLICY staff_select_customers ON customers
  FOR SELECT USING (get_user_role() = 'staff');

CREATE POLICY staff_select_shipments ON shipments
  FOR SELECT USING (get_user_role() = 'staff');

-- ---------------------------------------------------------
-- Service role bypass policies (for cron jobs / server-side)
-- ---------------------------------------------------------
CREATE POLICY service_role_all_meta_ads_cache ON meta_ads_cache
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all_klaviyo_cache ON klaviyo_cache
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all_shipments ON shipments
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY service_role_all_orders ON orders
  FOR ALL USING (true)
  WITH CHECK (true);
