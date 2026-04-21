-- BoxNow shipping columns on orders (mirrors Econt/Speedy pattern)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS boxnow_tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS boxnow_parcel_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS boxnow_label_url TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_boxnow_tracking
  ON orders (boxnow_tracking_number)
  WHERE boxnow_tracking_number IS NOT NULL;
