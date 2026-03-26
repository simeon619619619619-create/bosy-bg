import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { toEur } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge'
import {
  ConfirmOrderButton,
  CancelOrderButton,
  ShipWithSpeedyButton,
} from '@/components/admin/orders/order-actions'
import { OrderNotes } from '@/components/admin/orders/order-notes'
import { OrderTimeline } from '@/components/admin/orders/order-timeline'
import { ArrowLeft } from 'lucide-react'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, customers(name, email, phone, address)')
    .eq('id', id)
    .single()

  if (!order) {
    notFound()
  }

  const customer = order.customers as {
    name: string
    email: string | null
    phone: string | null
    address: Record<string, string> | string | null
  } | null

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : []
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = Number(order.shipping_cost ?? 0)
  const total = Number(order.total ?? subtotal + shipping)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/orders" />}>
          <ArrowLeft />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              Поръчка #{order.order_number ?? order.id.slice(0, 8)}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('bg-BG', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left column — items + totals + timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Артикули</h2>
            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Няма артикули</p>
              ) : (
                items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {toEur(Number(item.price)).toFixed(2)} &euro;
                      </p>
                    </div>
                    <p className="font-mono">
                      {toEur(item.quantity * item.price).toFixed(2)} &euro;
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Междинна сума</span>
                <span className="font-mono">{toEur(subtotal).toFixed(2)} &euro;</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Доставка</span>
                <span className="font-mono">{toEur(shipping).toFixed(2)} &euro;</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Общо</span>
                <span className="font-mono">{toEur(total).toFixed(2)} &euro;</span>
              </div>
            </div>
          </div>

          {/* Speedy tracking info */}
          {(order.status === 'shipped' || order.status === 'delivered') &&
            order.speedy_tracking_number && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Доставка</h2>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tracking номер</span>
                    <span className="font-mono text-primary">
                      {order.speedy_tracking_number}
                    </span>
                  </div>
                  {order.speedy_parcel_id && (
                    <div className="mt-3">
                      <a
                        href={`/api/speedy/label?parcelId=${order.speedy_parcel_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Принтирай етикет
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Timeline */}
          <OrderTimeline
            status={order.status}
            createdAt={order.created_at}
            updatedAt={order.updated_at ?? null}
            speedyTrackingNumber={order.speedy_tracking_number ?? null}
          />
        </div>

        {/* Right column — customer + actions + notes */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Клиент</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Име: </span>
                <span>{customer?.name ?? '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email: </span>
                <span>{customer?.email ?? '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Телефон: </span>
                <span>{customer?.phone ?? '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Адрес: </span>
                <span>{customer?.address ? (typeof customer.address === 'string' ? customer.address : Object.values(customer.address).join(', ')) : '—'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Действия</h2>
            <div className="mt-4 flex flex-col gap-2">
              {order.status === 'pending' && (
                <>
                  <ConfirmOrderButton orderId={order.id} />
                  <CancelOrderButton orderId={order.id} />
                </>
              )}
              {order.status === 'confirmed' && (
                <ShipWithSpeedyButton orderId={order.id} />
              )}
              {order.status === 'shipped' && order.speedy_parcel_id && (
                <Button
                  variant="outline"
                  render={
                    <a
                      href={`/api/speedy/label?parcelId=${order.speedy_parcel_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Принтирай етикет
                </Button>
              )}
              {(order.status === 'delivered' || order.status === 'cancelled') && (
                <p className="text-sm text-muted-foreground">
                  Няма налични действия
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <OrderNotes orderId={order.id} initialNotes={order.notes ?? ''} />
        </div>
      </div>
    </div>
  )
}
