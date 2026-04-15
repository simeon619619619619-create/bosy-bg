-- Add Econt courier support + generic courier column on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS econt_tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS econt_parcel_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS econt_label_url TEXT;

-- Backfill existing shipped orders to 'speedy' (historical data)
UPDATE orders SET courier = 'speedy'
WHERE courier IS NULL AND speedy_tracking_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_courier_idx ON orders(courier);
CREATE INDEX IF NOT EXISTS orders_status_courier_idx ON orders(status, courier);
