'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'velikden20-expires-at'

export function FloatingTimer() {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    function checkExpiry() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setRemaining(null)
        return
      }
      const expires = parseInt(raw, 10)
      const ms = expires - Date.now()
      if (ms <= 0) {
        localStorage.removeItem(STORAGE_KEY)
        setRemaining(null)
        return
      }
      setRemaining(Math.floor(ms / 1000))
    }

    checkExpiry()
    const interval = setInterval(checkExpiry, 1000)

    // React when popup starts the timer
    const onStart = () => checkExpiry()
    window.addEventListener('velikden20-started', onStart)

    return () => {
      clearInterval(interval)
      window.removeEventListener('velikden20-started', onStart)
    }
  }, [])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText('VELIKDEN20').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  if (remaining === null) return null

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60
  const urgent = remaining <= 60

  return (
    <div
      className="fixed z-[9998]"
      style={{
        bottom: 20,
        right: 20,
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      <div
        className="rounded-2xl overflow-hidden transition-all"
        style={{
          background: urgent ? '#fff1f1' : '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: `2px solid ${urgent ? '#e74c3c' : '#c77dba'}`,
        }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 px-4 py-3 w-full cursor-pointer border-none bg-transparent"
          aria-label="Покажи промо код"
        >
          <span style={{ fontSize: 24 }}>&#127873;</span>
          <div className="flex flex-col items-start leading-tight">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: urgent ? '#e74c3c' : '#c77dba' }}
            >
              VELIKDEN20 · 20%
            </span>
            <span
              className="text-[15px] font-extrabold tabular-nums"
              style={{
                color: urgent ? '#e74c3c' : '#222',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              }}
            >
              {min}:{sec.toString().padStart(2, '0')}
            </span>
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-3 pt-1 border-t" style={{ borderColor: '#f0e0ec' }}>
            <button
              onClick={copyCode}
              className="w-full rounded-lg px-3 py-2 text-sm font-bold tracking-wider cursor-pointer border-2 border-dashed"
              style={{
                color: '#c0392b',
                borderColor: '#c0392b',
                background: '#fff5f5',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              }}
            >
              {copied ? '✓ Копирано!' : 'VELIKDEN20 — копирай'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
