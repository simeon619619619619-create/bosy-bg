'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Package, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CustomerData {
  name: string
  email: string
  phone: string | null
  totalOrders: number
  totalSpent: number
  cashbackBalance: number
}

interface OrderData {
  id: string
  order_number: number | string
  created_at: string
  total_eur: number
  status: string
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'Чакаща', bg: '#fff3cd', color: '#856404' },
  confirmed: { label: 'Потвърдена', bg: '#d4edda', color: '#155724' },
  shipped: { label: 'Изпратена', bg: '#cce5ff', color: '#004085' },
  delivered: { label: 'Доставена', bg: '#d4edda', color: '#155724' },
  cancelled: { label: 'Отказана', bg: '#f8d7da', color: '#721c24' },
}

export function AccountClient({
  customer,
  orders,
}: {
  customer: CustomerData
  orders: OrderData[]
}) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="mx-auto px-4 py-10" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', color: '#333' }}
        >
          Моят акаунт
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
          style={{ color: '#666' }}
        >
          <LogOut size={16} />
          Изход
        </button>
      </div>

      {/* Profile + Cashback row */}
      <div className="grid gap-5 md:grid-cols-2 mb-8">
        {/* Profile card */}
        <div
          className="rounded-xl p-6"
          style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 44, height: 44, background: 'rgba(97,162,41,.12)' }}
            >
              <User size={22} color="#61a229" />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: '#333' }}>{customer.name}</p>
              <p className="text-sm" style={{ color: '#888' }}>{customer.email}</p>
            </div>
          </div>
          {customer.phone && (
            <p className="text-sm" style={{ color: '#666' }}>
              Телефон: {customer.phone}
            </p>
          )}
          <div className="flex gap-6 mt-4 pt-4" style={{ borderTop: '1px solid #f0f0f0' }}>
            <div>
              <p className="text-xs" style={{ color: '#999' }}>Поръчки</p>
              <p className="text-lg font-bold" style={{ color: '#333' }}>{customer.totalOrders}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#999' }}>Общо похарчено</p>
              <p className="text-lg font-bold" style={{ color: '#333' }}>{customer.totalSpent.toFixed(2)} &euro;</p>
            </div>
          </div>
        </div>

        {/* Cashback card */}
        <div
          className="rounded-xl p-6 flex flex-col justify-center"
          style={{
            background: 'linear-gradient(135deg, #61a229 0%, #4e8a1f 100%)',
            boxShadow: '0 4px 20px rgba(97, 162, 41, 0.3)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Кешбак баланс
          </p>
          <p
            className="text-4xl font-extrabold mt-2"
            style={{ color: '#fff', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
          >
            {customer.cashbackBalance.toFixed(2)} &euro;
          </p>
          <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Използвай при следващата си поръчка за отстъпка.
          </p>
        </div>
      </div>

      {/* Order history */}
      <div
        className="rounded-xl p-6"
        style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Package size={20} color="#61a229" />
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', color: '#333' }}
          >
            История на поръчките
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10">
            <Package size={36} color="#ccc" />
            <p className="mt-3 text-sm" style={{ color: '#999' }}>
              Все още нямаш поръчки.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#61a229' }}
            >
              Към магазина
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const st = STATUS_MAP[order.status] ?? { label: order.status, bg: '#eee', color: '#555' }
              const date = new Date(order.created_at)
              const dateStr = date.toLocaleDateString('bg-BG', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#333' }}>
                        #{order.order_number}
                      </p>
                      <p className="text-xs" style={{ color: '#999' }}>{dateStr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                    <span className="text-sm font-bold" style={{ color: '#333', minWidth: 70, textAlign: 'right' }}>
                      {order.total_eur.toFixed(2)} &euro;
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
