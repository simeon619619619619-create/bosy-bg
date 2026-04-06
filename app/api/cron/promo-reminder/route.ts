import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEasterPromoReminder } from '@/lib/resend/client'

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

    // Find promo sends from 10+ days ago where reminder not yet sent
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const { data: pendingReminders, error } = await supabase
      .from('promo_sends')
      .select('*')
      .eq('reminder_sent', false)
      .eq('code_used', false)
      .lte('sent_at', tenDaysAgo.toISOString())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      return NextResponse.json({ message: 'No reminders to send', sent: 0 })
    }

    let sent = 0

    for (const record of pendingReminders) {
      // Check if this customer has used the promo code (order with [PROMO:VELIKDEN20])
      const { data: usedOrders } = await supabase
        .from('orders')
        .select('id')
        .ilike('notes', `%[PROMO:${record.promo_code}]%`)
        .eq('customer_id', (
          await supabase
            .from('customers')
            .select('id')
            .eq('email', record.customer_email)
            .single()
        ).data?.id ?? '')
        .limit(1)

      if (usedOrders && usedOrders.length > 0) {
        // Code was used — mark as used, skip reminder
        await supabase
          .from('promo_sends')
          .update({ code_used: true })
          .eq('id', record.id)
        continue
      }

      // Send reminder email
      await sendEasterPromoReminder(
        record.customer_email,
        record.customer_name || 'Приятелю',
        record.promo_code
      ).catch(() => {})

      // Mark reminder as sent
      await supabase
        .from('promo_sends')
        .update({
          reminder_sent: true,
          reminder_sent_at: new Date().toISOString(),
        })
        .eq('id', record.id)

      sent++
    }

    return NextResponse.json({
      message: `Sent ${sent} reminders`,
      sent,
      total: pendingReminders.length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
