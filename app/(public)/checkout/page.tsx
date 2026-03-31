'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft } from 'lucide-react'
import { useCart } from '@/components/public/cart-provider'
import { createOrder } from './actions'
import { toEur } from '@/lib/currency'

const SHIPPING_THRESHOLD = 50
const SHIPPING_COST = 5.99

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getCartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod')

  const subtotal = getCartTotal()
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const cardDiscount = paymentMethod === 'card' ? subtotal * 0.05 : 0
  const total = subtotal + shipping - cardDiscount

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 px-4 text-center"
        style={{ minHeight: '60vh' }}
      >
        <ShoppingBag size={48} color="#999" />
        <h1
          className="mt-4 text-xl font-bold"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
        >
          Количката е празна
        </h1>
        <Link
          href="/shop"
          className="mt-4 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#61a229' }}
        >
          Към магазина
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const email = form.get('email') as string
    const phone = form.get('phone') as string
    const city = form.get('city') as string
    const address = form.get('address') as string
    const postalCode = form.get('postalCode') as string
    const notes = form.get('notes') as string

    try {
      const result = await createOrder({
        name,
        email,
        phone,
        city,
        address,
        postalCode,
        notes: notes ?? '',
        paymentMethod,
        cardDiscount,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
      })

      if (paymentMethod === 'card') {
        const payRes = await fetch('/api/viva/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: result.orderId }),
        })

        if (!payRes.ok) {
          const payErr = await payRes.json()
          throw new Error(payErr.error || 'Грешка при създаване на плащане')
        }

        const { checkoutUrl } = await payRes.json()
        clearCart()
        window.location.href = checkoutUrl
        return
      }

      // Cash on delivery — go to confirmation
      clearCart()
      router.push(`/order-confirmation/${result.orderId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Възникна грешка. Опитайте отново.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 42,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    background: '#fff',
    color: '#333',
    outline: 'none',
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
    marginBottom: 4,
  }

  return (
    <div className="mx-auto px-4 py-10" style={{ maxWidth: 1100 }}>
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: '#61a229' }}
      >
        <ArrowLeft size={16} />
        Обратно към количката
      </Link>

      <h1
        className="mt-4 text-3xl font-bold"
        style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
      >
        Поръчка
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info */}
          <div
            className="rounded-xl p-6"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Данни за контакт
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label style={labelStyle} htmlFor="name">
                  Име и фамилия *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Иван Иванов"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="email">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ivan@example.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="phone">
                  Телефон *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="0888 123 456"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div
            className="rounded-xl p-6"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Адрес за доставка
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label style={labelStyle} htmlFor="city">
                  Град
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="София"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="postalCode">
                  Пощенски код
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  placeholder="1000"
                  style={inputStyle}
                />
              </div>
              <div className="sm:col-span-2">
                <label style={labelStyle} htmlFor="address">
                  Улица / адрес
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="ул. Витоша 15, ет. 3"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div
            className="rounded-xl p-6"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Бележки
            </h2>
            <div className="mt-4">
              <textarea
                name="notes"
                rows={3}
                placeholder="Допълнителни инструкции за доставка..."
                style={{
                  ...inputStyle,
                  height: 'auto',
                  padding: '10px 12px',
                  resize: 'vertical' as const,
                  minHeight: 80,
                }}
              />
            </div>
          </div>

          {/* Payment method */}
          <div
            className="rounded-xl p-6"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Метод на плащане
            </h2>
            <div className="mt-4 space-y-3">
              <label
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors"
                style={{
                  borderColor: paymentMethod === 'cod' ? '#61a229' : '#ddd',
                  background: paymentMethod === 'cod' ? '#f0fce8' : '#fff',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-[#61a229]"
                />
                <div>
                  <span className="text-sm font-semibold">Наложен платеж</span>
                  <p className="text-xs" style={{ color: '#777' }}>Плащате при получаване на куриера</p>
                </div>
              </label>
              <label
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors"
                style={{
                  borderColor: paymentMethod === 'card' ? '#61a229' : '#ddd',
                  background: paymentMethod === 'card' ? '#f0fce8' : '#fff',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="accent-[#61a229]"
                />
                <div>
                  <span className="text-sm font-semibold">Банкова карта</span>
                  <span
                    className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{ background: '#e74c3c' }}
                  >
                    -5% отстъпка
                  </span>
                  <p className="text-xs" style={{ color: '#777' }}>Плащате онлайн с дебитна/кредитна карта</p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{ background: '#fee', color: '#c53030', border: '1px solid #fcc' }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div>
          <div
            className="rounded-xl p-6 sticky top-24"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Вашата поръчка
            </h2>

            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="rounded-md object-cover"
                      style={{ width: 48, height: 48 }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center rounded-md"
                      style={{ width: 48, height: 48, background: '#eee' }}
                    >
                      <ShoppingBag size={18} color="#bbb" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs" style={{ color: '#999' }}>
                      {item.quantity} x {toEur(item.price).toFixed(2)} &euro;
                    </p>
                  </div>
                  <span className="text-sm font-medium shrink-0">
                    {toEur(item.price * item.quantity).toFixed(2)} &euro;
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-sm" style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
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
              {cardDiscount > 0 && (
                <div className="flex justify-between" style={{ color: '#e74c3c' }}>
                  <span>Отстъпка -5% (карта)</span>
                  <span className="font-medium">-{toEur(cardDiscount).toFixed(2)} &euro;</span>
                </div>
              )}
              <div
                className="flex justify-between pt-3 text-base font-bold"
                style={{ borderTop: '1px solid #eee' }}
              >
                <span>Общо</span>
                <span>{toEur(total).toFixed(2)} &euro;</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#61a229' }}
            >
              {loading
                ? (paymentMethod === 'card' ? 'Пренасочване към плащане...' : 'Обработка...')
                : (paymentMethod === 'card' ? 'Плати с карта (-5%)' : 'Поръчай с наложен платеж')
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
