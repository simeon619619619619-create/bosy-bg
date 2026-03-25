'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from './cart-provider'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  image_url: string | null
  is_active: boolean
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  const { addToCart } = useCart()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((p) => (
        <div
          key={p.id}
          className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
          style={{
            background: '#fff',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          }}
        >
          <Link href={`/shop/${p.slug}`} className="block">
            <div
              className="flex items-center justify-center relative p-4"
              style={{ height: 220, background: '#fff' }}
            >
              {p.compare_at_price && p.compare_at_price > p.price && (
                <span
                  className="absolute top-3 left-3 z-[2] rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: '#e74c3c' }}
                >
                  -{Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)}%
                </span>
              )}
              {p.image_url ? (
                <Image
                  src={p.image_url}
                  alt={p.name}
                  width={180}
                  height={180}
                  className="object-contain"
                  style={{ maxHeight: '100%' }}
                />
              ) : (
                <div
                  className="flex items-center justify-center text-4xl"
                  style={{ width: 180, height: 180, background: '#f5f5f5', borderRadius: 12, color: '#ccc' }}
                >
                  BOSY
                </div>
              )}
            </div>
          </Link>
          <div className="px-4 pb-4">
            <Link href={`/shop/${p.slug}`}>
              <h3
                className="text-sm font-semibold mb-2 leading-snug"
                style={{
                  color: '#222',
                  minHeight: 40,
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                }}
              >
                {p.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className="text-base font-bold"
                style={{ color: p.compare_at_price ? '#e74c3c' : '#222' }}
              >
                {p.price.toFixed(2)} лв.
              </span>
              {p.compare_at_price && p.compare_at_price > p.price && (
                <span className="text-[13px] line-through" style={{ color: '#999' }}>
                  {p.compare_at_price.toFixed(2)} лв.
                </span>
              )}
            </div>
            <button
              onClick={() =>
                addToCart({
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: p.price,
                  image: p.image_url,
                })
              }
              className="block w-full rounded-lg text-[13px] font-bold uppercase tracking-wide transition-colors duration-300 cursor-pointer"
              style={{
                background: '#61a229',
                color: '#fff',
                padding: '10px',
                border: 'none',
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              }}
            >
              Добави в количката
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
