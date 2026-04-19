'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function NewsletterPopup() {
  const [show, setShow] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = sessionStorage.getItem('promo-dismissed')
    if (dismissed) return

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      setTimeout(() => setShow(true), 15000)
    })
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

        {isLoggedIn ? (
          <>
            <p
              className="text-2xl font-extrabold"
              style={{
                color: '#c77dba',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              }}
            >
              BOSY Club
            </p>
            <p
              className="mt-2 text-base font-bold"
              style={{
                color: '#333',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              }}
            >
              Като член получаваш достъп до:
            </p>
            <ul className="mt-4 text-left text-sm space-y-3" style={{ color: '#555' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: '#c77dba', fontWeight: 'bold', fontSize: 18, lineHeight: '20px' }}>&#10003;</span>
                <span><strong>Безплатни спортни събития</strong> с общността</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#c77dba', fontWeight: 'bold', fontSize: 18, lineHeight: '20px' }}>&#10003;</span>
                <span><strong>Практики по себеопознаване</strong> и личностно развитие</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#c77dba', fontWeight: 'bold', fontSize: 18, lineHeight: '20px' }}>&#10003;</span>
                <span><strong>Ексклузивни отстъпки</strong> и ранен достъп до нови продукти</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#c77dba', fontWeight: 'bold', fontSize: 18, lineHeight: '20px' }}>&#10003;</span>
                <span><strong>Още бонуси</strong> — подаръци, безплатна доставка и изненади</span>
              </li>
            </ul>
            <div className="mt-5">
              <a
                href="/bosy-club"
                className="inline-block w-full rounded-lg py-3 text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                style={{ background: '#c77dba' }}
              >
                Виж повече
              </a>
            </div>
          </>
        ) : (
          <>
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
            <div className="mt-5 flex flex-col gap-2">
              <a
                href="/register"
                className="inline-block w-full rounded-lg py-3 text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                style={{ background: '#c77dba' }}
              >
                Регистрирай се
              </a>
              <a
                href="/account/login"
                className="inline-block w-full rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#f3e5f0', color: '#c77dba' }}
              >
                Имам акаунт
              </a>
            </div>
          </>
        )}

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
