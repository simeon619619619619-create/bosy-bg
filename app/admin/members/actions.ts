'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Types ──────────────────────────────────────────────────────
export interface RegisteredUser {
  id: string
  email: string
  name: string | null
  phone: string | null
  cashback_balance: number
  total_orders: number
  total_spent: number
  email_verified: boolean
  created_at: string
  last_sign_in_at: string | null
  banned: boolean
}

// ── List all registered auth users with their customer data ───
export async function getRegisteredUsers(): Promise<RegisteredUser[]> {
  const supabase = createAdminSupabaseClient()

  // Fetch all auth users (paginated, up to 1000)
  const { data: authData, error: authError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })

  if (authError) throw new Error(authError.message)

  const authUsers = authData?.users ?? []

  // Fetch all customers
  const { data: customers } = await supabase
    .from('customers')
    .select('email, name, phone, address, total_orders, total_spent')

  const customerMap = new Map<
    string,
    {
      name: string | null
      phone: string | null
      cashback_balance: number
      total_orders: number
      total_spent: number
    }
  >()

  for (const c of customers ?? []) {
    const addr = typeof c.address === 'object' && c.address !== null
      ? (c.address as Record<string, unknown>)
      : {}
    customerMap.set(c.email, {
      name: c.name ?? null,
      phone: c.phone ?? null,
      cashback_balance: Number(addr.cashback_balance ?? 0),
      total_orders: Number(c.total_orders ?? 0),
      total_spent: Number(c.total_spent ?? 0),
    })
  }

  return authUsers.map((u) => {
    const customer = customerMap.get(u.email ?? '')
    return {
      id: u.id,
      email: u.email ?? '',
      name:
        customer?.name ??
        (u.user_metadata?.full_name as string | undefined) ??
        null,
      phone: customer?.phone ?? null,
      cashback_balance: customer?.cashback_balance ?? 0,
      total_orders: customer?.total_orders ?? 0,
      total_spent: customer?.total_spent ?? 0,
      email_verified: !!u.email_confirmed_at,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned: !!u.banned_until || (u.user_metadata?.banned === true),
    }
  })
}

// ── Reset password ────────────────────────────────────────────
export async function resetUserPassword(userId: string, email: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/members')
  return { success: true }
}

// ── Verify email ──────────────────────────────────────────────
export async function verifyUserEmail(userId: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/members')
  return { success: true }
}

// ── Add cashback ──────────────────────────────────────────────
export async function addCashback(email: string, amount: number) {
  if (amount <= 0) throw new Error('Сумата трябва да е положителна')

  const supabase = createAdminSupabaseClient()

  // Get current customer
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('address')
    .eq('email', email)
    .single()

  if (fetchError) throw new Error(`Клиентът не е намерен: ${fetchError.message}`)

  const addr =
    typeof customer.address === 'object' && customer.address !== null
      ? (customer.address as Record<string, unknown>)
      : {}

  const currentCashback = Number(addr.cashback_balance ?? 0)

  const { error } = await supabase
    .from('customers')
    .update({
      address: { ...addr, cashback_balance: currentCashback + amount },
    })
    .eq('email', email)

  if (error) throw new Error(error.message)

  revalidatePath('/members')
  return { success: true, newBalance: currentCashback + amount }
}

// ── Ban user ──────────────────────────────────────────────────
export async function banUser(userId: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: '876000h', // ~100 years
  })

  if (error) throw new Error(error.message)

  revalidatePath('/members')
  return { success: true }
}

// ── Unban user ────────────────────────────────────────────────
export async function unbanUser(userId: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/members')
  return { success: true }
}

// ── Delete auth user ──────────────────────────────────────────
export async function deleteAuthUser(userId: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) throw new Error(error.message)

  revalidatePath('/members')
  return { success: true }
}
