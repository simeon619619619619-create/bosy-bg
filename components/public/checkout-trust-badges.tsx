'use client'

import { Lock, Truck, RotateCcw } from 'lucide-react'

export function CheckoutTrustBadges() {
  return (
    <div className="mt-6 rounded-xl p-5" style={{ background: '#fdf5f0', border: '1px solid #f0e0ed' }}>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <Lock size={18} color="#c77dba" />
          <span className="text-xs font-medium" style={{ color: '#555' }}>
            Сигурно плащане
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Truck size={18} color="#c77dba" />
          <span className="text-xs font-medium" style={{ color: '#555' }}>
            Бърза доставка
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RotateCcw size={18} color="#c77dba" />
          <span className="text-xs font-medium" style={{ color: '#555' }}>
            Лесно връщане
          </span>
        </div>
      </div>
      <p className="mt-3 text-center text-xs" style={{ color: '#999' }}>
        Visa / Mastercard / Наложен платеж
      </p>
    </div>
  )
}
