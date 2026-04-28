import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNewOrderNotification } from '@/lib/resend/client'
import { verifyTransaction } from '@/lib/viva/client'

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

  // Verify the transaction with Viva API before marking as paid
  try {
    const txn = await verifyTransaction(transactionId)
    // statusId 'F' = completed/paid; check orderCode matches too
    if (txn.statusId !== 'F' || String(txn.orderCode) !== orderCode) {
      console.error('Viva verification failed:', { statusId: txn.statusId, orderCode: txn.orderCode, expected: orderCode })
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', order.id)
      return NextResponse.redirect(new URL('/checkout?error=payment_not_verified', req.url))
    }
  } catch (err) {
    console.error('Viva verify error:', err)
    await supabase
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', order.id)
    return NextResponse.redirect(new URL('/checkout?error=payment_verification_failed', req.url))
  }

  // Update order as paid (verified with Viva)
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
      ),
      'card'
    ).catch(() => {})
  }

  // Redirect to order confirmation
  return NextResponse.redirect(new URL(`/order-confirmation/${order.id}`, req.url))
}
