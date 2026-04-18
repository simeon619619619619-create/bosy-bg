'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export function NewsletterPopup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = sessionStorage.getItem('promo-dismissed')
    if (dismissed) return

    const timer = setTimeout(() => setShow(true), 15000)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setShow(false)
    sessionStorage.setItem('promo-dismissed', '1')
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Затвори"
        >
          <X size={20} />
        </button>

        <p
          className="text-3xl font-extrabold"
          style={{
            color: '#c77dba',
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          }}
        >
          -20%
        </p>
        <p
          className="mt-2 text-xl font-bold"
          style={{
            color: '#333',
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          }}
        >
          за целия април
        </p>
        <p className="mt-3 text-sm" style={{ color: '#666' }}>
          Направи си безплатна регистрация и ще получиш промо код за 20% отстъпка на имейла си.
        </p>
        <div className="mt-5">
          <a
            href="/register"
            className="inline-block w-full rounded-lg py-3 text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            style={{ background: '#c77dba' }}
          >
            Регистрирай се
          </a>
        </div>
        <button
          onClick={handleClose}
          className="mt-3 text-xs underline"
          style={{ color: '#aaa' }}
        >
          Не, благодаря
        </button>
      </div>
    </div>
  )
}
