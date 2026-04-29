import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyAdmin } from '@/lib/telegram/notify'

/**
 * Payment Health Watchdog
 * ------------------------------------------------------
 * Активен мониторинг за тихи плащания/shipping инциденти. Праща Telegram
 * alert на админа ако намери:
 *
 * 1. CARD поръчки със status=shipped, но payment_status≠paid
 *    (хваща повторение на 28.04 VIVA incident — 19 поръчки shipped без плащане)
 *
 * 2. CARD поръчки в status=confirmed, payment_status=awaiting_payment >24ч
 *    (висящи плащания → или клиентът е отказал, или webhook е счупен)
 *
 * 3. Shipped поръчки със shipped_at >7 дни без статус delivered (Speedy/Econt
 *    не са synчвали → tracking webhook счупен)
 *
 * Изпълнение: всеки 10 минути през vercel cron.
 */

export const dynamic = 'force-dynamic'

interface AlertSection {
  title: string
  lines: string[]
}

export async function GET(request: Request) {
  if (
    request.headers.get('authorization') !==
    'Bearer ' + process.env.CRON_SECRET
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const sections: AlertSection[] = []
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  // 1. CARD shipped без плащане ← най-критично
  const { data: unpaidShipped, error: e1 } = await supabase
    .from('orders')
    .select('id, order_number, total, payment_status, notes, created_at')
    .eq('status', 'shipped')
    .neq('payment_status', 'paid')
    .gte('created_at', sevenDaysAgo)
    .like('notes', '%[CARD]%')
    .limit(20)

  if (e1) console.error('[payment-health] Q1 failed:', e1)
  if (unpaidShipped && unpaidShipped.length > 0) {
    sections.push({
      title: `🚨 ${unpaidShipped.length} CARD поръчки SHIPPED без плащане`,
      lines: unpaidShipped.map(
        (o) =>
          `  • #${o.order_number} — ${Number(o.total).toFixed(2)}€ (${o.payment_status ?? 'unpaid'})`,
      ),
    })
  }

  // 2. CARD awaiting_payment >24h ← виси, или webhook е счупен
  const { data: stuckPayment, error: e2 } = await supabase
    .from('orders')
    .select('id, order_number, total, payment_status, notes, created_at')
    .eq('payment_status', 'awaiting_payment')
    .lt('created_at', oneDayAgo)
    .gte('created_at', sevenDaysAgo)
    .like('notes', '%[CARD]%')
    .limit(10)

  if (e2) console.error('[payment-health] Q2 failed:', e2)
  if (stuckPayment && stuckPayment.length > 0) {
    sections.push({
      title: `⚠️ ${stuckPayment.length} CARD поръчки awaiting_payment >24ч`,
      lines: stuckPayment.map(
        (o) =>
          `  • #${o.order_number} — ${Number(o.total).toFixed(2)}€ (${new Date(o.created_at).toLocaleDateString('bg')})`,
      ),
    })
  }

  // 3. Shipped >7д не-delivered → tracking sync счупен (или забравена ръчна
  // confirmation). Праща се само ако има 5+ — иначе шумно.
  const { data: oldShipped, error: e3 } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('status', 'shipped')
    .lt('updated_at', sevenDaysAgo)
    .limit(50)

  if (e3) console.error('[payment-health] Q3 failed:', e3)
  if (oldShipped && oldShipped.length >= 5) {
    sections.push({
      title: `⚠️ ${oldShipped.length} пратки в status=shipped >7 дни (sync счупен?)`,
      lines: [`  • Първи: #${oldShipped[0]?.order_number}`, `  • Общо: ${oldShipped.length}`],
    })
  }

  if (sections.length === 0) {
    return NextResponse.json({ status: 'healthy', checks: 3 })
  }

  const message = [
    '<b>BOSY Payment Health Alert</b>',
    new Date().toLocaleString('bg', { timeZone: 'Europe/Sofia' }),
    '',
    ...sections.flatMap((s) => [s.title, ...s.lines, '']),
  ].join('\n')

  await notifyAdmin(message)

  return NextResponse.json({
    alerts: sections.length,
    sections: sections.map((s) => s.title),
  })
}
