'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

export function EasterPopup() {
  const [show, setShow] = useState(false)
  const [cracked, setCracked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [seconds, setSeconds] = useState(300) // 5 minutes

  useEffect(() => {
    if (sessionStorage.getItem('easter-popup-seen')) return
    const timer = setTimeout(() => {
      setShow(true)
      sessionStorage.setItem('easter-popup-seen', '1')
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Crack egg after popup appears
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setCracked(true), 800)
    return () => clearTimeout(t)
  }, [show])

  // Reveal code after crack
  useEffect(() => {
    if (!cracked) return
    const t = setTimeout(() => setRevealed(true), 600)
    return () => clearTimeout(t)
  }, [cracked])

  // Countdown timer
  useEffect(() => {
    if (!revealed) return
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [revealed])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText('VELIKDEN20').catch(() => {})
  }, [])

  if (!show) return null

  const min = Math.floor(seconds / 60)
  const sec = seconds % 60

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={() => setShow(false)}
    >
      <div
        className="relative w-[90%] max-w-[420px] rounded-2xl bg-white p-10 text-center overflow-hidden"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'popupScale 0.4s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShow(false)}
          className="absolute right-3.5 top-3 border-none bg-none text-[22px] cursor-pointer z-10"
          style={{ color: '#999' }}
          aria-label="Затвори"
        >
          &times;
        </button>

        {/* Egg animation */}
        <div className="relative mx-auto mb-4" style={{ width: 120, height: 140 }}>
          {/* Sparkles behind egg */}
          {cracked && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(8)].map((_, i) => (
                <span
                  key={i}
                  className="absolute"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: ['#f472b6', '#fbbf24', '#c77dba', '#60a5fa'][i % 4],
                    animation: `sparkle 1s ease-out ${i * 0.1}s forwards`,
                    transform: `rotate(${i * 45}deg) translateY(-50px)`,
                    opacity: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* Egg */}
          <div
            className="relative mx-auto transition-all duration-500"
            style={{
              width: 90,
              height: 120,
              fontSize: cracked ? 0 : 90,
              lineHeight: '120px',
              textAlign: 'center',
              filter: cracked ? 'blur(2px)' : 'none',
              opacity: cracked ? 0 : 1,
              transform: cracked ? 'scale(1.3)' : 'scale(1)',
            }}
          >
            {/* Red Easter egg using SVG */}
            <svg viewBox="0 0 100 130" width="90" height="120">
              <defs>
                <radialGradient id="eggGrad" cx="40%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#ff6b6b" />
                  <stop offset="100%" stopColor="#c0392b" />
                </radialGradient>
              </defs>
              <ellipse
                cx="50" cy="70" rx="40" ry="52"
                fill="url(#eggGrad)"
                stroke="#a93226"
                strokeWidth="1.5"
              />
              {/* Decorative lines */}
              <path d="M20 55 Q50 45 80 55" fill="none" stroke="#ffd700" strokeWidth="2.5" />
              <path d="M18 70 Q50 80 82 70" fill="none" stroke="#ffd700" strokeWidth="2.5" />
              {/* Dots */}
              <circle cx="35" cy="62" r="3" fill="#ffd700" />
              <circle cx="50" cy="58" r="3" fill="#ffd700" />
              <circle cx="65" cy="62" r="3" fill="#ffd700" />
            </svg>

            {/* Crack overlay */}
            {cracked && (
              <svg
                viewBox="0 0 100 130"
                width="90" height="120"
                className="absolute inset-0"
                style={{ animation: 'crackAppear 0.3s ease forwards' }}
              >
                <path
                  d="M45 20 L50 45 L40 55 L55 70 L42 85 L50 110"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>

          {/* Revealed gift emoji */}
          {cracked && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                fontSize: 60,
                animation: 'giftReveal 0.5s ease 0.3s both',
              }}
            >
              &#127873;
            </div>
          )}
        </div>

        {/* Title */}
        <h2
          className="mb-2 text-2xl font-extrabold"
          style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            color: '#222',
          }}
        >
          Великденски подарък
        </h2>

        {/* Promo code reveal */}
        {revealed ? (
          <>
            <p className="mb-3 text-[14px]" style={{ color: '#666' }}>
              Твоят промо код:
            </p>
            <button
              onClick={copyCode}
              className="relative mx-auto mb-3 block rounded-xl px-8 py-3 text-2xl font-extrabold tracking-[0.15em] cursor-pointer border-2 border-dashed"
              style={{
                color: '#c0392b',
                borderColor: '#c0392b',
                background: '#fff5f5',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                animation: 'codeGlow 2s ease-in-out infinite',
              }}
            >
              VELIKDEN20
              {/* Sparkle dots around code */}
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="absolute"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: ['#fbbf24', '#f472b6', '#c77dba'][i % 3],
                    top: `${[0, 0, 50, 100, 100, 50][i]}%`,
                    left: `${[-4, 104, 104, 104, -4, -4][i]}%`,
                    animation: `twinkle 1.5s ease-in-out ${i * 0.25}s infinite`,
                  }}
                />
              ))}
            </button>
            <p className="mb-1 text-[13px] font-semibold" style={{ color: '#888' }}>
              Натисни за копиране
            </p>
            <p
              className="mb-5 text-[15px] font-bold"
              style={{ color: seconds <= 60 ? '#e74c3c' : '#c77dba' }}
            >
              Валиден още {min}:{sec.toString().padStart(2, '0')} мин
            </p>
          </>
        ) : (
          <p className="mb-6 text-[15px] leading-relaxed" style={{ color: '#666' }}>
            за всяка поръчка!
          </p>
        )}

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
        @keyframes sparkle {
          0% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(0) scale(0); }
          50% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(-40px) scale(1.5); }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-70px) scale(0); }
        }
        @keyframes giftReveal {
          from { transform: scale(0) rotate(-20deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes crackAppear {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes codeGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(199, 125, 186, 0.3); }
          50% { box-shadow: 0 0 20px rgba(199, 125, 186, 0.6), 0 0 40px rgba(244, 114, 182, 0.2); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}
