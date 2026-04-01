import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { name, email, phone } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Липсват задължителни полета.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if customer already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      // Customer record already exists — no need to create
      return NextResponse.json({ ok: true })
    }

    // Create new customer record
    const { error: insertError } = await supabase.from('customers').insert({
      name,
      email: email.toLowerCase().trim(),
      phone: phone || null,
      address: { cashback_balance: 0 },
      total_orders: 0,
      total_spent: 0,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
