'use server'

import { createClient } from '@supabase/supabase-js'
import { sendNewOrderNotification, sendEasterPromoEmail } from '@/lib/resend/client'
import { getSiteSettings } from '@/lib/settings'
import { usePromoCode } from '@/app/admin/promo-codes/actions'
import { decrementOrderStock } from '@/lib/orders/stock'

interface OrderItem {
  id: string
  name: string
  slug?: string
  price: number
  quantity: number
  image?: string | null
}

interface CreateOrderInput {
  name: string
  email: string
  phone: string
  city: string
  address: string
  postalCode: string
  notes: string
  paymentMethod: 'cod' | 'card'
  cardDiscount: number
  promoCode: string | null
  promoDiscount: number
  cashbackUsed: number
  deliveryType?: 'address' | 'office' | 'boxnow'
  speedyOfficeId?: number | null
  boxnowLockerId?: string | null
  items: OrderItem[]
}

/** Helper: extract cashback_balance from customer address JSON */
function getCashbackFromAddress(address: unknown): number {
  if (typeof address === 'object' && address !== null) {
    return Number((address as Record<string, unknown>).cashback_balance ?? 0)
  }
  return 0
}

/** Lookup cashback balance for a customer email */
export async function getCashbackPercent(): Promise<number> {
  const { cashback_percent } = await getSiteSettings()
  return cashback_percent
}

export async function lookupCashback(email: string): Promise<{ balance: number }> {
  if (!email) return { balance: 0 }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase
    .from('customers')
    .select('address')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!data) return { balance: 0 }
  return { balance: getCashbackFromAddress(data.address) }
}

function generateOrderNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `B${datePart}-${randomPart}`
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; orderNumber: string; cashbackEarned: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Calculate totals
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = subtotal >= 99.99 * 1.95583 ? 0 : 3.99 * 1.95583
  const codFee = input.paymentMethod === 'cod' ? 0.99 * 1.95583 : 0 // 0.99 EUR in BGN
  const discount = input.cardDiscount ?? 0
  const promoDiscount = input.promoDiscount ?? 0
  const cashbackUsed = Math.max(0, input.cashbackUsed ?? 0)
  const total = Math.max(0, subtotal + shippingCost + codFee - discount - promoDiscount - cashbackUsed)

  // 1. Upsert customer by email
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, total_orders, total_spent, address')
    .eq('email', input.email)
    .single()

  let customerId: string
  let currentCashback = 0

  if (existingCustomer) {
    customerId = existingCustomer.id
    currentCashback = getCashbackFromAddress(existingCustomer.address)

    // Validate: cashbackUsed cannot exceed actual balance
    if (cashbackUsed > currentCashback + 0.01) {
      throw new Error('Недостатъчен кешбак баланс')
    }

    // Update customer info (preserve cashback_balance — will update below)
    await supabase
      .from('customers')
      .update({
        name: input.name,
        phone: input.phone,
        address: {
          city: input.city,
          street: input.address,
          zip: input.postalCode,
          cashback_balance: currentCashback, // preserve for now, updated below
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: {
          city: input.city,
          street: input.address,
          zip: input.postalCode,
          cashback_balance: 0,
        },
        total_orders: 0,
        total_spent: 0,
      })
      .select('id')
      .single()

    if (customerError || !newCustomer) {
      throw new Error(customerError?.message ?? 'Failed to create customer')
    }

    customerId = newCustomer.id
  }

  // 2. Create order (order_number is SERIAL auto-increment)
  const orderItems = input.items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    price: item.price,
    quantity: item.quantity,
  }))

  // Metadata tags (payment method, promo, office/boxnow) — stored in notes for backward compat
  const noteTags = [`[${input.paymentMethod.toUpperCase()}]`]
  if (input.promoCode) noteTags.push(`[PROMO:${input.promoCode}]`)
  if (input.deliveryType === 'office' && input.speedyOfficeId) {
    noteTags.push(`[OFFICE:${input.speedyOfficeId}]`)
  }
  if (input.deliveryType === 'boxnow' && input.boxnowLockerId) {
    noteTags.push(`[BOXNOW:${input.boxnowLockerId}]`)
  }
  const fullNotes = input.notes
    ? `${noteTags.join(' ')} ${input.notes}`
    : noteTags.join(' ')

  // Courier: Econt pickup is not supported yet → default speedy; BoxNow uses Speedy API under the hood
  const courier: 'speedy' | 'econt' = 'speedy'

  // Snapshot of the shipping address at purchase time (immutable per-order, editable by admin)
  const shippingAddress = {
    name: input.name,
    phone: input.phone,
    email: input.email,
    street: input.address,
    city: input.city,
    zip: input.postalCode,
    delivery_type: input.deliveryType ?? 'address',
    speedy_office_id: input.speedyOfficeId ?? null,
    boxnow_locker_id: input.boxnowLockerId ?? null,
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      items: orderItems,
      subtotal,
      shipping_cost: shippingCost,
      total,
      status: 'pending',
      notes: fullNotes,
      customer_note: input.notes || null,
      shipping_address: shippingAddress,
      courier,
    })
    .select('id, order_number')
    .single()

  if (orderError || !order) {
    throw new Error(orderError?.message ?? 'Failed to create order')
  }

  // 3. Calculate cashback earned (5% of total paid)
  const { cashback_percent } = await getSiteSettings()
  const cashbackEarned = Math.round(total * cashback_percent) / 100
  const newCashback = Math.round((currentCashback - cashbackUsed + cashbackEarned) * 100) / 100

  // 4. Update customer aggregates + cashback balance
  const prevOrders = existingCustomer?.total_orders ?? 0
  const prevSpent = Number(existingCustomer?.total_spent ?? 0)

  await supabase
    .from('customers')
    .update({
      total_orders: prevOrders + 1,
      total_spent: prevSpent + total,
      address: {
        city: input.city,
        street: input.address,
        zip: input.postalCode,
        cashback_balance: newCashback,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)

  // 5. Increment promo code usage
  if (input.promoCode) {
    await usePromoCode(input.promoCode).catch(() => {})
  }

  // 6. Send email notifications.
  // За CARD: НЕ пращаме нотификация тук — клиентът още не е минал през Viva.
  // Notification се праща от /api/viva/success СЛЕД успешна верификация.
  // За COD: пращаме веднага — поръчката е финална.
  const orderNum = String(order.order_number)
  if (input.paymentMethod === 'cod') {
    await sendNewOrderNotification(
      input.email,
      input.name,
      orderNum,
      total,
      input.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      'cod'
    ).catch(() => {})

    // Stock decrement за COD — поръчката е финална.
    // За CARD го правим в /api/viva/success след verify.
    await decrementOrderStock(supabase, order.id).catch((e) => {
      console.error('decrementOrderStock failed for COD order', order.id, e)
    })
  }

  // 7. Send Easter promo code email + track in promo_sends
  const EASTER_PROMO = 'VELIKDEN20'
  const now = new Date()
  const easterEnd = new Date('2026-04-30T23:59:59Z')
  if (now < easterEnd) {
    await sendEasterPromoEmail(input.email, input.name, EASTER_PROMO).catch(() => {})
    await supabase.from('promo_sends').insert({
      customer_email: input.email,
      customer_name: input.name,
      promo_code: EASTER_PROMO,
      order_id: order.id,
    })
  }

  return { orderId: order.id, orderNumber: orderNum, cashbackEarned }
}
