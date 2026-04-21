'use client'

import { useEffect } from 'react'
import { X, ShoppingBag, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/components/public/cart-provider'
import { toEur } from '@/lib/currency'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, getCartTotal } = useCart()

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const total = getCartTotal()

  return (
    <div className="fixed inset-0 z-[9998]">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col"
        style={{
          background: '#fff',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#eee' }}>
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', color: '#333' }}
          >
            Количка ({items.length})
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label="Затвори"
          >
            <X size={20} color="#666" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag size={40} color="#ccc" />
              <p className="mt-3 text-sm" style={{ color: '#999' }}>Количката е празна</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg p-3" style={{ background: '#fdf5f0' }}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-14 w-14 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-md" style={{ background: '#eee' }}>
                      <ShoppingBag size={16} color="#bbb" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#333' }}>{item.name}</p>
                    <p className="text-sm font-bold" style={{ color: '#c77dba' }}>
                      {toEur(item.price * item.quantity).toFixed(2)} &euro;
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border"
                        style={{ borderColor: '#ddd' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border"
                        style={{ borderColor: '#ddd' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="shrink-0 text-xs font-medium text-red-400 hover:text-red-600"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-6 py-4" style={{ borderColor: '#eee' }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#666' }}>Общо:</span>
              <span className="text-lg font-bold" style={{ color: '#333' }}>
                {toEur(total).toFixed(2)} &euro;
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex items-center justify-center rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#c77dba' }}
              >
                Към касата
              </Link>
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-lg py-3 text-sm font-medium transition-colors hover:bg-gray-100"
                style={{ color: '#c77dba', border: '1px solid #c77dba' }}
              >
                Продължи пазаруването
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
