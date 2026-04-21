import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Resend webhook events: https://resend.com/docs/webhooks
interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject?: string
    headers?: Array<{ name: string; value: string }>
  }
}

export async function POST(request: Request) {
  try {
    const event = (await request.json()) as ResendWebhookEvent

    // Only process B2B campaign emails (identified by X-Entity-Ref-ID header starting with b2b-)
    const refHeader = event.data.headers?.find(h => h.name === 'X-Entity-Ref-ID')
    const isB2B = refHeader?.value?.startsWith('b2b-')

    if (!isB2B) {
      return NextResponse.json({ ok: true, skipped: 'not b2b' })
    }

    const recipientEmail = event.data.to?.[0]?.toLowerCase()
    if (!recipientEmail) {
      return NextResponse.json({ ok: true, skipped: 'no recipient' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date().toISOString()

    switch (event.type) {
      case 'email.opened': {
        // Set opened_at on first open
        await supabase
          .from('b2b_campaigns')
          .update({ opened_at: now })
          .eq('email', recipientEmail)
          .is('opened_at', null)

        // Increment open_count
        const { data: current } = await supabase
          .from('b2b_campaigns')
          .select('open_count')
          .eq('email', recipientEmail)
          .single()
        if (current) {
          await supabase
            .from('b2b_campaigns')
            .update({ open_count: (current.open_count ?? 0) + 1 })
            .eq('email', recipientEmail)
        }
        break
      }

      case 'email.clicked': {
        await supabase
          .from('b2b_campaigns')
          .update({ clicked_at: now })
          .eq('email', recipientEmail)
          .is('clicked_at', null)
        break
      }

      case 'email.bounced':
      case 'email.complained': {
        // Mark as bounced — stop sending
        await supabase
          .from('b2b_campaigns')
          .update({ bounced_at: now, replied_at: now })
          .eq('email', recipientEmail)
        break
      }

      case 'email.delivered': {
        // Just log, no action needed
        break
      }
    }

    return NextResponse.json({ ok: true, type: event.type, email: recipientEmail })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
