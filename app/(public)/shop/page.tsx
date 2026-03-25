import { createPublicSupabaseClient } from '@/lib/supabase/public'

import { ShopContent } from './shop-content'

export const metadata = {
  title: 'Магазин - BOSY',
  description: 'Протеинови барове, раници и фитнес аксесоари от BOSY',
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

  return (
    <div style={{ background: '#fdf5f0', minHeight: '100vh' }}>
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
