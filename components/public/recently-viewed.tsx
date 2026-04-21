'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { toEur } from '@/lib/currency'

const STORAGE_KEY = 'bosy-recently-viewed'
const MAX_ITEMS = 10

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  images: string[] | null
}

function getRecentSlugs(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addSlug(slug: string) {
  if (typeof window === 'undefined') return
  const slugs = getRecentSlugs().filter((s) => s !== slug)
  slugs.unshift(slug)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs.slice(0, MAX_ITEMS)))
}

export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    // Add current product to recently viewed
    addSlug(currentSlug)

    // Fetch other recently viewed products
    const slugs = getRecentSlugs().filter((s) => s !== currentSlug)
    if (slugs.length < 2) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase
      .from('products')
      .select('id, name, slug, price, compare_price, images')
      .in('slug', slugs.slice(0, 8))
      .then(({ data }) => {
        if (data && data.length >= 2) {
          // Sort by the order in slugs array
          const sorted = slugs
            .map((s) => data.find((p) => p.slug === s))
            .filter(Boolean) as Product[]
          setProducts(sorted)
        }
      })
  }, [currentSlug])

  if (products.length < 2) return null

  return (
    <section className="mx-auto mt-14 max-w-[1200px] px-5 pb-10">
      <h2
        className="mb-6 text-xl font-bold"
        style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
      >
        Наскоро разгледани
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        {products.map((product) => {
          const image = product.images?.[0] ?? null
          const hasDiscount = product.compare_price != null && product.compare_price > product.price
          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group shrink-0 overflow-hidden rounded-xl transition-shadow hover:shadow-lg"
              style={{
                width: 180,
                background: '#fff',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex h-40 items-center justify-center p-3">
                {image ? (
                  <img
                    src={image}
                    alt={product.name}
                    className="max-h-full w-auto object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="text-xs text-gray-400">Няма снимка</div>
                )}
              </div>
              <div className="px-3 pb-3">
                <h3
                  className="mb-1 text-xs font-semibold leading-tight line-clamp-2"
                  style={{ color: '#333' }}
                >
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold" style={{ color: '#c77dba' }}>
                    {toEur(product.price).toFixed(2)} &euro;
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through">
                      {toEur(product.compare_price!).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
