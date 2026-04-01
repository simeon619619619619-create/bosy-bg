import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { AddToCartButton } from '@/components/public/add-to-cart-button'
import { ProductGallery } from '@/components/public/product-gallery'
import Link from 'next/link'
import { toEur } from '@/lib/currency'

interface ProductVariants {
  subtitle?: string
  badges?: string[]
  why_title?: string
  why_items?: { title: string; description: string }[]
  ingredients?: string
  nutrition_image?: string
  shelf_life?: string
  related_slugs?: string[]
}

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

  const variants: ProductVariants =
    product.variants && typeof product.variants === 'object' && !Array.isArray(product.variants)
      ? product.variants
      : {}

  const images: string[] = product.images ?? []
  const hasDiscount =
    product.compare_price != null && product.compare_price > product.price

  // Fetch related products
  let relatedProducts: any[] = []
  if (variants.related_slugs && variants.related_slugs.length > 0) {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_price, images')
      .in('slug', variants.related_slugs)
      .limit(6)
    relatedProducts = data ?? []
  }

  return (
    <div style={{ background: '#fdf5f0', minHeight: '100vh' }}>
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm" style={{ color: '#888' }}>
          <Link href="/shop" className="transition-colors hover:underline" style={{ color: '#a78bfa' }}>
            Магазин
          </Link>
          <span>/</span>
          <span style={{ color: '#555' }}>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* Product gallery */}
          <ProductGallery images={images} name={product.name} />

          {/* Product info */}
          <div className="flex flex-col">
            {product.category && (
              <Link
                href={`/shop?category=${encodeURIComponent(product.category)}`}
                className="mb-2 inline-block self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ background: '#e8f5e0', color: '#a78bfa' }}
              >
                {product.category}
              </Link>
            )}

            <h1
              className="mb-1 text-3xl font-extrabold leading-tight"
              style={{ color: '#333' }}
            >
              {product.name}
            </h1>

            {/* Subtitle */}
            {variants.subtitle && (
              <p className="mb-4 text-base" style={{ color: '#888' }}>
                {variants.subtitle}
              </p>
            )}

            {/* Badges */}
            {variants.badges && variants.badges.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {variants.badges.map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: '#e8f5e0',
                      color: '#3d7a12',
                      border: '1px solid #c8e6b0',
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: '#a78bfa' }}
                    />
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Prices */}
            <div className="mb-5 flex flex-wrap items-baseline gap-3">
              <span
                className="text-3xl font-bold"
                style={{ color: '#a78bfa' }}
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

            {/* Short description */}
            {product.description && (
              <div
                className="mb-5 text-sm leading-relaxed"
                style={{ color: '#555' }}
              >
                {product.description}
              </div>
            )}

            {/* Stock info */}
            <div className="mb-5">
              {product.stock != null && product.stock > 0 ? (
                <span className="text-sm font-medium" style={{ color: '#a78bfa' }}>
                  В наличност ({product.stock} бр.)
                </span>
              ) : product.stock === 0 ? (
                <span className="text-sm font-medium text-red-500">
                  Изчерпано
                </span>
              ) : (
                <span className="text-sm font-medium" style={{ color: '#a78bfa' }}>
                  В наличност
                </span>
              )}
            </div>

            {/* Add to cart */}
            <AddToCartButton product={product} />

            {/* Shelf life */}
            {variants.shelf_life && (
              <p className="mt-5 text-xs leading-relaxed" style={{ color: '#999' }}>
                {variants.shelf_life}
              </p>
            )}
          </div>
        </div>

        {/* Why section */}
        {variants.why_items && variants.why_items.length > 0 && (
          <section className="mt-14">
            {variants.why_title && (
              <h2
                className="mb-6 text-center text-2xl font-bold"
                style={{ color: '#333' }}
              >
                {variants.why_title}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {variants.why_items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-6"
                  style={{
                    background: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  }}
                >
                  <div
                    className="mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: '#a78bfa' }}
                  >
                    {i + 1}
                  </div>
                  <h3
                    className="mb-2 text-sm font-bold leading-snug"
                    style={{ color: '#333' }}
                  >
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs leading-relaxed" style={{ color: '#666' }}>
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ingredients */}
        {variants.ingredients && (
          <section className="mt-14">
            <h2
              className="mb-4 text-2xl font-bold"
              style={{ color: '#333' }}
            >
              Състав
            </h2>
            <div
              className="rounded-xl p-6 text-sm leading-relaxed"
              style={{
                background: '#fff',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                color: '#555',
              }}
            >
              {variants.ingredients}
            </div>
          </section>
        )}

        {/* Nutrition image */}
        {variants.nutrition_image && (
          <section className="mt-14">
            <h2
              className="mb-4 text-2xl font-bold"
              style={{ color: '#333' }}
            >
              Хранителна информация
            </h2>
            <div
              className="overflow-hidden rounded-xl p-6"
              style={{
                background: '#fff',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}
            >
              <img
                src={variants.nutrition_image}
                alt={`${product.name} - хранителна информация`}
                className="mx-auto max-w-full"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
            </div>
          </section>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-14">
            <h2
              className="mb-6 text-center text-2xl font-bold"
              style={{ color: '#333' }}
            >
              Комбинирай с...
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((rp) => {
                const rpImage = rp.images?.[0] ?? null
                const rpDiscount =
                  rp.compare_price != null && rp.compare_price > rp.price
                return (
                  <Link
                    key={rp.id}
                    href={`/product/${rp.slug}`}
                    className="group overflow-hidden rounded-xl transition-shadow hover:shadow-lg"
                    style={{
                      background: '#fff',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div className="flex items-center justify-center p-4" style={{ height: '180px' }}>
                      {rpImage ? (
                        <img
                          src={rpImage}
                          alt={rp.name}
                          className="max-h-full w-auto object-contain transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-xs text-gray-400">Няма снимка</div>
                      )}
                    </div>
                    <div className="px-4 pb-4">
                      <h3
                        className="mb-1 text-sm font-semibold leading-tight"
                        style={{ color: '#333' }}
                      >
                        {rp.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-sm font-bold"
                          style={{ color: '#a78bfa' }}
                        >
                          {toEur(rp.price).toFixed(2)} &euro;
                        </span>
                        {rpDiscount && (
                          <span className="text-xs text-gray-400 line-through">
                            {toEur(rp.compare_price).toFixed(2)} &euro;
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
