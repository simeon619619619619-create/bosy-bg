import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Stock management — намалява products.stock_quantity при потвърдена
 * (платена/COD) поръчка и възстановява при отказ.
 *
 * Read-then-write подход — race window е малък за нашия traffic; ако се
 * наложи atomic, добави decrement_product_stock() RPC от
 * supabase/migrations/007_stock_management.sql и пренапиши тези helpers
 * да викат rpc вместо update.
 *
 * Маркер: добавяме `[STOCK-DEC]` в notes след успешен decrement, за да
 * знаем при cancel дали трябва да възстановим (никога двойно).
 */

interface OrderItemLite {
  id: string
  quantity: number
}

const STOCK_DEC_TAG = '[STOCK-DEC]'

export async function decrementOrderStock(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  const { data: order } = await supabase
    .from('orders')
    .select('items, notes')
    .eq('id', orderId)
    .single()

  if (!order) return
  const notes = (order.notes as string) ?? ''
  if (notes.includes(STOCK_DEC_TAG)) return // already decremented, idempotent

  const items = (Array.isArray(order.items) ? order.items : []) as OrderItemLite[]
  if (items.length === 0) return

  const productIds = items.map((i) => i.id).filter(Boolean)
  if (productIds.length === 0) return

  const { data: products } = await supabase
    .from('products')
    .select('id, stock_quantity')
    .in('id', productIds)

  if (!products) return

  for (const item of items) {
    const product = products.find((p) => p.id === item.id)
    if (!product) continue
    const current = Number(product.stock_quantity ?? 0)
    const next = Math.max(0, current - Number(item.quantity ?? 0))
    if (next === current) continue
    await supabase
      .from('products')
      .update({ stock_quantity: next, updated_at: new Date().toISOString() })
      .eq('id', item.id)
  }

  const newNotes = notes ? `${notes} ${STOCK_DEC_TAG}` : STOCK_DEC_TAG
  await supabase.from('orders').update({ notes: newNotes }).eq('id', orderId)
}

export async function restoreOrderStock(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  const { data: order } = await supabase
    .from('orders')
    .select('items, notes')
    .eq('id', orderId)
    .single()

  if (!order) return
  const notes = (order.notes as string) ?? ''
  if (!notes.includes(STOCK_DEC_TAG)) return // no decrement happened, nothing to restore

  const items = (Array.isArray(order.items) ? order.items : []) as OrderItemLite[]
  if (items.length === 0) return

  const productIds = items.map((i) => i.id).filter(Boolean)
  if (productIds.length === 0) return

  const { data: products } = await supabase
    .from('products')
    .select('id, stock_quantity')
    .in('id', productIds)

  if (!products) return

  for (const item of items) {
    const product = products.find((p) => p.id === item.id)
    if (!product) continue
    const current = Number(product.stock_quantity ?? 0)
    const next = current + Number(item.quantity ?? 0)
    await supabase
      .from('products')
      .update({ stock_quantity: next, updated_at: new Date().toISOString() })
      .eq('id', item.id)
  }

  const newNotes = notes.replace(STOCK_DEC_TAG, '').replace(/\s+/g, ' ').trim()
  await supabase.from('orders').update({ notes: newNotes }).eq('id', orderId)
}
