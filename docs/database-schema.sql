-- =============================================
-- BOSY.BG Admin Panel — Database Schema (Supabase)
-- =============================================

-- Роли и потребители
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Продукти
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

-- Клиенти
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

-- Поръчки
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_id UUID REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
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

-- Маркетинг кеш — Meta Ads (обновява се на 5 мин)
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
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Маркетинг кеш — Klaviyo (обновява се на 5 мин)
CREATE TABLE klaviyo_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Съдържание на сайта
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

-- Speedy пратки
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

-- =============================================
-- RLS Политики
-- =============================================
-- staff:   SELECT на orders, customers, shipments
-- manager: FULL на всичко БЕЗ users таблицата
-- admin:   FULL на всичко
