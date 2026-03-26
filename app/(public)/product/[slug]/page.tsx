import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { AddToCartButton } from '@/components/public/add-to-cart-button'
import Link from 'next/link'
import { toEur } from '@/lib/currency'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createPublicSupabaseClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!product) {
    return { title: 'Продукт не е намерен - BOSY' }
  }

  return {
    title: `${product.name} - BOSY`,
    description: product.description?.slice(0, 160) ?? '',
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createPublicSupabaseClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!product) {
    notFound()
  }

  const image = product.images?.[0] ?? null
  const hasDiscount =
    product.compare_price != null && product.compare_price > product.price

  return (
    <div style={{ background: '#fdf5f0', minHeight: '100vh' }}>
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm" style={{ color: '#888' }}>
          <Link href="/shop" className="transition-colors hover:underline" style={{ color: '#61a229' }}>
            Магазин
          </Link>
          <span>/</span>
          <span style={{ color: '#555' }}>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* Product image */}
          <div
            className="flex items-center justify-center overflow-hidden rounded-xl p-8"
            style={{
              background: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              minHeight: '400px',
            }}
          >
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="max-h-[450px] w-auto object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                Няма снимка
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            {product.category && (
              <Link
                href={`/shop?category=${encodeURIComponent(product.category)}`}
                className="mb-2 inline-block self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ background: '#e8f5e0', color: '#61a229' }}
              >
                {product.category}
              </Link>
            )}

            <h1
              className="mb-4 text-3xl font-extrabold leading-tight"
              style={{ color: '#333' }}
            >
              {product.name}
            </h1>

            {/* Prices */}
            <div className="mb-6 flex flex-wrap items-baseline gap-3">
              <span
                className="text-3xl font-bold"
                style={{ color: '#61a229' }}
              >
                {toEur(product.price).toFixed(2)} &euro;
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-400 line-through">
                  {toEur(product.compare_price!).toFixed(2)} &euro;
                </span>
              )}
              {hasDiscount && (
                <span
                  className="rounded px-2 py-0.5 text-xs font-bold text-white"
                  style={{ background: '#e74c3c' }}
                >
                  -{Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)}%
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div
                className="mb-6 text-sm leading-relaxed"
                style={{ color: '#555' }}
              >
                {product.description}
              </div>
            )}

            {/* Stock info */}
            <div className="mb-6">
              {product.stock != null && product.stock > 0 ? (
                <span className="text-sm font-medium" style={{ color: '#61a229' }}>
                  В наличност ({product.stock} бр.)
                </span>
              ) : product.stock === 0 ? (
                <span className="text-sm font-medium text-red-500">
                  Изчерпано
                </span>
              ) : (
                <span className="text-sm font-medium" style={{ color: '#61a229' }}>
                  В наличност
                </span>
              )}
            </div>

            {/* Add to cart */}
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
