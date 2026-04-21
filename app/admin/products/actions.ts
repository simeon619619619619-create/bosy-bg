'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createProduct(formData: FormData) {
  const supabase = createAdminSupabaseClient()

  const name = formData.get('name') as string
  const slug = (formData.get('slug') as string) || slugify(name)
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const comparePrice = parseFloat(formData.get('compare_price') as string) || null
  const category = formData.get('category') as string
  const stockQuantity = parseInt(formData.get('stock_quantity') as string) || 0
  const isActive = formData.get('is_active') === 'true'
  const imageUrl = ((formData.get('image_url') as string) ?? '').trim()
  const shortName = ((formData.get('short_name') as string) ?? '').trim()

  const variants: Record<string, unknown> = {}
  if (shortName) variants.short_name = shortName

  const { error } = await supabase.from('products').insert({
    name,
    slug,
    description,
    price,
    compare_price: comparePrice,
    category,
    stock_quantity: stockQuantity,
    is_active: isActive,
    images: imageUrl ? [imageUrl] : [],
    variants,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createAdminSupabaseClient()

  const name = formData.get('name') as string
  const slug = (formData.get('slug') as string) || slugify(name)
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const comparePrice = parseFloat(formData.get('compare_price') as string) || null
  const category = formData.get('category') as string
  const stockQuantity = parseInt(formData.get('stock_quantity') as string) || 0
  const isActive = formData.get('is_active') === 'true'
  const imageUrl = ((formData.get('image_url') as string) ?? '').trim()
  const shortName = ((formData.get('short_name') as string) ?? '').trim()

  const { data: existing } = await supabase
    .from('products')
    .select('variants, images')
    .eq('id', id)
    .single()

  // Merge short_name into existing variants JSONB
  const variants = (existing?.variants as Record<string, unknown>) ?? {}
  if (shortName) {
    variants.short_name = shortName
  } else {
    delete variants.short_name
  }

  // Replace the first image when the URL changes; keep other images intact.
  // Empty URL clears all images (matches what the form displays).
  const existingImages = Array.isArray(existing?.images) ? (existing.images as string[]) : []
  let newImages: string[]
  if (!imageUrl) {
    newImages = []
  } else if (existingImages.length === 0) {
    newImages = [imageUrl]
  } else if (existingImages[0] === imageUrl) {
    newImages = existingImages
  } else {
    newImages = [imageUrl, ...existingImages.slice(1)]
  }

  const { error } = await supabase
    .from('products')
    .update({
      name,
      slug,
      description,
      price,
      compare_price: comparePrice,
      category,
      stock_quantity: stockQuantity,
      is_active: isActive,
      images: newImages,
      variants,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function deleteProduct(id: string) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function exportProductsCSV() {
  const supabase = createAdminSupabaseClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  if (!products || products.length === 0) {
    return 'name,slug,description,price,compare_price,category,stock_quantity,is_active,image_url\n'
  }

  const headers = [
    'name',
    'slug',
    'description',
    'price',
    'compare_price',
    'category',
    'stock_quantity',
    'is_active',
    'image_url',
  ]

  const csvRows = [headers.join(',')]

  for (const product of products) {
    const row = headers.map((header) => {
      const value = product[header]
      if (value === null || value === undefined) return ''
      const str = String(value)
      // Escape CSV values that contain commas, quotes, or newlines
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    csvRows.push(row.join(','))
  }

  return csvRows.join('\n')
}

export async function moveProduct(id: string, direction: 'up' | 'down') {
  const supabase = createAdminSupabaseClient()

  // Get all products in current order
  const { data: products } = await supabase
    .from('products')
    .select('id, created_at')
    .order('created_at', { ascending: false })

  if (!products) return

  const idx = products.findIndex((p) => p.id === id)
  if (idx === -1) return

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= products.length) return

  // Swap created_at timestamps
  const thisTime = products[idx].created_at
  const otherTime = products[swapIdx].created_at

  await supabase.from('products').update({ created_at: otherTime }).eq('id', products[idx].id)
  await supabase.from('products').update({ created_at: thisTime }).eq('id', products[swapIdx].id)

  revalidatePath('/products')
  revalidatePath('/shop')
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/products')
}
