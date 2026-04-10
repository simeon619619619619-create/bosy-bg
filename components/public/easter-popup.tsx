'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function EasterPopup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('easter-popup-seen')) return
    const timer = setTimeout(() => {
      setShow(true)
      sessionStorage.setItem('easter-popup-seen', '1')
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={() => setShow(false)}
    >
      <div
        className="relative w-[90%] max-w-[400px] rounded-2xl bg-white p-10 text-center"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'popupScale 0.4s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShow(false)}
          className="absolute right-3.5 top-3 border-none bg-none text-[22px] cursor-pointer"
          style={{ color: '#999' }}
          aria-label="Затвори"
        >
          &times;
        </button>
        <div className="mb-3 text-[52px]">&#127873;</div>
        <h2
          className="mb-2 text-2xl font-extrabold"
          style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            color: '#222',
          }}
        >
          Великденски подарък
        </h2>
        <p className="mb-6 text-[15px] leading-relaxed" style={{ color: '#666' }}>
          за всяка поръчка!
        </p>
        <Link
          href="/shop"
          onClick={() => setShow(false)}
          className="inline-block rounded-full px-10 py-3.5 text-[15px] font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #c77dba 0%, #f472b6 50%, #60a5fa 100%)',
            textDecoration: 'none',
          }}
        >
          Към магазина
        </Link>
      </div>
      <style>{`
        @keyframes popupScale {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
