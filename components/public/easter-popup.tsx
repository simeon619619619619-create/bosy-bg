'use client'

import { useState, useEffect, useCallback } from 'react'

const DURATION_MS = 5 * 60 * 1000
const STORAGE_KEY = 'velikden20-expires-at'

export function EasterPopup() {
  const [show, setShow] = useState(false)
  const [cracked, setCracked] = useState(false)
  const [seconds, setSeconds] = useState(300)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('easter-popup-seen')) return
    const timer = setTimeout(() => {
      setShow(true)
      sessionStorage.setItem('easter-popup-seen', '1')
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // After egg appears, wait then crack
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => {
      setCracked(true)
      const expiresAt = Date.now() + DURATION_MS
      localStorage.setItem(STORAGE_KEY, String(expiresAt))
      window.dispatchEvent(new Event('velikden20-started'))
    }, 1500)
    return () => clearTimeout(t)
  }, [show])

  // Countdown
  useEffect(() => {
    if (!cracked) return
    const interval = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [cracked])

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
          minHeight: cracked ? 'auto' : 380,
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

        {/* Easter egg — big at first, shrinks after crack */}
        <div
          className="mx-auto transition-all duration-500"
          style={{
            width: cracked ? 100 : 220,
            height: cracked ? 130 : 285,
            marginBottom: cracked ? 16 : 40,
            marginTop: cracked ? 0 : 30,
            animation: cracked ? 'none' : 'eggBounce 1.8s ease-in-out infinite',
            position: 'relative',
          }}
        >
          <svg viewBox="0 0 100 130" width="100%" height="100%">
            <defs>
              <radialGradient id="eggGradBig" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="100%" stopColor="#c0392b" />
              </radialGradient>
            </defs>
            {!cracked ? (
              <>
                <ellipse cx="50" cy="70" rx="40" ry="52" fill="url(#eggGradBig)" stroke="#a93226" strokeWidth="1.5" />
                <path d="M20 50 Q50 40 80 50" fill="none" stroke="#ffd700" strokeWidth="2.5" />
                <path d="M18 65 Q50 75 82 65" fill="none" stroke="#ffd700" strokeWidth="2.5" />
                <path d="M20 85 Q50 95 80 85" fill="none" stroke="#ffd700" strokeWidth="2.5" />
                <circle cx="35" cy="58" r="2.5" fill="#ffd700" />
                <circle cx="50" cy="54" r="2.5" fill="#ffd700" />
                <circle cx="65" cy="58" r="2.5" fill="#ffd700" />
                <circle cx="32" cy="75" r="2.5" fill="#ffd700" />
                <circle cx="50" cy="80" r="2.5" fill="#ffd700" />
                <circle cx="68" cy="75" r="2.5" fill="#ffd700" />
              </>
            ) : (
              <>
                {/* Top half — moved up */}
                <g style={{ animation: 'eggTop 0.6s ease-out forwards' }}>
                  <path
                    d="M 10 70 Q 10 18, 50 18 Q 90 18, 90 70 L 85 68 L 75 75 L 65 68 L 55 75 L 45 68 L 35 75 L 25 68 L 15 75 Z"
                    fill="url(#eggGradBig)"
                    stroke="#a93226"
                    strokeWidth="1.5"
                  />
                  <path d="M20 50 Q50 40 80 50" fill="none" stroke="#ffd700" strokeWidth="2.5" />
                  <circle cx="35" cy="58" r="2.5" fill="#ffd700" />
                  <circle cx="50" cy="54" r="2.5" fill="#ffd700" />
                  <circle cx="65" cy="58" r="2.5" fill="#ffd700" />
                </g>
                {/* Bottom half — stays */}
                <g style={{ animation: 'eggBottom 0.6s ease-out forwards' }}>
                  <path
                    d="M 15 75 L 25 68 L 35 75 L 45 68 L 55 75 L 65 68 L 75 75 L 85 68 L 90 70 Q 90 122, 50 122 Q 10 122, 10 70 Z"
                    fill="url(#eggGradBig)"
                    stroke="#a93226"
                    strokeWidth="1.5"
                  />
                  <path d="M18 88 Q50 98 82 88" fill="none" stroke="#ffd700" strokeWidth="2.5" />
                  <circle cx="32" cy="95" r="2.5" fill="#ffd700" />
                  <circle cx="50" cy="100" r="2.5" fill="#ffd700" />
                  <circle cx="68" cy="95" r="2.5" fill="#ffd700" />
                </g>
              </>
            )}
          </svg>
        </div>

        {/* Content only after crack */}
        {cracked && (
          <div style={{ animation: 'fadeIn 0.5s ease 0.4s both' }}>
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

            <p
              className="mb-1 text-[13px] font-semibold"
              style={{ color: copied ? '#22c55e' : '#888' }}
            >
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
        )}
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
        @keyframes eggTop {
          from { transform: translateY(0) rotate(0); opacity: 1; }
          to { transform: translateY(-30px) rotate(-15deg); opacity: 0; }
        }
        @keyframes eggBottom {
          from { transform: translateY(0); }
          to { transform: translateY(5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes codeGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(199, 125, 186, 0.3); }
          50% { box-shadow: 0 0 20px rgba(199, 125, 186, 0.6), 0 0 40px rgba(244, 114, 182, 0.2); }
        }
      `}</style>
    </div>
  )
}
