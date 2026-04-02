'use client'

import { useState } from 'react'
import { togglePromoCode } from '@/app/admin/promo-codes/actions'

export function PromoCodeToggle({ id, active }: { id: string; active: boolean }) {
  const [isActive, setIsActive] = useState(active)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      await togglePromoCode(id, !isActive)
      setIsActive(!isActive)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
        isActive
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {loading ? '...' : isActive ? 'Активен' : 'Неактивен'}
    </button>
  )
}
