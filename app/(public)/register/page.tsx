'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const name = (form.get('name') as string).trim()
    const email = (form.get('email') as string).trim().toLowerCase()
    const phone = (form.get('phone') as string).trim()
    const password = form.get('password') as string
    const confirmPassword = form.get('confirmPassword') as string

    if (password.length < 6) {
      setError('Паролата трябва да е поне 6 символа.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Паролите не съвпадат.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    // 1. Sign up with Supabase Auth
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Този имейл вече е регистриран. Опитайте да влезете.')
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    // 2. Upsert customer record (service role via server action)
    const res = await fetch('/api/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Грешка при създаване на профил.')
      setLoading(false)
      return
    }

    setSuccess(true)

    // Auto-login happens via signUp, redirect to account
    setTimeout(() => router.push('/account'), 1000)
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

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center" style={{ minHeight: '60vh' }}>
        <div
          className="mx-auto flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, background: 'rgba(97,162,41,.12)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#61a229" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1
          className="mt-4 text-xl font-bold"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', color: '#333' }}
        >
          Регистрацията е успешна!
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#666' }}>
          Пренасочване към акаунта ви...
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-16 px-4" style={{ minHeight: '70vh' }}>
      <div className="w-full" style={{ maxWidth: 440 }}>
        <h1
          className="text-2xl font-bold text-center mb-2"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', color: '#333' }}
        >
          Създай акаунт
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: '#666' }}>
          Стани член на BOSY Club и събирай кешбак с всяка поръчка.
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 space-y-4"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div>
            <label style={labelStyle} htmlFor="name">Име и фамилия *</label>
            <input id="name" name="name" type="text" required placeholder="Иван Иванов" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle} htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" required placeholder="ivan@example.com" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle} htmlFor="phone">Телефон</label>
            <input id="phone" name="phone" type="tel" placeholder="0888 123 456" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle} htmlFor="password">Парола *</label>
            <input id="password" name="password" type="password" required placeholder="Минимум 6 символа" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle} htmlFor="confirmPassword">Потвърди парола *</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required placeholder="Повтори паролата" style={inputStyle} />
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
            {loading ? 'Регистриране...' : 'Регистрация'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#666' }}>
          Вече имаш акаунт?{' '}
          <Link href="/account/login" className="font-semibold hover:underline" style={{ color: '#61a229' }}>
            Вход
          </Link>
        </p>
      </div>
    </div>
  )
}
