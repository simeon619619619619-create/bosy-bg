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
  ShipWithEcontButton,
  ShipWithBoxNowButton,
} from '@/components/admin/orders/order-actions'
import { OrderTimeline } from '@/components/admin/orders/order-timeline'
import { ShippingAddressEditor } from '@/components/admin/orders/shipping-address-editor'
import { CourierSelector } from '@/components/admin/orders/courier-selector'
import { AdminNotesEditor } from '@/components/admin/orders/admin-notes-editor'
import type { ShippingAddressInput } from '@/app/admin/orders/actions'
import { ArrowLeft } from 'lucide-react'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

function parseNoteMetadata(notes: string | null | undefined) {
  if (!notes) return { paymentMethod: null, promoCode: null, officeId: null, boxnowId: null }
  const paymentMethod = /\[(COD|CARD)\]/.exec(notes)?.[1] ?? null
  const promoCode = /\[PROMO:([^\]]+)\]/.exec(notes)?.[1] ?? null
  const officeId = /\[OFFICE:([^\]]+)\]/.exec(notes)?.[1] ?? null
  const boxnowId = /\[BOXNOW:([^\]]+)\]/.exec(notes)?.[1] ?? null
  return { paymentMethod, promoCode, officeId, boxnowId }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, customers(name, email, phone, address)')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('[admin/orders/[id]] supabase fetch error', { id, fetchError })
    throw new Error(`Supabase fetch failed: ${fetchError.message ?? 'unknown'}`)
  }
  if (!order) {
    notFound()
  }
  console.log('[admin/orders/[id]] order loaded', {
    id,
    order_number: order.order_number,
    status: order.status,
    courier: order.courier,
    has_shipping_address: !!order.shipping_address,
    notes: order.notes,
    items_type: Array.isArray(order.items) ? 'array' : typeof order.items,
  })

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

  // Shipping address snapshot — fall back to customer.address for legacy orders
  let shippingAddress: Partial<ShippingAddressInput> | null = null
  if (order.shipping_address && typeof order.shipping_address === 'object') {
    shippingAddress = order.shipping_address as Partial<ShippingAddressInput>
  } else if (customer?.address && typeof customer.address === 'object') {
    const a = customer.address as Record<string, unknown>
    shippingAddress = {
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email,
      street: String(a.street ?? ''),
      city: String(a.city ?? ''),
      zip: String(a.zip ?? ''),
      delivery_type: 'address',
    }
  }

  const meta = parseNoteMetadata(order.notes)
  const courier: 'speedy' | 'econt' | 'boxnow' =
    order.courier === 'econt' ? 'econt' :
    order.courier === 'boxnow' ? 'boxnow' :
    'speedy'
  const courierLocked = order.status === 'shipped' || order.status === 'delivered'

  // Legacy fallback — if customer_note is null but notes has text after the tags, extract it
  const customerNoteFallback = order.customer_note
    ?? (order.notes
      ? order.notes.replace(/^(\[[A-Z0-9:_-]+\]\s*)+/g, '').trim() || null
      : null)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/admin/orders" />}>
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

          {/* Shipping info */}
          {(order.status === 'shipped' || order.status === 'delivered') &&
            (order.speedy_tracking_number ||
              order.econt_tracking_number ||
              order.boxnow_tracking_number) && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">
                  Доставка ·{' '}
                  {courier === 'econt'
                    ? 'Еконт'
                    : courier === 'boxnow'
                      ? 'BoxNow'
                      : 'Speedy'}
                </h2>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tracking номер</span>
                    <span className="font-mono text-primary">
                      {order.boxnow_tracking_number ||
                        order.econt_tracking_number ||
                        order.speedy_tracking_number}
                    </span>
                  </div>
                  {order.boxnow_label_url && (
                    <div className="mt-3">
                      <a
                        href={order.boxnow_label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Принтирай BoxNow етикет
                      </a>
                    </div>
                  )}
                  {order.econt_label_url && (
                    <div className="mt-3">
                      <a
                        href={order.econt_label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Принтирай Еконт етикет
                      </a>
                    </div>
                  )}
                  {!order.econt_label_url &&
                    !order.boxnow_label_url &&
                    order.speedy_parcel_id && (
                      <div className="mt-3">
                        <a
                          href={`/api/speedy/label?parcelId=${order.speedy_parcel_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Принтирай Speedy етикет
                        </a>
                      </div>
                    )}
                </div>
              </div>
            )}

          {/* Customer note + metadata badges + internal admin notes */}
          <AdminNotesEditor
            orderId={order.id}
            initial={order.admin_notes ?? ''}
            customerNote={customerNoteFallback}
            paymentMethod={meta.paymentMethod}
            promoCode={meta.promoCode}
            officeId={meta.officeId}
            boxnowId={meta.boxnowId}
          />

          {/* Timeline */}
          <OrderTimeline
            status={order.status}
            createdAt={order.created_at}
            updatedAt={order.updated_at ?? null}
            speedyTrackingNumber={order.speedy_tracking_number ?? null}
          />
        </div>

        {/* Right column — customer + address + courier + actions */}
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
            </div>
          </div>

          {/* Editable shipping address */}
          <ShippingAddressEditor
            orderId={order.id}
            initial={shippingAddress}
            customerName={customer?.name ?? ''}
            customerPhone={customer?.phone ?? ''}
            customerEmail={customer?.email ?? null}
          />

          {/* Courier selector */}
          <CourierSelector orderId={order.id} initial={courier} locked={courierLocked} />

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
                <>
                  {courier === 'econt' ? (
                    <ShipWithEcontButton orderId={order.id} />
                  ) : courier === 'boxnow' ? (
                    <ShipWithBoxNowButton orderId={order.id} />
                  ) : (
                    <ShipWithSpeedyButton orderId={order.id} />
                  )}
                  <Button
                    variant="outline"
                    render={
                      <a
                        href={`/api/admin/packing-slip/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    Печат packing slip
                  </Button>
                </>
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
                  Принтирай Speedy етикет
                </Button>
              )}
              {order.status === 'shipped' && order.econt_label_url && (
                <Button
                  variant="outline"
                  render={
                    <a
                      href={order.econt_label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Принтирай Еконт етикет
                </Button>
              )}
              {order.status === 'shipped' && order.boxnow_label_url && (
                <Button
                  variant="outline"
                  render={
                    <a
                      href={order.boxnow_label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Принтирай BoxNow етикет
                </Button>
              )}
              {order.status === 'shipped' && (
                <Button
                  variant="outline"
                  render={
                    <a
                      href={`/api/admin/packing-slip/${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Печат packing slip
                </Button>
              )}
              {(order.status === 'delivered' || order.status === 'cancelled') && (
                <p className="text-sm text-muted-foreground">
                  Няма налични действия
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
