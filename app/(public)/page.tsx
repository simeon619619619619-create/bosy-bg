import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { toEur } from '@/lib/currency'
import { QuickBuyButton } from '@/components/public/quick-buy-button'

function absoluteUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return `https:${url}`
  return `https://bosy.bg${url.startsWith('/') ? '' : '/'}${url}`
}

export const metadata: Metadata = {
  title: 'BOSY — Healthy Kitchen | Здравословни лакомства без захар',
  description:
    'BOSY Healthy Kitchen — протеинови барове, топчета и напитки без добавена захар, без глутен, на растителна основа. Здравословни лакомства с чист състав. Доставка в цяла България.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://bosy.bg',
    siteName: 'BOSY — Healthy Kitchen',
    locale: 'bg_BG',
    title: 'BOSY — Healthy Kitchen | Здравословни лакомства без захар',
    description:
      'Протеинови барове, топчета и напитки без добавена захар и без глутен. Чист състав, страхотен вкус.',
    images: [
      {
        url: 'https://bosy.bg/hero-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'BOSY Healthy Kitchen',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BOSY — Healthy Kitchen',
    description: 'Здравословни лакомства без добавена захар, без глутен.',
    images: ['https://bosy.bg/hero-banner.jpg'],
  },
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  images: string[] | null
  category: string | null
  description: string | null
}

const HERO_SLUGS = [
  'detox-drops-herbal-extract',
  'detox-me-baby',
  'herbal-boost',
  'bubbles-lemongrass-ginger-green-tea-x12',
]

async function getHeroProducts(): Promise<Product[]> {
  try {
    const supabase = createPublicSupabaseClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_price, images, category, description')
      .eq('is_active', true)
      .in('slug', HERO_SLUGS)
    return (data as Product[] | null) ?? []
  } catch {
    return []
  }
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = createPublicSupabaseClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_price, images, category, description')
      .eq('is_active', true)
      .not('slug', 'in', `(${HERO_SLUGS.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(8)
    return (data as Product[] | null) ?? []
  } catch {
    return []
  }
}

const BADGES = [
  'Без захар',
  'Без глутен',
  'Протеин',
  'Колаген',
  'Витамини',
]

// Real testimonials preserved as-is from the legacy homepage.
const TESTIMONIALS = [
  {
    name: 'Gala Chalkova',
    text:
      'Балансирани вкусове, качествени съставки и невероятно удоволствие без излишна захар. BOSY топчетата са моят фаворит за здравословно лакомство!',
  },
  {
    name: 'Svetoslav Todorov',
    text:
      'След тренировка BOSY топчетата са перфектният снак — бърз, вкусен и с качествен протеин. Препоръчвам ги на всеки активен човек!',
  },
  {
    name: 'Katerina Katrandzieva',
    text:
      'Като веган, рядко намирам толкова вкусни десерти на растителна основа. BOSY продуктите са истинско откритие за мен!',
  },
  {
    name: 'Elena Boyanova',
    text:
      'Нула захар и пълен вкус! Най-накрая мога да се наслаждавам на сладко без угризения. BOSY промениха начина, по който гледам на здравословното хранене.',
  },
]

export default async function HomePage() {
  const [heroProducts, products] = await Promise.all([
    getHeroProducts(),
    getFeaturedProducts(),
  ])

  const productListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Продукти на BOSY',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://bosy.bg/product/${p.slug}`,
      item: {
        '@type': 'Product',
        '@id': `https://bosy.bg/product/${p.slug}`,
        name: p.name,
        url: `https://bosy.bg/product/${p.slug}`,
        ...(p.images && p.images.length > 0 ? { image: absoluteUrl(p.images[0]) } : {}),
        ...(p.description ? { description: p.description.slice(0, 300) } : {}),
        brand: { '@type': 'Brand', name: 'BOSY' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: toEur(p.price).toFixed(2),
          availability: 'https://schema.org/InStock',
          url: `https://bosy.bg/product/${p.slug}`,
        },
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListLd) }}
      />

      {/* Hero */}
      <section className="relative w-full">
        <Link href="/shop">
          <Image
            src="/hero-banner-easter.png"
            alt="BOSY — The Smart Pleasure"
            width={5488}
            height={3072}
            priority
            className="w-full h-auto block"
            style={{ objectFit: 'cover' }}
          />
        </Link>
      </section>

      {/* Badges */}
      <section style={{ background: '#fff', padding: '40px 10px' }}>
        <div className="mx-auto max-w-[1200px]">
          <ul
            className="grid list-none grid-cols-5 gap-2 md:gap-6 text-center"
            style={{ padding: 0, margin: 0 }}
          >
            {BADGES.map((b) => (
              <li
                key={b}
                className="flex flex-col items-center gap-2 md:gap-3"
                style={{ color: '#333' }}
              >
                <div
                  className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full"
                  style={{
                    background: '#f3e5f0',
                    border: '2px solid #c77dba',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#c77dba"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span className="text-[10px] md:text-sm font-semibold leading-tight">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        style={{ background: '#fff', padding: '80px 20px' }}
      >
        <div className="mx-auto max-w-[1200px]">
          <h2
            className="mb-3 text-center text-3xl md:text-4xl font-extrabold"
            style={{
              color: '#333',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            Нашите продукти
          </h2>
          {/* Hero products — Detox & Tea */}
          {heroProducts.length > 0 && (
            <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {heroProducts.map((p) => {
                const img = p.images?.[0] ?? null
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    className="group flex flex-col md:flex-row items-center gap-6 overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: '#fdf5f0',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      textDecoration: 'none',
                      color: 'inherit',
                      padding: 20,
                    }}
                  >
                    <div className="flex shrink-0 items-center justify-center" style={{ width: 200, height: 200 }}>
                      {img ? (
                        <Image
                          src={img}
                          alt={p.name}
                          width={200}
                          height={200}
                          className="object-contain transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex items-center justify-center text-2xl" style={{ width: 160, height: 160, background: '#f5f5f5', borderRadius: 12, color: '#ccc' }}>BOSY</div>
                      )}
                    </div>
                    <div className="text-center md:text-left">
                      <span className="mb-2 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: '#c77dba' }}>
                        {p.category}
                      </span>
                      <h3 className="mb-2 text-lg font-bold" style={{ color: '#222' }}>{p.name}</h3>
                      {p.description && (
                        <p className="mb-3 text-sm leading-relaxed" style={{ color: '#666' }}>
                          {p.description.slice(0, 120)}...
                        </p>
                      )}
                      <span className="text-lg font-bold" style={{ color: '#c77dba' }}>
                        {toEur(p.price).toFixed(2)} &euro;
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <p
            className="mx-auto mb-10 max-w-[640px] text-center text-base leading-relaxed"
            style={{ color: '#555' }}
          >
            Открий любимите ни напитки за чиста енергия, детокс билкови чайове и
            аксесоари за здравословно ежедневие.
          </p>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.slice(0, 8).map((p) => {
                const img = p.images?.[0] ?? null
                const hasDiscount =
                  p.compare_price != null && p.compare_price > p.price
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    className="group block overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: '#fff',
                      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div
                      className="relative flex items-center justify-center p-4"
                      style={{ height: 200, background: '#fff' }}
                    >
                      {hasDiscount && (
                        <span
                          className="absolute left-3 top-3 z-[2] rounded-full px-3 py-1 text-xs font-bold text-white"
                          style={{ background: '#e74c3c' }}
                        >
                          -
                          {Math.round(
                            ((p.compare_price! - p.price) / p.compare_price!) *
                              100,
                          )}
                          %
                        </span>
                      )}
                      {img ? (
                        <Image
                          src={img}
                          alt={p.name}
                          width={180}
                          height={180}
                          className="object-contain transition-transform group-hover:scale-105"
                          style={{ maxHeight: '100%' }}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center text-3xl"
                          style={{
                            width: 160,
                            height: 160,
                            background: '#f5f5f5',
                            borderRadius: 12,
                            color: '#ccc',
                          }}
                        >
                          BOSY
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-4">
                      <h3
                        className="mb-2 text-sm font-semibold leading-snug"
                        style={{ color: '#222', minHeight: 40 }}
                      >
                        {p.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-base font-bold"
                          style={{ color: hasDiscount ? '#e74c3c' : '#c77dba' }}
                        >
                          {toEur(p.price).toFixed(2)} &euro;
                        </span>
                        {hasDiscount && (
                          <span
                            className="text-xs line-through"
                            style={{ color: '#999' }}
                          >
                            {toEur(p.compare_price!).toFixed(2)} &euro;
                          </span>
                        )}
                      </div>
                      <QuickBuyButton product={p} />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-sm" style={{ color: '#888' }}>
              Продуктите се зареждат…
            </p>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/shop"
              className="inline-block rounded-lg px-9 py-4 text-sm font-bold uppercase tracking-wider transition-colors"
              style={{
                background: '#c77dba',
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              Виж всички продукти
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: '#fff', padding: '80px 20px' }}>
        <div className="mx-auto max-w-[1200px]">
          <h2
            className="mb-10 text-center text-3xl md:text-4xl font-extrabold"
            style={{
              color: '#333',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            Какво казват клиентите
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl p-6"
                style={{
                  background: '#fdf5f0',
                  border: '1px solid #f3e6dc',
                }}
              >
                <blockquote
                  className="mb-4 text-sm leading-relaxed italic"
                  style={{ color: '#555' }}
                >
                  &quot;{t.text}&quot;
                </blockquote>
                <figcaption
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: '#c77dba' }}
                >
                  — {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
