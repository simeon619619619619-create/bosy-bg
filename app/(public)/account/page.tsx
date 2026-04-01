import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { toEur } from '@/lib/currency'
import { AccountClient } from './account-client'

export const metadata = {
  title: 'Моят акаунт | BOSY',
  description: 'Преглед на профила, кешбак баланс и история на поръчките.',
}

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/account/login')
  }

  // Fetch customer by email
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, email, phone, address, total_orders, total_spent')
    .eq('email', user.email!)
    .single()

  if (!customer) {
    redirect('/account/login')
  }

  // Fetch orders for this customer
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, created_at, total, status')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const cashbackBalance =
    typeof customer.address === 'object' && customer.address !== null
      ? Number((customer.address as Record<string, unknown>).cashback_balance ?? 0)
      : 0

  const serializedOrders = (orders ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    created_at: o.created_at,
    total_eur: Number(toEur(o.total).toFixed(2)),
    status: o.status as string,
  }))

  return (
    <AccountClient
      customer={{
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalOrders: customer.total_orders,
        totalSpent: Number(toEur(customer.total_spent).toFixed(2)),
        cashbackBalance: Number(toEur(cashbackBalance).toFixed(2)),
      }}
      orders={serializedOrders}
    />
  )
}
