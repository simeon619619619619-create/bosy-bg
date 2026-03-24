import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge'
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
                    ? '/orders'
                    : `/orders?status=${tab.key}`
                }
              />
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Table */}
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
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Поръчка #</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Артикули</TableHead>
                <TableHead>Общо</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Speedy</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const items = Array.isArray(order.items) ? order.items : []
                const customerName =
                  (order.customers as { name: string } | null)?.name ?? '—'

                const orderUrl = `/orders/${order.id}`
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={orderUrl} className="font-mono text-primary hover:underline">
                        {order.order_number ?? order.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell><Link href={orderUrl} className="block">{customerName}</Link></TableCell>
                    <TableCell><Link href={orderUrl} className="block">{items.length}</Link></TableCell>
                    <TableCell><Link href={orderUrl} className="block font-mono">{Number(order.total ?? 0).toFixed(2)} лв.</Link></TableCell>
                    <TableCell><Link href={orderUrl}><OrderStatusBadge status={order.status} /></Link></TableCell>
                    <TableCell>
                      <Link href={orderUrl} className="block">
                        {order.speedy_tracking_number ? (
                          <span className="font-mono text-primary">{order.speedy_tracking_number}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell><Link href={orderUrl} className="block text-muted-foreground">{new Date(order.created_at).toLocaleDateString('bg-BG')}</Link></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
