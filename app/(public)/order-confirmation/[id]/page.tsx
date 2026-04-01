import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle } from 'lucide-react'
import { toEur } from '@/lib/currency'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: order } = await supabase
    .from('orders')
    .select('*, customers(name, email, address)')
    .eq('id', id)
    .single()

  if (!order) {
    notFound()
  }

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : []
  const total = Number(order.total ?? 0)
  const shipping = Number(order.shipping_cost ?? 0)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const customer = order.customers as { name: string; email: string | null; address: Record<string, unknown> | null } | null
  const cashbackEarned = Math.round(total * 5) / 100 // 5% cashback

  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-16"
      style={{ minHeight: '65vh' }}
    >
      <div
        className="w-full rounded-2xl p-8 text-center"
        style={{
          maxWidth: 560,
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Success icon */}
        <div className="flex justify-center">
          <CheckCircle size={56} color="#a78bfa" strokeWidth={1.5} />
        </div>

        <h1
          className="mt-4 text-2xl font-bold"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', color: '#333' }}
        >
          Благодарим за поръчката!
        </h1>

        <p className="mt-2 text-sm" style={{ color: '#777' }}>
          Вашата поръчка беше получена успешно. Ще получите потвърждение на email.
        </p>

        {/* Order info */}
        <div
          className="mt-6 rounded-xl p-5 text-left"
          style={{ background: '#fdf5f0', border: '1px solid #eee' }}
        >
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: '#777' }}>Номер на поръчка</span>
            <span className="font-bold" style={{ color: '#a78bfa' }}>
              #{order.order_number ?? id.slice(0, 8)}
            </span>
          </div>

          {customer?.name && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span style={{ color: '#777' }}>Клиент</span>
              <span className="font-medium">{customer.name}</span>
            </div>
          )}

          {/* Items */}
          <div className="mt-4 space-y-2" style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span className="font-medium">
                  {toEur(item.price * item.quantity).toFixed(2)} &euro;
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-3 space-y-1 text-sm" style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
            <div className="flex justify-between">
              <span style={{ color: '#777' }}>Междинна сума</span>
              <span>{toEur(subtotal).toFixed(2)} &euro;</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#777' }}>Доставка</span>
              <span>{shipping === 0 ? 'Безплатна' : `${toEur(shipping).toFixed(2)} \u20AC`}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid #eee' }}>
              <span>Общо</span>
              <span>{toEur(total).toFixed(2)} &euro;</span>
            </div>
          </div>
        </div>

        {/* Cashback earned */}
        {cashbackEarned > 0 && (
          <div
            className="mt-4 rounded-lg p-3 text-sm font-medium"
            style={{ background: '#f0fce8', color: '#3d7a0a', border: '1px solid #d4edbc' }}
          >
            Спечелихте {toEur(cashbackEarned).toFixed(2)} &euro; кешбак за следващата поръчка!
          </div>
        )}

        {/* CTA */}
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center justify-center rounded-lg px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#a78bfa' }}
        >
          Продължи пазаруването
        </Link>
      </div>
    </div>
  )
}
