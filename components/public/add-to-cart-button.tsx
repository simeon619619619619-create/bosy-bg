'use client'

import { useState } from 'react'
import { useCart } from '@/components/public/cart-provider'

interface Props {
  product: {
    id: string
    name: string
    slug: string
    price: number
    images?: string[] | null
    stock?: number | null
  }
}

export function AddToCartButton({ product }: Props) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const image = product.images?.[0] ?? null
  const maxStock = product.stock ?? 99

  function handleAdd() {
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image,
      },
      quantity
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: '#333' }}>
          Количество:
        </span>
        <div
          className="flex items-center overflow-hidden rounded-md border"
          style={{ borderColor: '#ddd' }}
        >
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 cursor-pointer items-center justify-center text-lg transition-colors hover:bg-gray-100"
            style={{ color: '#333' }}
            disabled={quantity <= 1}
          >
            -
          </button>
          <span
            className="flex h-10 w-12 items-center justify-center text-sm font-semibold"
            style={{ color: '#333', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}
          >
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
            className="flex h-10 w-10 cursor-pointer items-center justify-center text-lg transition-colors hover:bg-gray-100"
            style={{ color: '#333' }}
            disabled={quantity >= maxStock}
          >
            +
          </button>
        </div>
      </div>

      {/* Add to cart button */}
      <button
        onClick={handleAdd}
        className="w-full cursor-pointer rounded-md px-6 py-3 text-center text-base font-bold tracking-wide text-white transition-colors"
        style={{ background: added ? '#8b5cf6' : '#a78bfa' }}
        onMouseEnter={(e) => {
          if (!added) e.currentTarget.style.background = '#8b5cf6'
        }}
        onMouseLeave={(e) => {
          if (!added) e.currentTarget.style.background = '#a78bfa'
        }}
      >
        {added ? 'Добавено!' : 'Добави в количката'}
      </button>
    </div>
  )
}
