'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function confirmOrder(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
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
