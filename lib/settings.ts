import { createClient } from '@supabase/supabase-js'

const CONFIG_EMAIL = 'system@config.bosy.bg'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getSiteSettings(): Promise<{ cashback_percent: number }> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('customers')
    .select('address')
    .eq('email', CONFIG_EMAIL)
    .single()

  const addr = data?.address as Record<string, unknown> | null
  return {
    cashback_percent: Number(addr?.cashback_percent ?? 5),
  }
}

export async function updateSiteSettings(settings: { cashback_percent: number }) {
  const supabase = getSupabase()
  const { data: existing } = await supabase
    .from('customers')
    .select('address')
    .eq('email', CONFIG_EMAIL)
    .single()

  const currentAddr = (existing?.address as Record<string, unknown>) ?? {}

  await supabase
    .from('customers')
    .update({
      address: { ...currentAddr, ...settings },
    })
    .eq('email', CONFIG_EMAIL)
}
