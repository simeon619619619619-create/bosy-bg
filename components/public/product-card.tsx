'use client'

import Link from 'next/link'
import { useCart } from '@/components/public/cart-provider'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_price?: number | null
  images?: string[] | null
  category?: string | null
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const image = product.images?.[0] ?? null

  function handleAdd() {
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
      <Link href={`/product/${product.slug}`} className="block">
        <div
          className="flex h-60 items-center justify-center p-4"
          style={{ background: '#fafafa' }}
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="max-h-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              Няма снимка
            </div>
          )}
        </div>
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
            style={{ color: '#61a229', fontFamily: 'var(--font-sans)' }}
          >
            {product.price.toFixed(2)} лв.
          </span>
          {product.compare_price != null && product.compare_price > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {product.compare_price.toFixed(2)} лв.
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          className="mt-auto w-full cursor-pointer rounded-md px-4 py-2.5 text-center text-sm font-bold tracking-wide text-white transition-colors"
          style={{ background: '#61a229', fontFamily: 'var(--font-sans)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4e8a1f')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#61a229')}
        >
          Добави в количката
        </button>
      </div>
    </div>
  )
}
