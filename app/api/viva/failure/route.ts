import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const orderCode = url.searchParams.get('s')

  if (orderCode) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Mark payment as failed
    await supabase
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('viva_order_code', orderCode)
  }

  return NextResponse.redirect(new URL('/checkout?error=payment_failed', req.url))
}
