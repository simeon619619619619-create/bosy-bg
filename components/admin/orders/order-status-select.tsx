'use client'

import { useTransition } from 'react'
import { setOrderStatus } from '@/app/admin/orders/actions'

const STATUSES = [
  { value: 'pending', label: 'Чакаща', color: '#f59e0b' },
  { value: 'confirmed', label: 'Потвърдена', color: '#3b82f6' },
  { value: 'shipped', label: 'Изпратена', color: '#f97316' },
  { value: 'delivered', label: 'Доставена', color: '#22c55e' },
  { value: 'cancelled', label: 'Отказана', color: '#ef4444' },
]

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  const current = STATUSES.find((s) => s.value === currentStatus) ?? STATUSES[0]

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    startTransition(async () => {
      await setOrderStatus(orderId, newStatus)
    })
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-full px-2.5 py-1 text-xs font-semibold border-0 cursor-pointer appearance-none"
      style={{
        background: `${current.color}22`,
        color: current.color,
        opacity: isPending ? 0.5 : 1,
        paddingRight: 20,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(current.color)}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 6px center',
      }}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  )
}
