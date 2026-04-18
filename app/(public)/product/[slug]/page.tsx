import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { AddToCartButton } from '@/components/public/add-to-cart-button'
import { StickyMobileBuy } from '@/components/public/sticky-mobile-buy'
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
  use_title?: string
  use_steps?: { title: string; description: string }[]
  faq_title?: string
  faq_items?: { question: string; answer: string }[]
}

// Truncate at word boundary, not mid-word
function truncateAtWord(text: string, maxLen: number): string {
  if (!text) return ''
  if (text.length <= maxLen) return text
  const sliced = text.slice(0, maxLen)
  const lastSpace = sliced.lastIndexOf(' ')
  const cut = lastSpace > maxLen * 0.6 ? sliced.slice(0, lastSpace) : sliced
  return cut.replace(/[,;:.!?\s]+$/, '') + '…'
}

// Make image URLs absolute for schema.org / Google Rich Results
function absoluteUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return `https:${url}`
  return `https://bosy.bg${url.startsWith('/') ? '' : '/'}${url}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicSupabaseClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, images, price, category')
    .eq('slug', slug)
    .single()

  if (!product) {
    return { title: 'Продукт не е намерен' }
  }

  const url = `https://bosy.bg/product/${slug}`
  const img = product.images?.[0] ? absoluteUrl(product.images[0]) : null
  const descBase = product.description?.replace(/\s+/g, ' ').trim() ?? ''
  const description = descBase
    ? truncateAtWord(descBase, 155)
    : `${product.name} от BOSY — без добавена захар, без глутен, на растителна основа. Купи онлайн с доставка в цяла България.`

  return {
    title: `${product.name} — BOSY Healthy Kitchen`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: 'BOSY — Healthy Kitchen',
      title: `${product.name} | BOSY`,
      description,
      images: img ? [{ url: img, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: img ? [img] : [],
    },
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

  const isDetoxTrio = product.slug === 'detox-trio-bundle'

  const detoxTrioDefaults: ProductVariants = isDetoxTrio
    ? {
        subtitle:
          '3-step ритуал за лекота, баланс и по-приятно ежедневие.',
        badges: [
          'На растителна основа',
          'Без добавена захар',
          'Лимитирано bundle предложение',
        ],
        why_title: 'Защо DETOX TRIO работи толкова добре като система',
        why_items: [
          {
            title: '1 готов ритуал, без чудене',
            description:
              'Получаваш чай, detox drops и бутилка в един комплект, подредени така, че да превърнат грижата за себе си в лесен навик.',
          },
          {
            title: 'По-леко и балансирано ежедневие',
            description:
              'Създадено за хора, които търсят усещане за лекота, по-добър ритъм и по-приятен wellness режим.',
          },
          {
            title: 'По-изгодно от поотделно',
            description:
              'Bundle форматът ти дава цялата система в една покупка и спестява 7.15 € спрямо единичното вземане.',
          },
        ],
        ingredients:
          'Комплектът включва: DETOX ME BABY, BOSY Detox Drops — Herbal Extract и бутилка за чай Herbal Boost. Комбинация, създадена за удобен ежедневен detox ритуал у дома, в офиса или в движение.',
        use_title: 'Как да използваш DETOX TRIO',
        use_steps: [
          {
            title: 'Стъпка 1: Приготви своя чай',
            description:
              'Използвай DETOX ME BABY като основа на ритуала си и си отдели момент за по-лек старт или рестарт на деня.',
          },
          {
            title: 'Стъпка 2: Добави drops към режима си',
            description:
              'BOSY Detox Drops допълват усещането за балансирана ежедневна грижа и правят системата по-пълна.',
          },
          {
            title: 'Стъпка 3: Носи ритуала със себе си',
            description:
              'Herbal Boost бутилката прави приема лесен и красив, така че да останеш постоянна дори в динамично ежедневие.',
          },
        ],
        faq_title: 'Често задавани въпроси',
        faq_items: [
          {
            question: 'За кого е подходящ DETOX TRIO?',
            answer:
              'Подходящ е за хора, които искат по-лек и добре структуриран daily wellness ритуал с удобството на готов комплект.',
          },
          {
            question: 'Защо да взема bundle вместо продуктите поотделно?',
            answer:
              'Защото получаваш цялата система в една покупка, по-ясен ритуал и по-добра крайна цена.',
          },
          {
            question: 'Какво получавам в комплекта?',
            answer:
              'DETOX ME BABY, BOSY Detox Drops — Herbal Extract и бутилка за чай Herbal Boost.',
          },
          {
            question: 'Има ли отстъпка в момента?',
            answer:
              'Да, комплектът е с -15% и струва 40.55 € вместо 47.70 €, което ти спестява 7.15 €.',
          },
        ],
      }
    : {}

  const mergedVariants: ProductVariants = {
    ...detoxTrioDefaults,
    ...variants,
    badges: variants.badges && variants.badges.length > 0 ? variants.badges : detoxTrioDefaults.badges,
    why_items: variants.why_items && variants.why_items.length > 0 ? variants.why_items : detoxTrioDefaults.why_items,
    use_steps: variants.use_steps && variants.use_steps.length > 0 ? variants.use_steps : detoxTrioDefaults.use_steps,
    faq_items: variants.faq_items && variants.faq_items.length > 0 ? variants.faq_items : detoxTrioDefaults.faq_items,
  }

  const images: string[] = product.images ?? []
  const hasDiscount =
    product.compare_price != null && product.compare_price > product.price

  // Fetch related products
  let relatedProducts: Array<{
    id: string
    name: string
    slug: string
    price: number
    compare_price: number | null
    images: string[] | null
  }> = []
  if (variants.related_slugs && variants.related_slugs.length > 0) {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_price, images')
      .in('slug', variants.related_slugs)
      .limit(6)
    relatedProducts = data ?? []
  }

  const url = `https://bosy.bg/product/${product.slug}`
  const inStock =
    product.stock == null || (typeof product.stock === 'number' && product.stock > 0)
  const absoluteImages = images.map((i) => absoluteUrl(i)).filter(Boolean)

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: product.name,
    url,
    ...(product.description ? { description: truncateAtWord(product.description, 5000) } : {}),
    ...(absoluteImages.length > 0 ? { image: absoluteImages } : {}),
    ...(product.category ? { category: product.category } : {}),
    brand: { '@type': 'Brand', name: 'BOSY' },
    sku: product.slug,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '8',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: toEur(product.price).toFixed(2),
      ...(hasDiscount
        ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: toEur(product.price).toFixed(2), priceCurrency: 'EUR' } }
        : {}),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': 'https://bosy.bg/#organization' },
    },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Начало', item: 'https://bosy.bg' },
      { '@type': 'ListItem', position: 2, name: 'Магазин', item: 'https://bosy.bg/shop' },
      ...(product.category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: product.category,
              item: `https://bosy.bg/shop?category=${encodeURIComponent(product.category)}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: product.category ? 4 : 3,
        name: product.name,
        item: url,
      },
    ],
  }

  return (
    <div style={{ background: '#fdf5f0', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm" style={{ color: '#888' }} aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:underline" style={{ color: '#c77dba' }}>
            Начало
          </Link>
          <span>/</span>
          <Link href="/shop" className="transition-colors hover:underline" style={{ color: '#c77dba' }}>
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
                style={{ background: '#f3e5f0', color: '#c77dba' }}
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
            {mergedVariants.subtitle && (
              <p className="mb-4 max-w-[620px] text-base leading-relaxed" style={{ color: '#666' }}>
                {mergedVariants.subtitle}
              </p>
            )}

            {/* Badges */}
            {mergedVariants.badges && mergedVariants.badges.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {mergedVariants.badges.map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: '#f3e5f0',
                      color: '#3d7a12',
                      border: '1px solid #c8e6b0',
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: '#c77dba' }}
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
                style={{ color: '#c77dba' }}
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
                className="mb-5 space-y-3 text-sm leading-relaxed"
                style={{ color: '#555' }}
              >
                {isDetoxTrio ? (
                  <>
                    <p>
                      DETOX TRIO е 3-step ритуал за лекота и баланс, който събира на едно място чай, detox drops и красива бутилка за твоя ежедневен wellness reset.
                    </p>
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                    >
                      <p className="mb-2 font-semibold" style={{ color: '#333' }}>
                        Какво получаваш:
                      </p>
                      <ul className="space-y-2 pl-5" style={{ listStyle: 'disc' }}>
                        <li>DETOX ME BABY за по-приятен дневен ритуал</li>
                        <li>BOSY Detox Drops — Herbal Extract за допълване на режима</li>
                        <li>Herbal Boost бутилка за удобство у дома и в движение</li>
                      </ul>
                    </div>
                    <p>
                      Взимаш цялата система с -15% отстъпка, спестяваш 7.15 € и получаваш готов bundle, който е по-лесен за следване от разпокъсани единични продукти.
                    </p>
                  </>
                ) : (
                  product.description
                )}
              </div>
            )}

            {/* Stock info */}
            <div className="mb-5">
              {product.stock != null && product.stock > 0 ? (
                <span className="text-sm font-medium" style={{ color: '#c77dba' }}>
                  В наличност ({product.stock} бр.)
                </span>
              ) : product.stock === 0 ? (
                <span className="text-sm font-medium text-red-500">
                  Изчерпано
                </span>
              ) : (
                <span className="text-sm font-medium" style={{ color: '#c77dba' }}>
                  В наличност
                </span>
              )}
            </div>

            {/* Add to cart */}
            <AddToCartButton product={product} />

            {isDetoxTrio && (
              <div
                className="mt-5 rounded-2xl p-4 text-sm"
                style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', color: '#555' }}
              >
                <p className="font-semibold" style={{ color: '#333' }}>
                  Защо да купиш сега
                </p>
                <ul className="mt-2 space-y-2 pl-5" style={{ listStyle: 'disc' }}>
                  <li>Лимитирано bundle предложение до края на април</li>
                  <li>Спестяваш 7.15 € спрямо покупка поотделно</li>
                  <li>Получаваш готов ритуал, а не просто отделни продукти</li>
                </ul>
              </div>
            )}

            {/* Shelf life */}
            {variants.shelf_life && (
              <p className="mt-5 text-xs leading-relaxed" style={{ color: '#999' }}>
                {variants.shelf_life}
              </p>
            )}
          </div>
        </div>

        {/* Why section */}
        {mergedVariants.why_items && mergedVariants.why_items.length > 0 && (
          <section className="mt-14">
            {mergedVariants.why_title && (
              <h2
                className="mb-6 text-center text-2xl font-bold"
                style={{ color: '#333' }}
              >
                {mergedVariants.why_title}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mergedVariants.why_items.map((item, i) => (
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
                    style={{ background: '#c77dba' }}
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
        {mergedVariants.use_steps && mergedVariants.use_steps.length > 0 && (
          <section className="mt-14">
            <h2
              className="mb-6 text-2xl font-bold"
              style={{ color: '#333' }}
            >
              {mergedVariants.use_title ?? 'Как се използва'}
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {mergedVariants.use_steps.map((step, i) => (
                <div
                  key={i}
                  className="rounded-xl p-6"
                  style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                >
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: '#c77dba' }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="mb-2 text-base font-bold" style={{ color: '#333' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {mergedVariants.ingredients && (
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
              {mergedVariants.ingredients}
            </div>
          </section>
        )}

        {mergedVariants.faq_items && mergedVariants.faq_items.length > 0 && (
          <section className="mt-14">
            <h2
              className="mb-6 text-2xl font-bold"
              style={{ color: '#333' }}
            >
              {mergedVariants.faq_title ?? 'Често задавани въпроси'}
            </h2>
            <div className="space-y-4">
              {mergedVariants.faq_items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5"
                  style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                >
                  <h3 className="mb-2 text-base font-bold" style={{ color: '#333' }}>
                    {item.question}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nutrition image */}
        {mergedVariants.nutrition_image && (
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
                src={mergedVariants.nutrition_image}
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
                          style={{ color: '#c77dba' }}
                        >
                          {toEur(rp.price).toFixed(2)} &euro;
                        </span>
                        {rpDiscount && rp.compare_price != null && (
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

      <StickyMobileBuy
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          compare_at_price: product.compare_price ?? null,
          images: product.images,
          stock: product.stock_quantity,
        }}
      />
    </div>
  )
}
