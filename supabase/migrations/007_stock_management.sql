-- Atomic stock decrement RPC.
-- Returns the new stock_quantity after subtraction (or NULL if product not found).
-- Atomic to avoid race conditions when multiple orders hit at the same time.
create or replace function decrement_product_stock(p_id uuid, p_qty int)
returns int
language plpgsql
security definer
as $$
declare
  new_qty int;
begin
  update products
  set stock_quantity = greatest(0, coalesce(stock_quantity, 0) - p_qty),
      updated_at = now()
  where id = p_id
  returning stock_quantity into new_qty;
  return new_qty;
end;
$$;

-- Atomic stock increment (for cancel / refund).
create or replace function increment_product_stock(p_id uuid, p_qty int)
returns int
language plpgsql
security definer
as $$
declare
  new_qty int;
begin
  update products
  set stock_quantity = coalesce(stock_quantity, 0) + p_qty,
      updated_at = now()
  where id = p_id
  returning stock_quantity into new_qty;
  return new_qty;
end;
$$;

-- Track when stock has already been decremented for an order, so cancel/refund
-- can revert correctly and we never decrement twice.
alter table orders
  add column if not exists stock_decremented_at timestamptz;

grant execute on function decrement_product_stock(uuid, int) to service_role, anon, authenticated;
grant execute on function increment_product_stock(uuid, int) to service_role, anon, authenticated;
