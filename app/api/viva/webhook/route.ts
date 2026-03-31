import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Viva Wallet sends a verification GET request first
export async function GET() {
  // Return the verification key that Viva expects
  const key = process.env.VIVA_WEBHOOK_KEY
  if (!key) {
    return NextResponse.json({ error: 'Webhook key not configured' }, { status: 500 })
  }
  return new NextResponse(key, { headers: { 'Content-Type': 'text/plain' } })
}

// Actual webhook notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Viva sends different event types
    const eventTypeId = body.EventTypeId
    const eventData = body.EventData

    // 1796 = Transaction Payment Created
    if (eventTypeId !== 1796) {
      return NextResponse.json({ ok: true })
    }

    const transactionId = eventData?.TransactionId
    const orderCode = eventData?.OrderCode?.toString()

    if (!transactionId || !orderCode) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update order as paid (backup for redirect flow)
    await supabase
      .from('orders')
      .update({
        viva_transaction_id: transactionId,
        payment_status: 'paid',
        status: 'pending',
      })
      .eq('viva_order_code', orderCode)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Viva webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
