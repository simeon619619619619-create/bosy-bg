import { createClient } from '@supabase/supabase-js'

/** Supabase client with service-role key — use only in server actions / RSC */
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
