import type { Metadata } from 'next'
import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { toEur } from '@/lib/currency'

import { ShopContent } from './shop-content'

function absoluteUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return `https:${url}`
  return `https://bosy.bg${url.startsWith('/') ? '' : '/'}${url}`
}

export const metadata: Metadata = {
  title: 'Магазин — протеинови барове, топчета и напитки',
  description:
    'Всички здравословни лакомства на BOSY на едно място: протеинови барове, топчета, колагенови и билкови напитки, детокс чайове. Без добавена захар, без глутен. Доставка в цяла България.',
  alternates: { canonical: '/shop' },
  openGraph: {
    type: 'website',
    url: 'https://bosy.bg/shop',
    title: 'Магазин | BOSY — Healthy Kitchen',
    description:
      'Протеинови барове, топчета и напитки без захар. Разгледай всички продукти на BOSY.',
  },
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const category = typeof sp.category === 'string' ? sp.category : undefined
  const search = typeof sp.search === 'string' ? sp.search : undefined
  const sort = typeof sp.sort === 'string' ? sp.sort : undefined

  const supabase = createPublicSupabaseClient()

  let query = supabase.from('products').select('*').eq('is_active', true)

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else if (sort === 'name_asc') {
    query = query.order('name', { ascending: true })
  } else if (sort === 'name_desc') {
    query = query.order('name', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: products } = await query

  // Get unique categories for filter
  const { data: allProducts } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true)

  const categories = Array.from(
    new Set(
      (allProducts ?? [])
        .map((p) => p.category)
        .filter((c): c is string => c != null && c !== '')
    )
  ).sort()

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Магазин на BOSY',
    url: 'https://bosy.bg/shop',
    isPartOf: { '@id': 'https://bosy.bg/#website' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products?.length ?? 0,
      itemListElement: (products ?? []).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://bosy.bg/product/${p.slug}`,
        item: {
          '@type': 'Product',
          '@id': `https://bosy.bg/product/${p.slug}`,
          name: p.name,
          url: `https://bosy.bg/product/${p.slug}`,
          ...(p.images?.[0] ? { image: absoluteUrl(p.images[0]) } : {}),
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
    },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Начало', item: 'https://bosy.bg' },
      { '@type': 'ListItem', position: 2, name: 'Магазин', item: 'https://bosy.bg/shop' },
    ],
  }

  return (
    <div style={{ background: '#fdf5f0', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Page title */}
      <div className="py-10 text-center">
        <h1
          className="text-4xl font-extrabold tracking-wide"
          style={{ color: '#333' }}
        >
          Магазин
        </h1>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 pb-16">
        <ShopContent
          products={products ?? []}
          categories={categories}
          currentCategory={category}
          currentSearch={search}
          currentSort={sort}
        />
      </div>
    </div>
  )
}
