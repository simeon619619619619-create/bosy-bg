'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export function NewsletterPopup() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = sessionStorage.getItem('newsletter-dismissed')
    const subscribed = localStorage.getItem('newsletter-subscribed')
    if (dismissed || subscribed) return

    const timer = setTimeout(() => setShow(true), 15000)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setShow(false)
    sessionStorage.setItem('newsletter-dismissed', '1')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'newsletter-popup' }),
      })
      if (res.ok) {
        setSubmitted(true)
        localStorage.setItem('newsletter-subscribed', '1')
        setTimeout(() => setShow(false), 3000)
      }
    } catch {
      // silently fail
    }
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

        {submitted ? (
          <div className="py-6">
            <p className="text-2xl font-bold" style={{ color: '#333' }}>
              Благодарим!
            </p>
            <p className="mt-2 text-sm" style={{ color: '#666' }}>
              Ще получиш промоции и новини на имейла си.
            </p>
          </div>
        ) : (
          <>
            <p
              className="text-2xl font-extrabold"
              style={{
                color: '#333',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              }}
            >
              Вземи 10% отстъпка
            </p>
            <p className="mt-2 text-sm" style={{ color: '#666' }}>
              Запиши се за нашия бюлетин и получи код за 10% при първата поръчка.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="Твоят имейл"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
                style={{
                  borderColor: '#e5e5e5',
                  color: '#333',
                  background: '#fafafa',
                }}
              />
              <button
                type="submit"
                className="w-full rounded-lg py-3 text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                style={{ background: '#c77dba' }}
              >
                Искам 10% отстъпка
              </button>
            </form>
            <p className="mt-3 text-xs" style={{ color: '#aaa' }}>
              Без спам. Отписване по всяко време.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
