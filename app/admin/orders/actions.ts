'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendOrderConfirmation } from '@/lib/resend/client'

export async function confirmOrder(id: string) {
  const supabase = createAdminSupabaseClient()

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

export async function setOrderStatus(id: string, status: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
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
  boxnow_locker_id?: string | null
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

export async function updateCourier(id: string, courier: 'speedy' | 'econt') {
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
