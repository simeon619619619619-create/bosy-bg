'use client'

import Link from 'next/link'
import { useCart } from '@/components/public/cart-provider'
import { toEur } from '@/lib/currency'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_price?: number | null
  images?: string[] | null
  category?: string | null
  stock_quantity?: number | null
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const image = product.images?.[0] ?? null
  const outOfStock = product.stock_quantity != null && product.stock_quantity <= 0

  function handleAdd() {
    if (outOfStock) return
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image,
    })
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl bg-white transition-transform duration-200 hover:-translate-y-1"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <Link href={`/product/${product.slug}`} className="relative block">
        <div
          className="flex h-60 items-center justify-center p-4"
          style={{ background: '#fafafa' }}
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              className={`max-h-full object-contain${outOfStock ? ' opacity-60' : ''}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              Няма снимка
            </div>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-2">
            <span
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm"
            >
              Очаква се скоро!
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/product/${product.slug}`}>
          <h3
            className="mb-2 line-clamp-2 text-sm font-semibold leading-snug"
            style={{ color: '#333', minHeight: '2.5rem' }}
          >
            {product.name}
          </h3>
        </Link>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="text-base font-bold"
            style={{ color: '#a78bfa', fontFamily: 'var(--font-sans)' }}
          >
            {toEur(product.price).toFixed(2)} &euro;
          </span>
          {product.compare_price != null && product.compare_price > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {toEur(product.compare_price).toFixed(2)} &euro;
            </span>
          )}
        </div>

        {outOfStock ? (
          <button
            disabled
            className="mt-auto w-full cursor-not-allowed rounded-md px-4 py-2.5 text-center text-sm font-bold tracking-wide text-gray-400"
            style={{ background: '#e5e5e5', fontFamily: 'var(--font-sans)' }}
          >
            Очаква се скоро!
          </button>
        ) : (
          <button
            onClick={handleAdd}
            className="mt-auto w-full cursor-pointer rounded-md px-4 py-2.5 text-center text-sm font-bold tracking-wide text-white transition-colors"
            style={{ background: '#a78bfa', fontFamily: 'var(--font-sans)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#8b5cf6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#a78bfa')}
          >
            Добави в количката
          </button>
        )}
      </div>
    </div>
  )
}
