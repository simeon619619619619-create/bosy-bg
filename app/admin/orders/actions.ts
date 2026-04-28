'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendOrderConfirmation } from '@/lib/resend/client'
import { assertOrderShippable, runGuarded, type GuardedActionResult } from '@/lib/orders/payment-guard'
import { restoreOrderStock } from '@/lib/orders/stock'

export async function confirmOrder(id: string): Promise<GuardedActionResult> {
  const supabase = createAdminSupabaseClient()

  return runGuarded(async () => {
    await assertOrderShippable(supabase, id, 'confirmed')

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('order_number, total, customers(email)')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    // Send confirmation email
    const email = (order.customers as unknown as { email: string | null } | null)?.email
    if (email && order.order_number) {
      try {
        await sendOrderConfirmation(email, order.order_number, Number(order.total ?? 0))
      } catch (e) {
        console.error('Failed to send confirmation email:', e)
      }
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${id}`)
  })
}

export async function cancelOrder(id: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Възстанови наличностите ако са били намалени.
  // restoreOrderStock е idempotent — ако няма [STOCK-DEC] в notes, не прави нищо.
  await restoreOrderStock(supabase, id).catch((e) => {
    console.error('restoreOrderStock failed for cancelled order', id, e)
  })

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
}

export async function bulkConfirmOrders(ids: string[]) {
  for (const id of ids) {
    await confirmOrder(id)
  }

  revalidatePath('/admin/orders')
}

export async function bulkCancelOrders(ids: string[]) {
  for (const id of ids) {
    await cancelOrder(id)
  }

  revalidatePath('/admin/orders')
}

export async function markShippedManually(
  id: string,
  trackingNumber: string | null
): Promise<GuardedActionResult> {
  const supabase = createAdminSupabaseClient()

  return runGuarded(async () => {
    await assertOrderShippable(supabase, id, 'shipped')

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'shipped',
        speedy_tracking_number: trackingNumber || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${id}`)
  })
}

export async function setOrderStatus(
  id: string,
  status: string
): Promise<GuardedActionResult> {
  const supabase = createAdminSupabaseClient()

  return runGuarded(async () => {
    await assertOrderShippable(supabase, id, status)

    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    if (status === 'cancelled') {
      await restoreOrderStock(supabase, id).catch((e) => {
        console.error('restoreOrderStock failed via setOrderStatus', id, e)
      })
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${id}`)
  })
}

export async function updateOrderNotes(id: string, notes: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase
    .from('orders')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/orders/${id}`)
}

export interface ShippingAddressInput {
  name: string
  phone: string
  email?: string | null
  street: string
  city: string
  zip: string
  delivery_type?: 'address' | 'office' | 'boxnow'
  speedy_office_id?: number | null
  speedy_office_label?: string | null
  econt_office_id?: number | null
  econt_office_label?: string | null
  boxnow_locker_id?: string | null
  boxnow_locker_label?: string | null
}

export async function updateShippingAddress(id: string, address: ShippingAddressInput) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase
    .from('orders')
    .update({ shipping_address: address, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/orders/${id}`)
}

export async function updateCourier(id: string, courier: 'speedy' | 'econt' | 'boxnow') {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase
    .from('orders')
    .update({ courier, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/orders/${id}`)
}

export async function updateAdminNotes(id: string, adminNotes: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase
    .from('orders')
    .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/orders/${id}`)
}
