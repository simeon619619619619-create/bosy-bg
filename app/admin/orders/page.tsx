import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { OrdersListClient } from '@/components/admin/orders/orders-bulk-actions'
import { ShoppingBag } from 'lucide-react'

const filterTabs = [
  { key: 'all', label: 'Всички' },
  { key: 'pending', label: 'Чакащи' },
  { key: 'confirmed', label: 'Потвърдени' },
  { key: 'shipped', label: 'Изпратени' },
  { key: 'delivered', label: 'Доставени' },
] as const

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { status } = await searchParams
  const activeFilter = typeof status === 'string' ? status : 'all'

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('orders')
    .select('*, customers(name)')
    .order('created_at', { ascending: false })

  if (activeFilter !== 'all') {
    query = query.eq('status', activeFilter)
  }

  const { data: orders } = await query

  // Map orders for the client component
  const mappedOrders = (orders ?? []).map((order) => {
    const notes = (order.notes as string) ?? ''
    const payment_method = notes.includes('[CARD]') ? 'card' : 'cod'
    return {
      id: order.id,
      order_number: order.order_number,
      customer_name:
        (order.customers as { name: string } | null)?.name ?? '—',
      items_count: Array.isArray(order.items) ? order.items.length : 0,
      total: Number(order.total ?? 0),
      status: order.status,
      payment_method,
      speedy_tracking_number: order.speedy_tracking_number,
      created_at: order.created_at,
    }
  })

  return (
    <div>
      {/* Header */}
      <h1 className="text-3xl font-bold">Поръчки</h1>

      {/* Filter tabs */}
      <div className="mt-6 flex items-center gap-1">
        {filterTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? 'secondary' : 'ghost'}
            size="sm"
            render={
              <Link
                href={
                  tab.key === 'all'
                    ? '/admin/orders'
                    : `/admin/orders?status=${tab.key}`
                }
              />
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Table or empty state */}
      {!orders || orders.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="size-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Няма поръчки</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeFilter !== 'all'
              ? 'Няма поръчки с този статус'
              : 'Все още няма направени поръчки'}
          </p>
        </div>
      ) : (
        <OrdersListClient orders={mappedOrders} />
      )}
    </div>
  )
}
