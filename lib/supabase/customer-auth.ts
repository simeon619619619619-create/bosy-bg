import { createServerSupabaseClient } from './server'

/**
 * Get the currently logged-in customer (from `customers` table).
 * Returns null if not logged in or if the auth user has no matching customer row.
 */
export async function getCustomer() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Look up by email in the customers table
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, email, phone, address, total_orders, total_spent')
    .eq('email', user.email!)
    .single()

  if (!customer) return null

  return { ...customer, auth_id: user.id }
}
