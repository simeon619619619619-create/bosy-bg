import { createServerSupabaseClient } from './server'

export async function getAuthUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single()

  return profile
}
