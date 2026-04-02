import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  const { customerId, salesStep } = await req.json()

  if (!customerId) {
    return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  // Get current address JSONB
  const { data: customer } = await supabase
    .from('customers')
    .select('address')
    .eq('id', customerId)
    .single()

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const address =
    typeof customer.address === 'object' && customer.address !== null
      ? customer.address
      : {}

  // Store sales_step inside address JSONB
  const updatedAddress = { ...address, sales_step: salesStep }

  const { error } = await supabase
    .from('customers')
    .update({ address: updatedAddress })
    .eq('id', customerId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
