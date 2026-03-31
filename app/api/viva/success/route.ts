import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNewOrderNotification } from '@/lib/resend/client'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const transactionId = url.searchParams.get('t')
  const orderCode = url.searchParams.get('s')

  if (!transactionId || !orderCode) {
    return NextResponse.redirect(new URL('/checkout?error=missing_params', req.url))
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find order by viva_order_code
  const { data: order } = await supabase
    .from('orders')
    .select('*, customers(*)')
    .eq('viva_order_code', orderCode)
    .single()

  if (!order) {
    return NextResponse.redirect(new URL('/checkout?error=order_not_found', req.url))
  }

  // Update order as paid
  await supabase
    .from('orders')
    .update({
      viva_transaction_id: transactionId,
      payment_status: 'paid',
      status: 'pending',
    })
    .eq('id', order.id)

  // Send email notifications
  const customer = order.customers
  if (customer?.email) {
    await sendNewOrderNotification(
      customer.email,
      customer.name || '',
      String(order.order_number),
      order.total,
      (order.items as Array<{ name: string; quantity: number; price: number }>).map(
        (i) => ({ name: i.name, quantity: i.quantity, price: i.price })
      )
    ).catch(() => {})
  }

  // Redirect to order confirmation
  return NextResponse.redirect(new URL(`/order-confirmation/${order.id}`, req.url))
}
