'use client'

import { useState, useEffect, useCallback } from 'react'

const DURATION_MS = 5 * 60 * 1000 // 5 minutes
const STORAGE_KEY = 'velikden20-expires-at'

export function EasterPopup() {
  const [show, setShow] = useState(false)
  const [seconds, setSeconds] = useState(300)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('easter-popup-seen')) return
    const timer = setTimeout(() => {
      setShow(true)
      sessionStorage.setItem('easter-popup-seen', '1')
      // Start the global countdown (persisted across pages)
      const expiresAt = Date.now() + DURATION_MS
      localStorage.setItem(STORAGE_KEY, String(expiresAt))
      // Notify FloatingTimer
      window.dispatchEvent(new Event('velikden20-started'))
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Countdown timer in popup
  useEffect(() => {
    if (!show) return
    const interval = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [show])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText('VELIKDEN20').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  if (!show) return null

  const min = Math.floor(seconds / 60)
  const sec = seconds % 60

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={() => setShow(false)}
    >
      <div
        className="relative w-full max-w-[440px] rounded-2xl bg-white p-8 text-center"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'popupScale 0.4s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShow(false)}
          className="absolute right-3 top-3 border-none bg-none text-[24px] cursor-pointer z-10"
          style={{ color: '#999' }}
          aria-label="Затвори"
        >
          &times;
        </button>

        {/* Big red Easter egg */}
        <div
          className="mx-auto mb-4"
          style={{
            width: 150,
            height: 190,
            animation: 'eggBounce 2s ease-in-out infinite',
          }}
        >
          <svg viewBox="0 0 100 130" width="150" height="190">
            <defs>
              <radialGradient id="eggGradBig" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="100%" stopColor="#c0392b" />
              </radialGradient>
            </defs>
            <ellipse
              cx="50" cy="70" rx="40" ry="52"
              fill="url(#eggGradBig)"
              stroke="#a93226"
              strokeWidth="1.5"
            />
            <path d="M20 50 Q50 40 80 50" fill="none" stroke="#ffd700" strokeWidth="2.5" />
            <path d="M18 65 Q50 75 82 65" fill="none" stroke="#ffd700" strokeWidth="2.5" />
            <path d="M20 85 Q50 95 80 85" fill="none" stroke="#ffd700" strokeWidth="2.5" />
            <circle cx="35" cy="58" r="2.5" fill="#ffd700" />
            <circle cx="50" cy="54" r="2.5" fill="#ffd700" />
            <circle cx="65" cy="58" r="2.5" fill="#ffd700" />
            <circle cx="32" cy="75" r="2.5" fill="#ffd700" />
            <circle cx="50" cy="80" r="2.5" fill="#ffd700" />
            <circle cx="68" cy="75" r="2.5" fill="#ffd700" />
          </svg>
        </div>

        <h2
          className="mb-3 text-2xl md:text-3xl font-extrabold"
          style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            color: '#222',
          }}
        >
          Великденски подарък
        </h2>

        <p className="mb-3 text-[14px]" style={{ color: '#666' }}>
          Твоят промо код:
        </p>

        <button
          onClick={copyCode}
          className="relative mx-auto mb-2 block rounded-xl px-8 py-4 text-2xl font-extrabold tracking-[0.15em] cursor-pointer border-2 border-dashed"
          style={{
            color: '#c0392b',
            borderColor: '#c0392b',
            background: '#fff5f5',
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            animation: 'codeGlow 2s ease-in-out infinite',
          }}
        >
          VELIKDEN20
        </button>

        <p className="mb-1 text-[13px] font-semibold" style={{ color: copied ? '#22c55e' : '#888' }}>
          {copied ? '✓ Копирано!' : 'Натисни за копиране'}
        </p>

        <p
          className="mb-5 text-[15px] font-bold"
          style={{ color: seconds <= 60 ? '#e74c3c' : '#c77dba' }}
        >
          Валиден още {min}:{sec.toString().padStart(2, '0')} мин
        </p>

        <button
          onClick={() => setShow(false)}
          className="inline-block rounded-full px-10 py-3.5 text-[15px] font-bold uppercase tracking-wider text-white cursor-pointer border-none"
          style={{
            background: 'linear-gradient(135deg, #c77dba 0%, #f472b6 50%, #60a5fa 100%)',
          }}
        >
          Продължи
        </button>
      </div>

      <style>{`
        @keyframes popupScale {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes eggBounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes codeGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(199, 125, 186, 0.3); }
          50% { box-shadow: 0 0 20px rgba(199, 125, 186, 0.6), 0 0 40px rgba(244, 114, 182, 0.2); }
        }
      `}</style>
    </div>
  )
}
