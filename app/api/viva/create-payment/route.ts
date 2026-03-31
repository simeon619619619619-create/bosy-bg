import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPaymentOrder, getCheckoutUrl } from '@/lib/viva/client'
import { toEur } from '@/lib/currency'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch order with customer
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Convert total from BGN to EUR cents (Viva expects smallest currency unit)
    const totalEur = toEur(order.total)
    const amountCents = Math.round(totalEur * 100)

    const customer = order.customers
    const orderDescription = `BOSY Поръчка #${order.order_number}`

    const { orderCode } = await createPaymentOrder({
      amountCents,
      customerEmail: customer?.email || '',
      customerName: customer?.name || '',
      customerPhone: customer?.phone || undefined,
      orderDescription,
      merchantTrns: order.id,
      sourceCode: process.env.VIVA_SOURCE_CODE || undefined,
    })

    // Store viva order code in the order
    await supabase
      .from('orders')
      .update({
        viva_order_code: String(orderCode),
        payment_status: 'awaiting_payment',
      })
      .eq('id', orderId)

    const checkoutUrl = getCheckoutUrl(orderCode)

    return NextResponse.json({ checkoutUrl, orderCode })
  } catch (err) {
    console.error('Viva create payment error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment creation failed' },
      { status: 500 }
    )
  }
}
