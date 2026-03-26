import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { toEur } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge'
import { ArrowLeft } from 'lucide-react'

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (!customer) {
    notFound()
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  const totalOrders = customer.total_orders ?? 0
  const totalSpent = Number(customer.total_spent ?? 0)
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

  const address =
    typeof customer.address === 'object' && customer.address !== null
      ? customer.address
      : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/customers" />}>
          <ArrowLeft />
        </Button>
        <h1 className="text-3xl font-bold">{customer.name ?? 'Клиент'}</h1>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Customer info */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Информация</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Име: </span>
              <span>{customer.name ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email: </span>
              <span>{customer.email ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Телефон: </span>
              <span>{customer.phone ?? '—'}</span>
            </div>
            {address && (
              <div>
                <span className="text-muted-foreground">Адрес: </span>
                <span>
                  {[
                    (address as Record<string, string>).city,
                    (address as Record<string, string>).street,
                    (address as Record<string, string>).zip,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </span>
              </div>
            )}
            {!address && typeof customer.address === 'string' && (
              <div>
                <span className="text-muted-foreground">Адрес: </span>
                <span>{customer.address || '—'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Общо поръчки</p>
            <p className="mt-2 text-3xl font-bold">{totalOrders}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Общо похарчени</p>
            <p className="mt-2 text-3xl font-bold font-mono">
              {toEur(totalSpent).toFixed(2)} &euro;
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Средна поръчка</p>
            <p className="mt-2 text-3xl font-bold font-mono">
              {toEur(avgOrderValue).toFixed(2)} &euro;
            </p>
          </div>
        </div>
      </div>

      {/* Order history */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">История на поръчките</h2>

        {!orders || orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Този клиент все още няма поръчки.
          </p>
        ) : (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Поръчка #</TableHead>
                  <TableHead>Артикули</TableHead>
                  <TableHead>Общо</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : []

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {order.order_number ?? order.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>{items.length}</TableCell>
                      <TableCell className="font-mono">
                        {toEur(Number(order.total ?? 0)).toFixed(2)} &euro;
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('bg-BG')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
