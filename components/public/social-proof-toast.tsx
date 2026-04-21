'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

const NAMES = ['Мария', 'Елена', 'Габриела', 'Христина', 'Росица', 'Велина', 'Ива', 'Светослав', 'Димитър', 'Георги']
const CITIES = ['София', 'Пловдив', 'Варна', 'Бургас', 'Стара Загора', 'Русе', 'Плевен']
const PRODUCTS = [
  'BOSY Bubbles — Dragon Fruit',
  'Protein Bar',
  'Africa Balls x16',
  'Macadamia Cream',
  'DETOX ME BABY',
  'FitBody 4x4',
]
const TIMES = ['преди 2 мин', 'преди 5 мин', 'преди 12 мин']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function SocialProofToast() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shouldSuppress = pathname === '/checkout' || pathname === '/cart'

  const showToast = useCallback(() => {
    const name = pick(NAMES)
    const city = pick(CITIES)
    const product = pick(PRODUCTS)
    const time = pick(TIMES)
    setMessage(`${name} от ${city} купи ${product} ${time}`)
    setVisible(true)
    setTimeout(() => setVisible(false), 4000)
  }, [])

  const scheduleNext = useCallback(() => {
    const delay = (25 + Math.random() * 15) * 1000 // 25-40s
    timerRef.current = setTimeout(() => {
      showToast()
      scheduleNext()
    }, delay)
  }, [showToast])

  useEffect(() => {
    if (shouldSuppress) return
    // Initial delay 25-40s
    scheduleNext()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [shouldSuppress, scheduleNext])

  if (shouldSuppress || !visible) return null

  return (
    <div
      className="fixed bottom-4 left-4 z-[9990] max-w-xs rounded-xl px-4 py-3 text-sm"
      style={{
        background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        color: '#333',
        animation: 'slideInLeft 0.3s ease-out',
        border: '1px solid #f0e0ed',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white"
          style={{ background: '#c77dba' }}
        >
          &#10003;
        </span>
        <span style={{ lineHeight: 1.4 }}>{message}</span>
      </div>
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
