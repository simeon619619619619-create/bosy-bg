'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendOrderConfirmation } from '@/lib/resend/client'

export async function confirmOrder(id: string) {
  const supabase = await createServerSupabaseClient()

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

  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)
}

export async function cancelOrder(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)
}

export async function bulkConfirmOrders(ids: string[]) {
  for (const id of ids) {
    await confirmOrder(id)
  }

  revalidatePath('/orders')
}

export async function bulkCancelOrders(ids: string[]) {
  for (const id of ids) {
    await cancelOrder(id)
  }

  revalidatePath('/orders')
}

export async function updateOrderNotes(id: string, notes: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('orders')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/orders/${id}`)
}
