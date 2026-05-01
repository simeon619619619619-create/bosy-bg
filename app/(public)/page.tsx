import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { toEur } from '@/lib/currency'
import { QuickBuyButton } from '@/components/public/quick-buy-button'
import { TestimonialsCarousel } from '@/components/public/testimonials-carousel'

function absoluteUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return `https:${url}`
  return `https://bosy.bg${url.startsWith('/') ? '' : '/'}${url}`
}

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = 'https://bosy.bg/hero-banner-easter.jpg'

  return {
    title: 'BOSY — The Smart Pleasure | Здравословни лакомства без захар',
    description:
      'BOSY Healthy Kitchen — протеинови барове, топчета и напитки без добавена захар, без глутен, на растителна основа. Здравословни лакомства с чист състав. Доставка в цяла България.',
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      url: 'https://bosy.bg',
      siteName: 'BOSY — The Smart Pleasure',
      locale: 'bg_BG',
      title: 'BOSY — The Smart Pleasure | Здравословни лакомства без захар',
      description:
        'Протеинови барове, топчета и напитки без добавена захар и без глутен. Чист състав, страхотен вкус.',
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: 'BOSY — The Smart Pleasure',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'BOSY — The Smart Pleasure',
      description: 'Здравословни лакомства без добавена захар, без глутен.',
      images: [heroImage],
    },
  }
}

interface CardBadge {
  text: string
  bg: string
  x: number
  y: number
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
  variants: { card_badges?: CardBadge[] } | null
}

// Easter 2026 campaign — auto-disables on May 1, 2026 (EEST).
const EASTER_END = new Date('2026-04-30T23:59:59+03:00')
const isEasterActive = () => Date.now() < EASTER_END.getTime()

const HERO_SLUGS = ['detox-trio-bundle']
const FEATURED_EXCLUDE = ['detox-trio-bundle', 'detox-drops-herbal-extract', 'detox-me-baby', 'herbal-boost']

async function getHeroProducts(): Promise<Product[]> {
  try {
    const supabase = createPublicSupabaseClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_price, images, category, description, variants')
      .eq('is_active', true)
      .in('slug', HERO_SLUGS)
    const rows = (data as Product[] | null) ?? []
    return rows.sort(
      (a, b) => HERO_SLUGS.indexOf(a.slug) - HERO_SLUGS.indexOf(b.slug),
    )
  } catch {
    return []
  }
}

// Default featured slugs — overridden by admin settings if available
const DEFAULT_FEATURED_SLUGS = [
  'protein-cream-macadamia',
  'lychee-blueberry',
  'dragon-fruit',
  'bubbles-lemongrass-ginger-green-tea',
  'fitbody-4x4',
  'protein-bar-box',
  'protein-crispy-balls-x26',
  'africa-balls-x-16',
]

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = createPublicSupabaseClient()

    // Check if admin has set custom featured products
    const { data: setting } = await supabase
      .from('content_blocks')
      .select('body')
      .eq('type', 'setting')
      .eq('title', 'homepage_featured_slugs')
      .single()

    const slugs: string[] = setting?.body
      ? JSON.parse(setting.body)
      : DEFAULT_FEATURED_SLUGS

    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_price, images, category, description, variants')
      .eq('is_active', true)
      .in('slug', slugs)
    const rows = (data as Product[] | null) ?? []
    return rows.sort(
      (a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug),
    )
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
    photo: '/images/wp/ladyygala-300x300.jpg',
    text:
      'Балансирани вкусове, качествени съставки и невероятно удоволствие без излишна захар. BOSY топчетата са моят фаворит за здравословно лакомство!',
  },
  {
    name: 'Svetoslav Todorov',
    photo: '/images/wp/st-300x300.jpg',
    text:
      'След тренировка BOSY топчетата са перфектният снак — бърз, вкусен и с качествен протеин. Препоръчвам ги на всеки активен човек!',
  },
  {
    name: 'Katerina Katrandzieva',
    photo: '/images/wp/unnamed-300x268.jpg',
    text:
      'Като веган, рядко намирам толкова вкусни десерти на растителна основа. BOSY продуктите са истинско откритие за мен!',
  },
  {
    name: 'Elena Boyanova',
    photo: '/images/wp/elena-212x300.jpeg',
    text:
      'Нула захар и пълен вкус! Най-накрая мога да се наслаждавам на сладко без угризения. BOSY промениха начина, по който гледам на здравословното хранене.',
  },
  {
    name: 'Victoria Kapitonova',
    photo: '/images/wp/BOSY_SQUARE_1-optimized-300x300.png',
    text:
      'Следя калориите си и BOSY топчетата перфектно се вписват в хранителния ми план. Вкусни, удобни и с ясна хранителна информация!',
  },
  {
    name: 'Teodora Todorova',
    photo: '/images/wp/4-248x300.jpg',
    text:
      'Здравословното хапване никога не е било толкова лесно и вкусно. BOSY са моят go-to снак за офиса и за вкъщи!',
  },
  {
    name: 'Dzhuliyana Gani',
    photo: '/images/wp/BOSY_SQUARE_2-optimized-300x300.png',
    text:
      'Преди и след тренировка - BOSY винаги ме зареждат с енергия. Чист състав, страхотен вкус и удобна опаковка!',
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

      {/* H1 — visually hidden for SEO, hero image is the visual hero */}
      <h1 className="sr-only">BOSY — Здравословни лакомства без захар</h1>

      {/* Hero */}
      <section className="relative w-full">
        <Link href="/shop">
          <Image
            src="/hero-banner-easter.jpg"
            alt="BOSY — The Smart Pleasure"
            width={1920}
            height={1075}
            priority
            sizes="100vw"
            className="w-full h-auto block"
            style={{ objectFit: 'cover' }}
          />
        </Link>
      </section>

      {/* Trust bar */}
      <section style={{ background: '#1a1a1a', padding: '20px 16px' }}>
        <div className="mx-auto max-w-[1100px] flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c77dba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="text-xs font-medium text-white">Без захар & глутен</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c77dba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span className="text-xs font-medium text-white">Безплатна доставка над 99.99€</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c77dba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-xs font-medium text-white">1 точка за всяко евро</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c77dba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span className="text-xs font-medium text-white">Растителна основа</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c77dba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span className="text-xs font-medium text-white">Протеин & Колаген</span>
          </div>
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        style={{ background: '#fff', padding: '48px 20px 80px' }}
      >
        <div className="mx-auto max-w-[1200px]">
          <h2
            className="mb-3 text-center text-3xl md:text-4xl font-extrabold"
            style={{
              color: '#333',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            Специална оферта
          </h2>
          {/* Hero products — Detox & Tea */}
          {heroProducts.length > 0 && (
            <div className="mb-12 grid grid-cols-1 gap-6">
              {heroProducts.map((p) => {
                const img = p.images?.[0] ?? null
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    className="group flex flex-col md:flex-row items-center gap-8 md:gap-12 overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: '#fdf5f0',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      textDecoration: 'none',
                      color: 'inherit',
                      padding: 32,
                    }}
                  >
                    <div className="flex shrink-0 items-center justify-center w-full md:w-[520px] h-[320px] md:h-[520px]">
                      {img ? (
                        <Image
                          src={img}
                          alt={p.name}
                          width={520}
                          height={520}
                          className="h-full w-full object-contain transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex items-center justify-center text-2xl" style={{ width: 320, height: 320, background: '#f5f5f5', borderRadius: 16, color: '#ccc' }}>BOSY</div>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <span className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white" style={{ background: '#c77dba' }}>
                        {p.category}
                      </span>
                      <h3 className="mb-4 text-2xl md:text-4xl font-extrabold leading-tight" style={{ color: '#222' }}>{p.name}</h3>
                      {p.description && (
                        <p className="mb-6 text-base md:text-lg leading-relaxed" style={{ color: '#666' }}>
                          {p.description.slice(0, 180)}...
                        </p>
                      )}
                      <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-3 md:gap-4">
                        <span
                          className="text-4xl md:text-5xl font-extrabold"
                          style={{
                            color:
                              p.compare_price != null && p.compare_price > p.price
                                ? '#e74c3c'
                                : '#c77dba',
                          }}
                        >
                          {toEur(p.price).toFixed(2)} &euro;
                        </span>
                        {p.compare_price != null && p.compare_price > p.price && (
                          <>
                            <span
                              className="text-xl md:text-2xl line-through"
                              style={{ color: '#999' }}
                            >
                              {toEur(p.compare_price).toFixed(2)} &euro;
                            </span>
                            <span
                              className="rounded-full px-3 py-1 text-sm md:text-base font-bold text-white"
                              style={{ background: '#e74c3c' }}
                            >
                              -
                              {Math.round(
                                ((p.compare_price - p.price) / p.compare_price) * 100,
                              )}
                              %
                            </span>
                          </>
                        )}
                      </div>
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
            Нашите продукти
          </p>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.slice(0, 8).map((p) => {
                const img = p.images?.[0] ?? null
                const hasDiscount =
                  p.compare_price != null && p.compare_price > p.price
                const cardBadges = (p.variants?.card_badges ?? []) as CardBadge[]
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
                      {cardBadges.map((b, bi) => (
                        <span
                          key={bi}
                          className="absolute rounded-md px-2.5 py-1 text-xs font-bold text-white whitespace-nowrap"
                          style={{
                            background: b.bg,
                            left: `${b.x}%`,
                            top: `${b.y}%`,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          }}
                        >
                          {b.text}
                        </span>
                      ))}
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
          <TestimonialsCarousel items={TESTIMONIALS} />
        </div>
      </section>
    </>
  )
}
