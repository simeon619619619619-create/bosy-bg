'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createContent(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const type = formData.get('type') as string
  const title = formData.get('title') as string
  const body = formData.get('body') as string
  const imageUrl = formData.get('image_url') as string
  const isPublished = formData.get('is_published') === 'true'
  const position = parseInt(formData.get('position') as string) || 0

  const { error } = await supabase.from('content_blocks').insert({
    type,
    title,
    body: body || null,
    image_url: imageUrl || null,
    is_published: isPublished,
    position,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/content')
  redirect('/content')
}

export async function updateContent(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const type = formData.get('type') as string
  const title = formData.get('title') as string
  const body = formData.get('body') as string
  const imageUrl = formData.get('image_url') as string
  const isPublished = formData.get('is_published') === 'true'
  const position = parseInt(formData.get('position') as string) || 0

  const { error } = await supabase
    .from('content_blocks')
    .update({
      type,
      title,
      body: body || null,
      image_url: imageUrl || null,
      is_published: isPublished,
      position,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/content')
  redirect('/content')
}

export async function deleteContent(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('content_blocks').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/content')
  redirect('/content')
}

export async function togglePublished(id: string, isPublished: boolean) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('content_blocks')
    .update({ is_published: isPublished })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/content')
}
