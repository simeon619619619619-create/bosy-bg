'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createUser(formData: FormData) {
  const supabase = getServiceClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (authError) {
    throw new Error(authError.message)
  }

  const { error: dbError } = await supabase.from('users').insert({
    id: authData.user.id,
    name,
    email,
    role,
  })

  if (dbError) {
    // Clean up auth user if DB insert fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new Error(dbError.message)
  }

  revalidatePath('/settings')
  redirect('/settings')
}

export async function updateUserRole(id: string, role: string) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/settings')
}

export async function deleteUser(id: string) {
  const supabase = getServiceClient()

  const { error: dbError } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (dbError) {
    throw new Error(dbError.message)
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(id)

  if (authError) {
    throw new Error(authError.message)
  }

  revalidatePath('/settings')
  redirect('/settings')
}
