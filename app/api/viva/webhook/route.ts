import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyTransaction } from '@/lib/viva/client'
import { decrementOrderStock } from '@/lib/orders/stock'

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

    // Verify with Viva API independently — webhook payload alone is not trusted
    // (webhook endpoint has no signature; previous code accepted any caller).
    let txn
    try {
      txn = await verifyTransaction(String(transactionId))
    } catch (err) {
      console.error('Viva webhook verify error:', err)
      return NextResponse.json({ ok: true })
    }

    if (txn.statusId !== 'F' || String(txn.orderCode) !== orderCode) {
      console.warn('Viva webhook ignored — unverified', {
        transactionId,
        webhookOrderCode: orderCode,
        apiStatusId: txn.statusId,
        apiOrderCode: txn.orderCode,
      })
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: updated } = await supabase
      .from('orders')
      .update({
        viva_transaction_id: String(transactionId),
        payment_status: 'paid',
        status: 'pending',
      })
      .eq('viva_order_code', orderCode)
      .select('id')
      .single()

    if (updated?.id) {
      await decrementOrderStock(supabase, updated.id).catch((e) => {
        console.error('decrementOrderStock failed for webhook-paid order', updated.id, e)
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Viva webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
