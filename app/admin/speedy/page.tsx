import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Truck, ExternalLink, Printer } from 'lucide-react'
import { toEur } from '@/lib/currency'

const statusLabels: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Готова за изпращане', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  shipped: { label: 'Изпратена', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  delivered: { label: 'Доставена', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
}

const filterTabs = [
  { key: 'all', label: 'Всички' },
  { key: 'confirmed', label: 'Готови за изпращане' },
  { key: 'shipped', label: 'Изпратени' },
  { key: 'delivered', label: 'Доставени' },
] as const

export default async function SpeedyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { status } = await searchParams
  const activeFilter = typeof status === 'string' ? status : 'all'

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('orders')
    .select('*, customers(name, phone, address)')
    .in('status', ['confirmed', 'shipped', 'delivered'])
    .order('created_at', { ascending: false })

  if (activeFilter !== 'all') {
    query = query.eq('status', activeFilter)
  }

  const { data: orders } = await query

  const stats = {
    confirmed: orders?.filter((o) => o.status === 'confirmed').length ?? 0,
    shipped: orders?.filter((o) => o.status === 'shipped').length ?? 0,
    delivered: orders?.filter((o) => o.status === 'delivered').length ?? 0,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Truck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Speedy пратки</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Управление на пратки чрез Speedy API. Пратките се създават от страницата
        на отделна поръчка.
      </p>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Готови за изпращане</p>
          <p className="mt-1 text-2xl font-bold text-yellow-500">
            {stats.confirmed}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Изпратени</p>
          <p className="mt-1 text-2xl font-bold text-blue-500">
            {stats.shipped}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Доставени</p>
          <p className="mt-1 text-2xl font-bold text-green-500">
            {stats.delivered}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-border">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key
          const href =
            tab.key === 'all' ? '/admin/speedy' : `/admin/speedy?status=${tab.key}`
          return (
            <Link
              key={tab.key}
              href={href}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Shipments table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        {!orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">Няма пратки за показване</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Поръчка
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Клиент
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Сума
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tracking №
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const customer = order.customers as {
                    name: string
                    phone: string
                  } | null
                  const statusInfo = statusLabels[order.status] ?? statusLabels.confirmed
                  return (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          #{order.order_number}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('bg-BG')}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{customer?.name ?? '—'}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {customer?.phone ?? ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {toEur(Number(order.total)).toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.speedy_tracking_number ? (
                          <a
                            href={`https://www.speedy.bg/bg/track-shipment?shipmentNumber=${order.speedy_tracking_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                          >
                            {order.speedy_tracking_number}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {order.speedy_parcel_id ? (
                          <a
                            href={`/api/speedy/label?parcelId=${order.speedy_parcel_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                          >
                            <Printer className="h-3 w-3" />
                            Етикет
                          </a>
                        ) : order.status === 'confirmed' ? (
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            <Truck className="h-3 w-3" />
                            Изпрати
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
