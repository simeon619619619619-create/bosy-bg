'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/components/public/cart-provider'
import { toEur } from '@/lib/currency'

interface Props {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price?: number | null
    images?: string[] | null
    stock?: number | null
  }
}

export function StickyMobileBuy({ product }: Props) {
  const { addToCart } = useCart()
  const [visible, setVisible] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 500)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const image = product.images?.[0] ?? null
  const outOfStock = product.stock === 0

  function handleAdd() {
    if (outOfStock) return
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compare_at_price: product.compare_at_price,
        image,
      },
      1
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
      style={{
        background: '#fff',
        borderColor: '#eee',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-out',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {image && (
          <img
            src={image}
            alt={product.name}
            className="rounded-md object-cover"
            style={{ width: 44, height: 44, flexShrink: 0 }}
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[13px] font-semibold leading-tight"
            style={{ color: '#333' }}
          >
            {product.name}
          </p>
          <p className="mt-0.5 text-sm font-bold" style={{ color: '#c77dba' }}>
            {toEur(product.price).toFixed(2)} &euro;
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="shrink-0 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity"
          style={{
            background: outOfStock
              ? '#aaa'
              : added
              ? '#4e871f'
              : 'linear-gradient(135deg, #c77dba 0%, #4e871f 100%)',
            opacity: outOfStock ? 0.7 : 1,
          }}
        >
          {outOfStock ? 'Изчерпан' : added ? 'Добавено!' : 'Купи'}
        </button>
      </div>
    </div>
  )
}
