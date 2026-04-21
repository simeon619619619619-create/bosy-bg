-- Order shipping address snapshot + separated notes
-- Reason: customers.address is overwritten on every new order (historical addresses lost).
-- Customer note was merged into a tag-prefixed notes column, making admin UI unreadable.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_note TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Backfill shipping_address from the linked customer (best-effort snapshot)
UPDATE orders o
SET shipping_address = c.address
FROM customers c
WHERE o.customer_id = c.id
  AND o.shipping_address IS NULL
  AND c.address IS NOT NULL;

-- Backfill customer_note by stripping leading [TAG] prefixes from notes
-- (e.g. "[COD] [PROMO:X] Hello" -> "Hello")
UPDATE orders
SET customer_note = NULLIF(TRIM(REGEXP_REPLACE(notes, '^(\[[A-Z0-9:_-]+\]\s*)+', '')), '')
WHERE customer_note IS NULL
  AND notes IS NOT NULL
  AND notes <> '';

-- Backfill courier default for any pending/confirmed orders without one
UPDATE orders SET courier = 'speedy'
WHERE courier IS NULL AND status IN ('pending', 'confirmed');
