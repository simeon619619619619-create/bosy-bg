'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ProductCard } from '@/components/public/product-card'

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

interface Props {
  products: Product[]
  categories: string[]
  currentCategory?: string
  currentSearch?: string
  currentSort?: string
}

export function ShopContent({
  products,
  categories,
  currentCategory,
  currentSearch,
  currentSort,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(currentSearch ?? '')

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    startTransition(() => {
      router.push(`/shop?${params.toString()}`)
    })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: searchInput || undefined })
  }

  return (
    <div>
      {/* Filters bar */}
      <div
        className="mb-8 flex flex-wrap items-center gap-4 rounded-lg p-4"
        style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
      >
        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2" style={{ minWidth: '200px' }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Търси продукт..."
            className="h-10 flex-1 rounded-md border px-3 text-sm outline-none focus:ring-2"
            style={{
              borderColor: '#ddd',
              color: '#333',
              background: '#fff',
              // @ts-expect-error CSS custom property
              '--tw-ring-color': '#c77dba',
            }}
          />
          <button
            type="submit"
            className="h-10 cursor-pointer rounded-md px-4 text-sm font-semibold text-white transition-colors"
            style={{ background: '#c77dba' }}
          >
            Търси
          </button>
        </form>

        {/* Category filter */}
        <select
          value={currentCategory ?? ''}
          onChange={(e) =>
            updateParams({ category: e.target.value || undefined })
          }
          className="h-10 cursor-pointer rounded-md border px-3 text-sm outline-none"
          style={{ borderColor: '#ddd', color: '#333', background: '#fff' }}
        >
          <option value="">Всички категории</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort ?? ''}
          onChange={(e) =>
            updateParams({ sort: e.target.value || undefined })
          }
          className="h-10 cursor-pointer rounded-md border px-3 text-sm outline-none"
          style={{ borderColor: '#ddd', color: '#333', background: '#fff' }}
        >
          <option value="">Най-нови</option>
          <option value="price_asc">Цена: ниска към висока</option>
          <option value="price_desc">Цена: висока към ниска</option>
          <option value="name_asc">Име: А-Я</option>
          <option value="name_desc">Име: Я-А</option>
        </select>

        {/* Clear filters */}
        {(currentCategory || currentSearch || currentSort) && (
          <button
            onClick={() => {
              setSearchInput('')
              startTransition(() => router.push('/shop'))
            }}
            className="h-10 cursor-pointer rounded-md border px-4 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: '#ddd', color: '#666' }}
          >
            Изчисти филтри
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="mb-4 text-center text-sm" style={{ color: '#c77dba' }}>
          Зареждане...
        </div>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg" style={{ color: '#666' }}>
            Няма намерени продукти.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
