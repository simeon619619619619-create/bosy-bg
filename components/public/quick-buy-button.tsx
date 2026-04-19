'use client'

import { useState } from 'react'
import { useCart } from '@/components/public/cart-provider'

interface Props {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_price?: number | null
    images?: string[] | null
  }
}

export function QuickBuyButton({ product }: Props) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compare_at_price: product.compare_price,
        image: product.images?.[0] ?? null,
      },
      1
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      onClick={handleClick}
      className="mt-3 w-full rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
      style={{
        background: added
          ? '#22c55e'
          : 'linear-gradient(135deg, #c77dba 0%, #f472b6 100%)',
        border: 'none',
      }}
    >
      {added ? '✓ Добавено' : 'Купи'}
    </button>
  )
}
