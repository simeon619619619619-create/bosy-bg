'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

export function ExitIntentPopup() {
  const [show, setShow] = useState(false)
  const pathname = usePathname()

  const shouldSuppress = pathname === '/checkout' || pathname === '/cart'

  const triggerPopup = useCallback(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('exit-intent-shown')) return
    if (sessionStorage.getItem('promo-shown')) return
    setShow(true)
    sessionStorage.setItem('exit-intent-shown', '1')
  }, [])

  useEffect(() => {
    if (shouldSuppress) return

    // Desktop: mouse leaves toward top
    function handleMouseOut(e: MouseEvent) {
      if (e.clientY < 10) {
        triggerPopup()
      }
    }

    // Mobile: scroll up after scrolling 30%+
    let maxScroll = 0
    function handleScroll() {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent
      }
      // If user scrolled at least 30% and is now scrolling up
      if (maxScroll >= 0.3 && scrollPercent < maxScroll - 0.05) {
        triggerPopup()
      }
    }

    document.addEventListener('mouseout', handleMouseOut)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      document.removeEventListener('mouseout', handleMouseOut)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [shouldSuppress, triggerPopup])

  if (!show || shouldSuppress) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={() => setShow(false)}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShow(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          aria-label="Затвори"
        >
          <X size={20} color="#999" />
        </button>

        <h2
          className="mb-2 text-2xl font-bold"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', color: '#333' }}
        >
          Чакай! Вземи 20% отстъпка
        </h2>
        <p className="mb-6 text-sm" style={{ color: '#666' }}>
          Използвай кода по-долу при поръчка и получи 20% отстъпка на всички продукти.
        </p>

        <div
          className="mx-auto mb-6 inline-block rounded-lg px-8 py-4"
          style={{ background: '#f3e5f0', border: '2px dashed #c77dba' }}
        >
          <span
            className="text-3xl font-extrabold tracking-wider"
            style={{ color: '#c77dba', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
          >
            WELCOME20
          </span>
        </div>

        <div>
          <a
            href="/shop"
            className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#c77dba' }}
          >
            Пазарувай с отстъпка
          </a>
        </div>
      </div>
    </div>
  )
}
