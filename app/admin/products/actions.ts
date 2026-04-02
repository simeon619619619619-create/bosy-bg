'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
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
  const supabase = await createServerSupabaseClient()

  const name = formData.get('name') as string
  const slug = (formData.get('slug') as string) || slugify(name)
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const comparePrice = parseFloat(formData.get('compare_price') as string) || null
  const category = formData.get('category') as string
  const stockQuantity = parseInt(formData.get('stock_quantity') as string) || 0
  const isActive = formData.get('is_active') === 'true'
  const imageUrl = formData.get('image_url') as string

  const { error } = await supabase.from('products').insert({
    name,
    slug,
    description,
    price,
    compare_price: comparePrice,
    category,
    stock_quantity: stockQuantity,
    is_active: isActive,
    image_url: imageUrl || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/products')
  redirect('/products')
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const name = formData.get('name') as string
  const slug = (formData.get('slug') as string) || slugify(name)
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const comparePrice = parseFloat(formData.get('compare_price') as string) || null
  const category = formData.get('category') as string
  const stockQuantity = parseInt(formData.get('stock_quantity') as string) || 0
  const isActive = formData.get('is_active') === 'true'
  const imageUrl = formData.get('image_url') as string

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
      image_url: imageUrl || null,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/products')
  redirect('/products')
}

export async function deleteProduct(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/products')
  redirect('/products')
}

export async function exportProductsCSV() {
  const supabase = await createServerSupabaseClient()

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
  const supabase = await createServerSupabaseClient()

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
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/products')
}
