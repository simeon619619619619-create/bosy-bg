'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/components/public/cart-provider'
import { toEur } from '@/lib/currency'

const SHIPPING_THRESHOLD = 78.15 // ~39.97€
const SHIPPING_COST = 5.99

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getCartTotal } = useCart()
  const subtotal = getCartTotal()
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 px-4 text-center"
        style={{ minHeight: '60vh' }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 80, height: 80, background: '#e8e8e8' }}
        >
          <ShoppingBag size={36} color="#999" />
        </div>
        <h1
          className="mt-6 text-2xl font-bold"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
        >
          Магазинът е празен
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#777' }}>
          Все още нямате добавени продукти в количката.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #60a5fa 100%)' }}
        >
          Към магазина
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto px-4 py-10" style={{ maxWidth: 1100 }}>
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
      >
        Количка
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl p-4"
              style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              {/* Image */}
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="rounded-lg object-cover"
                  style={{ width: 90, height: 90 }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 90, height: 90, background: '#eee' }}
                >
                  <ShoppingBag size={28} color="#bbb" />
                </div>
              )}

              {/* Info */}
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-sm font-semibold leading-tight"
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      color: '#333',
                    }}
                  >
                    {item.name}
                  </h3>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="shrink-0 rounded p-1 transition-colors hover:bg-red-50"
                    aria-label="Премахни"
                  >
                    <Trash2 size={16} color="#e53e3e" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  {/* Quantity */}
                  <div
                    className="flex items-center gap-0 rounded-lg overflow-hidden"
                    style={{ border: '1px solid #ddd' }}
                  >
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex items-center justify-center transition-colors hover:bg-gray-100"
                      style={{ width: 32, height: 32 }}
                      aria-label="Намали"
                    >
                      <Minus size={14} />
                    </button>
                    <span
                      className="flex items-center justify-center text-sm font-medium"
                      style={{ width: 36, height: 32, borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex items-center justify-center transition-colors hover:bg-gray-100"
                      style={{ width: 32, height: 32 }}
                      aria-label="Увеличи"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Price */}
                  <span className="text-sm font-bold" style={{ color: '#333' }}>
                    {toEur(item.price * item.quantity).toFixed(2)} &euro;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div
            className="rounded-xl p-6 sticky top-24"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Обобщение
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#777' }}>Междинна сума</span>
                <span className="font-medium">{toEur(subtotal).toFixed(2)} &euro;</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#777' }}>Доставка</span>
                <span className="font-medium">
                  {shipping === 0 ? 'Безплатна' : `${toEur(shipping).toFixed(2)} \u20AC`}
                </span>
              </div>
              {subtotal < SHIPPING_THRESHOLD && subtotal > 0 && (
                <p className="text-xs font-semibold animate-pulse" style={{ color: '#f472b6' }}>
                  Още {toEur(SHIPPING_THRESHOLD - subtotal).toFixed(2)} &euro; за безплатна доставка!
                </p>
              )}
              <div
                className="flex justify-between pt-3 text-base font-bold"
                style={{ borderTop: '1px solid #eee' }}
              >
                <span>Общо</span>
                <span>{toEur(total).toFixed(2)} &euro;</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #60a5fa 100%)' }}
            >
              Продължи към поръчка
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
