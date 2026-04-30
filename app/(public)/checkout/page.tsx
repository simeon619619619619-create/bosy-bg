'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft, Home, Building2, Package } from 'lucide-react'
import { useCart } from '@/components/public/cart-provider'
import { createOrder, lookupCashback, getCashbackPercent } from './actions'
import { validatePromoCode } from '@/app/admin/promo-codes/actions'
import { toEur } from '@/lib/currency'
import { SpeedyOfficeSelector } from '@/components/checkout/speedy-office-selector'
import { BoxNowLockerSelector } from '@/components/checkout/boxnow-locker-selector'
import { CheckoutTrustBadges } from '@/components/public/checkout-trust-badges'

interface SelectedOffice {
  id: number
  name: string
  address: string
}

const SHIPPING_THRESHOLD = 99.99 * 1.95583 // 99.99€ in BGN
const SHIPPING_COST = 3.99 * 1.95583 // 3.99€ in BGN

interface CustomerProfile {
  name: string
  email: string
  phone: string | null
  city: string
  street: string
  zip: string
  cashback_balance: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getCartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod')
  const [cashbackBalance, setCashbackBalance] = useState(0)
  const [useCashback, setUseCashback] = useState(false)
  const [cashbackChecked, setCashbackChecked] = useState(false)
  const [cashbackLoading, setCashbackLoading] = useState(false)
  const [cashbackPercent, setCashbackPercent] = useState(5)
  const [prefilled, setPrefilled] = useState<CustomerProfile | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount_type: string; discount_value: number } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [deliveryType, setDeliveryType] = useState<'address' | 'office' | 'boxnow'>('address')
  const [selectedOffice, setSelectedOffice] = useState<SelectedOffice | null>(null)
  const [selectedBoxNow, setSelectedBoxNow] = useState<{
    id: string
    name: string
    address: string
    postalCode: string
  } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-fill from logged-in customer
  useEffect(() => {
    fetch('/api/customer/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.customer) {
          const c = data.customer as CustomerProfile
          setPrefilled(c)
          setCashbackBalance(c.cashback_balance)
          if (c.cashback_balance > 0) setCashbackChecked(true)
          getCashbackPercent().then((pct) => setCashbackPercent(pct)).catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  const subtotal = getCartTotal()
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const codFee = paymentMethod === 'cod' ? 0.99 * 1.95583 : 0 // 0.99 EUR in BGN
  // Promo code and card discount cannot be combined
  const hasPromo = !!promoApplied
  const cardDiscount = (paymentMethod === 'card' && !hasPromo) ? subtotal * 0.05 : 0
  const hasSaleItems = items.some(i => i.compare_at_price && i.compare_at_price > i.price)
  const promoDiscount = (promoApplied && !hasSaleItems)
    ? promoApplied.discount_type === 'percent'
      ? subtotal * (promoApplied.discount_value / 100)
      : promoApplied.discount_value
    : 0
  const maxBeforeCashback = subtotal + shipping + codFee - cardDiscount - promoDiscount
  const cashbackApplied = useCashback ? Math.min(cashbackBalance, maxBeforeCashback) : 0
  const total = Math.max(0, maxBeforeCashback - cashbackApplied)
  const cashbackEarned = Math.round(total * cashbackPercent) / 100

  async function handleApplyPromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError(null)
    try {
      const emailEl = formRef.current?.querySelector<HTMLInputElement>('input[name="email"]')
      const customerEmail = emailEl?.value?.trim() || prefilled?.email || ''
      const result = await validatePromoCode(promoCode, subtotal, customerEmail, hasSaleItems)
      if (result.valid) {
        setPromoApplied({
          code: result.code!,
          discount_type: result.discount_type!,
          discount_value: result.discount_value!,
        })
        setPromoError(null)
      } else {
        setPromoError(result.error || 'Невалиден код')
        setPromoApplied(null)
      }
    } catch {
      setPromoError('Грешка при проверка')
    } finally {
      setPromoLoading(false)
    }
  }

  async function handleEmailBlur(e: React.FocusEvent<HTMLInputElement>) {
    const email = e.target.value.trim()
    if (!email || cashbackChecked) return
    setCashbackLoading(true)
    try {
      const [{ balance }, pct] = await Promise.all([
        lookupCashback(email),
        getCashbackPercent(),
      ])
      setCashbackBalance(balance)
      setCashbackPercent(pct)
      setCashbackChecked(true)
    } catch {
      // ignore lookup errors
    } finally {
      setCashbackLoading(false)
    }
  }

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
          style={{ background: '#c77dba' }}
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
    const notes = form.get('notes') as string

    // Validate delivery method
    let city = ''
    let address = ''
    let postalCode = ''
    let officeId: number | null = null

    if (deliveryType === 'address') {
      city = (form.get('city') as string) ?? ''
      address = (form.get('address') as string) ?? ''
      postalCode = (form.get('postalCode') as string) ?? ''
      if (!city || !address) {
        setError('Моля, попълнете град и адрес за доставка')
        setLoading(false)
        return
      }
    } else if (deliveryType === 'boxnow') {
      if (!selectedBoxNow) {
        setError('Моля, изберете автомат на BoxNow')
        setLoading(false)
        return
      }
      city = `BoxNow: ${selectedBoxNow.name}`
      address = selectedBoxNow.address
      postalCode = selectedBoxNow.postalCode
    } else {
      if (!selectedOffice) {
        setError('Моля, изберете офис на Speedy за доставка')
        setLoading(false)
        return
      }
      officeId = selectedOffice.id
      city = `Speedy офис: ${selectedOffice.name}`
      address = selectedOffice.address
    }

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
        promoCode: promoApplied?.code || null,
        promoDiscount,
        cashbackUsed: cashbackApplied,
        deliveryType,
        speedyOfficeId: officeId,
        boxnowLockerId: selectedBoxNow?.id ?? null,
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
        style={{ color: '#c77dba' }}
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

      <form ref={formRef} onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
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
                  defaultValue={prefilled?.name ?? ''}
                  key={`name-${prefilled?.name ?? ''}`}
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
                  onBlur={handleEmailBlur}
                  defaultValue={prefilled?.email ?? ''}
                  key={`email-${prefilled?.email ?? ''}`}
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
                  defaultValue={prefilled?.phone ?? ''}
                  key={`phone-${prefilled?.phone ?? ''}`}
                />
              </div>
            </div>
          </div>

          {/* Delivery method + address */}
          <div
            className="rounded-xl p-6"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Доставка
            </h2>

            {/* Delivery type radio */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setDeliveryType('address')}
                className="flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all"
                style={{
                  borderColor: deliveryType === 'address' ? '#c77dba' : '#e5e7eb',
                  backgroundColor: deliveryType === 'address' ? '#f0fdf4' : '#fff',
                }}
              >
                <Home
                  className="h-5 w-5 shrink-0"
                  style={{ color: deliveryType === 'address' ? '#c77dba' : '#9ca3af' }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#111' }}>
                    До адрес
                  </p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    Доставка от куриер
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('office')}
                className="flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all"
                style={{
                  borderColor: deliveryType === 'office' ? '#c77dba' : '#e5e7eb',
                  backgroundColor: deliveryType === 'office' ? '#f0fdf4' : '#fff',
                }}
              >
                <Building2
                  className="h-5 w-5 shrink-0"
                  style={{ color: deliveryType === 'office' ? '#c77dba' : '#9ca3af' }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#111' }}>
                    До офис на Speedy
                  </p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    Вземане от офис
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('boxnow')}
                className="flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all"
                style={{
                  borderColor: deliveryType === 'boxnow' ? '#4caf50' : '#e5e7eb',
                  backgroundColor: deliveryType === 'boxnow' ? '#e8f5e9' : '#fff',
                }}
              >
                <Package
                  className="h-5 w-5 shrink-0"
                  style={{ color: deliveryType === 'boxnow' ? '#4caf50' : '#9ca3af' }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#111' }}>
                    До автомат BoxNow
                  </p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    24/7 вземане
                  </p>
                </div>
              </button>
            </div>

            {/* Address fields / office selector / BoxNow */}
            {deliveryType === 'address' ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                    defaultValue={prefilled?.city ?? ''}
                    key={`city-${prefilled?.city ?? ''}`}
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
                    defaultValue={prefilled?.zip ?? ''}
                    key={`zip-${prefilled?.zip ?? ''}`}
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
                    defaultValue={prefilled?.street ?? ''}
                    key={`street-${prefilled?.street ?? ''}`}
                  />
                </div>
              </div>
            ) : deliveryType === 'boxnow' ? (
              <div className="mt-5">
                <BoxNowLockerSelector
                  onSelect={setSelectedBoxNow}
                  selected={selectedBoxNow}
                />
              </div>
            ) : (
              <div className="mt-5">
                <SpeedyOfficeSelector
                  initialCity={prefilled?.city ?? ''}
                  selectedOfficeId={selectedOffice?.id ?? null}
                  onSelect={(office) =>
                    setSelectedOffice({
                      id: office.id,
                      name: office.name,
                      address: office.address,
                    })
                  }
                />
                {selectedOffice && (
                  <div
                    className="mt-3 rounded-lg border p-3 text-xs"
                    style={{
                      borderColor: '#c77dba',
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                    }}
                  >
                    Избран офис: <strong>{selectedOffice.name}</strong>
                    {selectedOffice.address && ` — ${selectedOffice.address}`}
                  </div>
                )}
              </div>
            )}
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
                  borderColor: paymentMethod === 'cod' ? '#c77dba' : '#ddd',
                  background: paymentMethod === 'cod' ? '#f0fce8' : '#fff',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-[#c77dba]"
                />
                <div>
                  <span className="text-sm font-semibold">Наложен платеж</span>
                  <p className="text-xs" style={{ color: '#777' }}>Плащате при получаване на куриер Speedy (+0.99 &euro;)</p>
                </div>
              </label>
              <label
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors"
                style={{
                  borderColor: paymentMethod === 'card' ? '#c77dba' : '#ddd',
                  background: paymentMethod === 'card' ? '#f0fce8' : '#fff',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="accent-[#c77dba]"
                />
                <div>
                  <span className="text-sm font-semibold">Банкова карта</span>
                  <span
                    className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{ background: '#e74c3c' }}
                  >
                    -5% отстъпка
                  </span>
                  <p className="text-xs" style={{ color: '#777' }}>
                    Плащате онлайн с дебитна/кредитна карта
                    {hasPromo && ' (не се комбинира с промо код)'}
                  </p>
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

            {/* Promo code */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #eee' }}>
              {promoApplied ? (
                <div className="flex items-center justify-between rounded-lg p-2" style={{ background: '#f0fce8', border: '1px solid #d4edbc' }}>
                  <span className="text-sm font-medium" style={{ color: '#16a34a' }}>
                    Промо код: <span className="font-mono font-bold">{promoApplied.code}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setPromoApplied(null); setPromoCode('') }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Премахни
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 min-w-0">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Промо код"
                    className="min-w-0 flex-1 rounded-md border px-3 py-1.5 text-sm font-mono uppercase"
                    style={{ borderColor: promoError ? '#e74c3c' : '#ddd' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo() } }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#c77dba' }}
                  >
                    {promoLoading ? '...' : 'Приложи'}
                  </button>
                </div>
              )}
              {promoError && <p className="mt-1 text-xs" style={{ color: '#e74c3c' }}>{promoError}</p>}
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
              {codFee > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: '#777' }}>Наложен платеж (Speedy)</span>
                  <span className="font-medium">+{toEur(codFee).toFixed(2)} &euro;</span>
                </div>
              )}
              {cardDiscount > 0 && (
                <div className="flex justify-between" style={{ color: '#e74c3c' }}>
                  <span>Отстъпка -5% (карта)</span>
                  <span className="font-medium">-{toEur(cardDiscount).toFixed(2)} &euro;</span>
                </div>
              )}
              {promoDiscount > 0 && (
                <div className="flex justify-between" style={{ color: '#16a34a' }}>
                  <span>Промо код ({promoApplied!.code})</span>
                  <span className="font-medium">-{toEur(promoDiscount).toFixed(2)} &euro;</span>
                </div>
              )}

              {/* Cashback section */}
              {cashbackBalance > 0 && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: '#f0fce8', border: '1px solid #d4edbc' }}
                >
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useCashback}
                      onChange={(e) => setUseCashback(e.target.checked)}
                      className="accent-[#c77dba]"
                    />
                    <span className="text-sm font-medium" style={{ color: '#333' }}>
                      Използвай кешбак баланс
                    </span>
                  </label>
                  <p className="mt-1 text-xs" style={{ color: '#c77dba' }}>
                    Наличен баланс: {toEur(cashbackBalance).toFixed(2)} &euro;
                  </p>
                  {useCashback && cashbackApplied > 0 && (
                    <div className="mt-1 flex justify-between text-sm font-medium" style={{ color: '#c77dba' }}>
                      <span>Кешбак отстъпка</span>
                      <span>-{toEur(cashbackApplied).toFixed(2)} &euro;</span>
                    </div>
                  )}
                </div>
              )}
              {cashbackLoading && (
                <p className="text-xs" style={{ color: '#999' }}>Проверка на кешбак баланс...</p>
              )}

              <div
                className="flex justify-between pt-3 text-base font-bold"
                style={{ borderTop: '1px solid #eee' }}
              >
                <span>Общо</span>
                <span>{toEur(total).toFixed(2)} &euro;</span>
              </div>

              {/* Cashback earned info */}
              {cashbackEarned > 0 && (
                <p className="text-xs" style={{ color: '#c77dba' }}>
                  С тази поръчка ще спечелите {toEur(cashbackEarned).toFixed(2)} &euro; кешбак!
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#c77dba' }}
            >
              {loading
                ? (paymentMethod === 'card' ? 'Пренасочване към плащане...' : 'Обработка...')
                : (paymentMethod === 'card' ? 'Плати с карта (-5%)' : 'Поръчай с наложен платеж')
              }
            </button>
            <CheckoutTrustBadges />
          </div>
        </div>
      </form>
    </div>
  )
}
