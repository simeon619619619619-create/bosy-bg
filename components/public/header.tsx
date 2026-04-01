'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingCart, User, Menu, X } from 'lucide-react'
import { useCart } from './cart-provider'

const NAV_LINKS = [
  { href: '/', label: 'Начало' },
  { href: '/shop', label: 'Магазин' },
  { href: '/about', label: 'За нас' },
  { href: '/blog', label: 'Блог' },
  { href: '/contacts', label: 'Контакти' },
  { href: '/bosy-club', label: 'BOSY Club' },
]

export function Header() {
  const { getCartCount } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const cartCount = getCartCount()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-shadow duration-300"
        style={{
          background: '#fff',
          boxShadow: scrolled ? '0 2px 10px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="flex items-center justify-between mx-auto px-5" style={{ maxWidth: 1400, padding: '12px 20px' }}>
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/bosy-logo.jpg" alt="BOSY" style={{ height: 32 }} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[15px] font-semibold tracking-wide transition-colors duration-200 hover:opacity-80"
                style={{ color: '#333', fontFamily: 'Montserrat, sans-serif' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/bosy-club" className="hidden sm:flex" title="Моят акаунт">
              <User size={22} color="#333" />
            </Link>
            <Link href="/cart" className="relative flex items-center gap-1">
              <ShoppingCart size={22} color="#333" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#61a229', width: 18, height: 18 }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className="md:hidden flex flex-col gap-[5px] p-1"
              onClick={() => setMobileOpen(true)}
              aria-label="Отвори меню"
            >
              <Menu size={24} color="#333" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[2000] flex flex-col gap-6 p-8 pt-20"
          style={{ background: '#fff' }}
        >
          <button
            className="absolute top-5 right-5"
            onClick={() => setMobileOpen(false)}
            aria-label="Затвори меню"
          >
            <X size={28} color="#333" />
          </button>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-xl font-bold"
              style={{ color: '#333', fontFamily: 'Montserrat, sans-serif' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
