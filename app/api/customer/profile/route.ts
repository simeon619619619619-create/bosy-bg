import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // read-only in GET
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ customer: null })
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('name, email, phone, address')
      .eq('email', user.email!)
      .single()

    if (!customer) {
      return NextResponse.json({ customer: null })
    }

    const addr = typeof customer.address === 'object' && customer.address !== null
      ? (customer.address as Record<string, unknown>)
      : {}

    return NextResponse.json({
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        city: addr.city || '',
        street: addr.street || '',
        zip: addr.zip || '',
        cashback_balance: Number(addr.cashback_balance ?? 0),
      },
    })
  } catch {
    return NextResponse.json({ customer: null })
  }
}
