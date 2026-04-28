'use client'

import { useEffect } from 'react'

export default function OrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to Vercel runtime logs so we can see what crashed.
    console.error('[admin/orders/[id]] render error', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    })
  }, [error])

  return (
    <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Грешка при зареждане на поръчката</h1>
      <pre
        style={{
          background: '#fafafa',
          border: '1px solid #eee',
          padding: 16,
          borderRadius: 8,
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: '#b00',
        }}
      >
        {error.message || 'Unknown error'}
        {error.digest ? `\n\ndigest: ${error.digest}` : ''}
      </pre>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 16,
          padding: '10px 20px',
          background: '#222',
          color: '#fff',
          border: 0,
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Опитай пак
      </button>
    </div>
  )
}
