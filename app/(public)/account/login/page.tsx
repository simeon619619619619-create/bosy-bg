'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CustomerLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const email = (form.get('email') as string).trim().toLowerCase()
    const password = form.get('password') as string

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      if (authError.message.includes('Invalid login')) {
        setError('Грешен имейл или парола.')
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    router.push('/account')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    background: '#fff',
    color: '#333',
    outline: 'none',
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
    marginBottom: 4,
  }

  return (
    <div className="flex items-center justify-center py-16 px-4" style={{ minHeight: '70vh' }}>
      <div className="w-full" style={{ maxWidth: 420 }}>
        <h1
          className="text-2xl font-bold text-center mb-2"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', color: '#333' }}
        >
          Вход в акаунта
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: '#666' }}>
          Влез в BOSY Club акаунта си.
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 space-y-4"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div>
            <label style={labelStyle} htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" required placeholder="ivan@example.com" style={inputStyle} autoComplete="email" />
          </div>

          <div>
            <label style={labelStyle} htmlFor="password">Парола *</label>
            <input id="password" name="password" type="password" required placeholder="Твоята парола" style={inputStyle} autoComplete="current-password" />
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: '#fee', color: '#c53030', border: '1px solid #fcc' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: '#61a229' }}
          >
            {loading ? 'Влизане...' : 'Вход'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#666' }}>
          Нямаш акаунт?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: '#61a229' }}>
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  )
}
