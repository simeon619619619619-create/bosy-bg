import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Guard срещу промотиране на CARD поръчки до confirmed/shipped/delivered
 * преди Viva да е потвърдила плащане.
 *
 * Извиква се от:
 *  - app/admin/orders/actions.ts (setOrderStatus, confirmOrder, markShippedManually)
 *  - app/api/speedy/create-parcel/route.ts
 *  - app/api/econt/create-parcel/route.ts
 *  - app/api/boxnow/create-parcel/route.ts
 */
const SHIPPABLE_TARGETS = new Set(['confirmed', 'shipped', 'delivered'])

export class UnpaidCardOrderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnpaidCardOrderError'
  }
}

export async function assertOrderShippable(
  supabase: SupabaseClient,
  orderId: string,
  targetStatus: string
): Promise<void> {
  if (!SHIPPABLE_TARGETS.has(targetStatus)) return

  const { data: order, error } = await supabase
    .from('orders')
    .select('order_number, notes, payment_status')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    throw new Error(`Order ${orderId} не е намерена`)
  }

  const notes = (order.notes as string) ?? ''
  const isCard = notes.includes('[CARD]')
  if (!isCard) return

  const paymentStatus = (order.payment_status as string) ?? 'unpaid'
  if (paymentStatus === 'paid') return

  throw new UnpaidCardOrderError(
    `🚫 Поръчка #${order.order_number} е CARD, но не е платена във Viva (payment_status="${paymentStatus}"). Не може да се пакетира/изпраща. Свържи се с клиента за нова платежна линия или отказ.`
  )
}
