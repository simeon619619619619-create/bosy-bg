'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createPromoCode(formData: FormData) {
  const supabase = getSupabase()

  const code = (formData.get('code') as string).toUpperCase().trim()
  const discountType = formData.get('discount_type') as string
  const discountValue = Number(formData.get('discount_value'))
  const minOrderAmount = Number(formData.get('min_order_amount') || 0)
  const maxUses = formData.get('max_uses') ? Number(formData.get('max_uses')) : null
  const expiresAt = formData.get('expires_at') as string || null

  if (!code || !discountType || !discountValue) {
    throw new Error('Попълнете всички задължителни полета')
  }

  const { error } = await supabase.from('promo_codes').insert({
    code,
    discount_type: discountType,
    discount_value: discountValue,
    min_order_amount: minOrderAmount,
    max_uses: maxUses,
    expires_at: expiresAt || null,
  })

  if (error) {
    if (error.code === '23505') throw new Error('Код с това име вече съществува')
    throw new Error(error.message)
  }

  revalidatePath('/admin/promo-codes')
}

export async function togglePromoCode(id: string, active: boolean) {
  const supabase = getSupabase()
  await supabase.from('promo_codes').update({ active }).eq('id', id)
  revalidatePath('/admin/promo-codes')
}

export async function deletePromoCode(id: string) {
  const supabase = getSupabase()
  await supabase.from('promo_codes').delete().eq('id', id)
  revalidatePath('/admin/promo-codes')
}

/** Validate a promo code for checkout */
export async function validatePromoCode(code: string, subtotalBgn: number): Promise<{
  valid: boolean
  error?: string
  discount_type?: string
  discount_value?: number
  code?: string
}> {
  if (!code) return { valid: false, error: 'Въведете промо код' }

  const supabase = getSupabase()
  const { data: promo } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('active', true)
    .single()

  if (!promo) return { valid: false, error: 'Невалиден промо код' }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { valid: false, error: 'Промо кодът е изтекъл' }
  }

  if (promo.max_uses && promo.used_count >= promo.max_uses) {
    return { valid: false, error: 'Промо кодът е изчерпан' }
  }

  if (promo.min_order_amount && subtotalBgn < Number(promo.min_order_amount)) {
    return { valid: false, error: `Минимална поръчка: ${(Number(promo.min_order_amount) / 1.95583).toFixed(2)} €` }
  }

  return {
    valid: true,
    discount_type: promo.discount_type,
    discount_value: Number(promo.discount_value),
    code: promo.code,
  }
}

/** Increment used_count after successful order */
export async function usePromoCode(code: string) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('promo_codes')
    .select('used_count')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (data) {
    await supabase
      .from('promo_codes')
      .update({ used_count: (data.used_count || 0) + 1 })
      .eq('code', code.toUpperCase().trim())
  }
}
