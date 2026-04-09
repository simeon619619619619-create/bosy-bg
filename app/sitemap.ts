import type { MetadataRoute } from 'next'
import { createPublicSupabaseClient } from '@/lib/supabase/public'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://bosy.bg'

  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/bosy-club`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/contacts`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/reviews`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Dynamic product pages
  let productPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createPublicSupabaseClient()
    const { data } = await supabase
      .from('products')
      .select('slug, updated_at, created_at')
      .eq('is_active', true)
    if (data) {
      productPages = data.map((p: { slug: string; updated_at?: string | null; created_at?: string | null }) => ({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: new Date(p.updated_at || p.created_at || now),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch {}

  return [...staticPages, ...productPages]
}
