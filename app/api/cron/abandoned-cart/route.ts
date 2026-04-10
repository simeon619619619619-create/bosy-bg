import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAbandonedCartReminder } from '@/lib/resend/client'

export async function GET(request: Request) {
  if (
    request.headers.get('authorization') !==
    'Bearer ' + process.env.CRON_SECRET
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find orders that are pending+unpaid, created 1-48 hours ago
    // (not too fresh — give time to complete, not too old — still relevant)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: abandonedOrders, error } = await supabase
      .from('orders')
      .select('id, customer_id, items, total, notes, created_at')
      .eq('status', 'pending')
      .eq('payment_status', 'unpaid')
      .lte('created_at', oneHourAgo)
      .gte('created_at', twoDaysAgo)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!abandonedOrders || abandonedOrders.length === 0) {
      return NextResponse.json({ message: 'No abandoned carts', sent: 0 })
    }

    let sent = 0

    for (const order of abandonedOrders) {
      // Skip if already reminded (check notes for tag)
      if (order.notes?.includes('[ABANDONED-REMINDER-SENT]')) continue

      // Get customer email
      const { data: customer } = await supabase
        .from('customers')
        .select('email, name')
        .eq('id', order.customer_id)
        .single()

      if (!customer?.email) continue

      // Check if customer has completed ANY order (not just this one)
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', order.customer_id)
        .in('status', ['confirmed', 'shipped', 'delivered'])
        .gte('created_at', order.created_at)
        .limit(1)

      // If they completed a later order, skip
      if (completedOrders && completedOrders.length > 0) continue

      // Send abandoned cart email
      await sendAbandonedCartReminder(
        customer.email,
        customer.name || 'Приятелю',
        order.items || [],
        order.total || 0
      ).catch(() => {})

      // Mark as reminded
      const updatedNotes = (order.notes || '') + ' [ABANDONED-REMINDER-SENT]'
      await supabase
        .from('orders')
        .update({ notes: updatedNotes.trim() })
        .eq('id', order.id)

      sent++
    }

    return NextResponse.json({
      message: `Sent ${sent} abandoned cart reminders`,
      sent,
      total: abandonedOrders.length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
