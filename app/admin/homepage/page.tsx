import { createServerSupabaseClient } from '@/lib/supabase/server'
import { HomepageEditor } from './homepage-editor'

export default async function HomepagePage() {
  const supabase = await createServerSupabaseClient()

  // Get all active products
  const { data: products } = await supabase
    .from('products')
    .select('slug, name, price, images, category')
    .eq('is_active', true)
    .order('name')

  // Get current featured slugs from settings
  const { data: setting } = await supabase
    .from('content_blocks')
    .select('id, body')
    .eq('type', 'setting')
    .eq('title', 'homepage_featured_slugs')
    .single()

  const currentSlugs: string[] = setting?.body
    ? JSON.parse(setting.body)
    : [
        'protein-cream-macadamia',
        'lychee-blueberry',
        'dragon-fruit',
        'bubbles-lemongrass-ginger-green-tea',
        'fitbody-4x4',
        'protein-bar-box',
        'protein-crispy-balls-x26',
        'africa-balls-x-16',
      ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Начална страница — Продукти</h1>
      <p className="text-sm text-gray-500 mb-6">
        Избери и подреди продуктите, които се показват на началната страница. Влачи за преподреждане.
      </p>
      <HomepageEditor
        allProducts={products ?? []}
        currentSlugs={currentSlugs}
        settingId={setting?.id ?? null}
      />
    </div>
  )
}
