import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyAdmin } from '@/lib/notify/admin'

/**
 * BOSY Daily Audit
 * ------------------------------------------------------
 * Дневен отчет в 09:00 BG (06:00 UTC) — обобщава всички категории които
 * сме оправяли последните месеци, за да хванем регресии преди клиент.
 *
 * Покрива:
 *  • Поръчки 24ч (нови, confirmed, shipped, delivered, cancelled)
 *  • Плащания (CARD без paid, awaiting >24ч, COD vs CARD приходи)
 *  • Куриери (Speedy/Econt/BoxNow брой пратки, stuck >7д)
 *  • Магазин (top 5 продукти, low stock <5)
 *  • Health signals (last paid order — webhook жив ли е)
 *
 * Праща ВИНАГИ email с обобщение — дори "all healthy" — за да си сигурен
 * че cron-ът работи. Ако няма email сутрин → нещо е счупено.
 */

export const dynamic = 'force-dynamic'

interface OrderRow {
  id: string
  order_number: number
  total: number | string
  status: string
  payment_status: string | null
  notes: string | null
  created_at: string
  updated_at: string
  items?: Array<{ name: string; quantity?: number; price?: number }> | null
  courier?: string | null
}

interface ProductRow {
  id: string
  name: string
  stock_quantity: number | null
  is_active: boolean | null
}

const ICONS = {
  ok: '✅',
  warn: '⚠️',
  crit: '🚨',
  info: '📊',
} as const

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

  const now = Date.now()
  const oneDayAgo = new Date(now - 24 * 3600 * 1000).toISOString()
  const sevenDaysAgo = new Date(now - 7 * 24 * 3600 * 1000).toISOString()

  // === Fetch core datasets ===
  const [orders24h, allOpenOrders, products] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, order_number, total, status, payment_status, notes, created_at, updated_at, items, courier',
      )
      .gte('created_at', oneDayAgo)
      .returns<OrderRow[]>(),
    supabase
      .from('orders')
      .select(
        'id, order_number, total, status, payment_status, notes, created_at, updated_at, courier',
      )
      .in('status', ['confirmed', 'shipped'])
      .returns<OrderRow[]>(),
    supabase
      .from('products')
      .select('id, name, stock_quantity, is_active')
      .eq('is_active', true)
      .returns<ProductRow[]>(),
  ])

  const orders = orders24h.data ?? []
  // openOrders НЕ филтрираме по created_at — stuck-shipped по дефиниция са
  // стари поръчки, нужно ни е целия отворен бекъл за регресионния check.
  const openOrders = allOpenOrders.data ?? []
  const activeProducts = products.data ?? []

  // === SECTION 1 — Поръчки 24ч ===
  const byStatus = (s: string) =>
    orders.filter((o) => o.status === s).length
  const newOrders = orders.length
  const revenue24h = orders
    .filter((o) => o.payment_status === 'paid' || o.notes?.includes('[COD]'))
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0)

  // === SECTION 2 — Плащания (regression checks за 28-29.04 fixes) ===
  const cardShippedUnpaid = openOrders.filter(
    (o) =>
      o.status === 'shipped' &&
      o.payment_status !== 'paid' &&
      o.notes?.includes('[CARD]'),
  )
  const cardAwaiting24h = openOrders.filter(
    (o) =>
      o.payment_status === 'awaiting_payment' &&
      o.notes?.includes('[CARD]') &&
      new Date(o.created_at).getTime() < now - 24 * 3600 * 1000,
  )

  const cardPaid24h = orders.filter(
    (o) => o.payment_status === 'paid' && o.notes?.includes('[CARD]'),
  )
  const codOrders24h = orders.filter((o) => o.notes?.includes('[COD]'))

  // === SECTION 3 — Куриери (regression check за shipping integration) ===
  const stuckShipped = openOrders.filter(
    (o) =>
      o.status === 'shipped' &&
      new Date(o.updated_at).getTime() < now - 7 * 24 * 3600 * 1000,
  )
  const courierCounts = {
    speedy: orders.filter((o) => o.courier === 'speedy' || (!o.courier && o.status === 'shipped')).length,
    econt: orders.filter((o) => o.courier === 'econt').length,
    boxnow: orders.filter((o) => o.courier === 'boxnow').length,
  }

  // === SECTION 4 — Магазин ===
  const productSales = new Map<string, number>()
  for (const o of orders) {
    if (!Array.isArray(o.items)) continue
    for (const item of o.items) {
      if (!item?.name) continue
      productSales.set(
        item.name,
        (productSales.get(item.name) ?? 0) + Number(item.quantity ?? 1),
      )
    }
  }
  const topProducts = [...productSales.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const lowStock = activeProducts
    .filter((p) => typeof p.stock_quantity === 'number' && p.stock_quantity < 5)
    .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0))
    .slice(0, 10)

  // === SECTION 5 — Health signals ===
  const { data: lastPaidArr } = await supabase
    .from('orders')
    .select('id, updated_at')
    .eq('payment_status', 'paid')
    .order('updated_at', { ascending: false })
    .limit(1)
  const lastPaid = lastPaidArr?.[0]
  const hoursSinceLastPaid = lastPaid
    ? Math.round((now - new Date(lastPaid.updated_at).getTime()) / 3600000)
    : null

  // === Build report ===
  const dateBg = new Date().toLocaleDateString('bg', {
    timeZone: 'Europe/Sofia',
  })
  const lines: string[] = []

  lines.push(`BOSY Дневен отчет — ${dateBg}`, '')

  // 1. Activity
  lines.push(`${ICONS.info} Активност (24ч)`)
  lines.push(`  • Нови поръчки: ${newOrders}`)
  lines.push(`  • Confirmed: ${byStatus('confirmed')}`)
  lines.push(`  • Shipped: ${byStatus('shipped')}`)
  lines.push(`  • Delivered: ${byStatus('delivered')}`)
  lines.push(`  • Cancelled: ${byStatus('cancelled')}`)
  lines.push(`  • Приходи: ${revenue24h.toFixed(2)} EUR`)
  lines.push('')

  // 2. Payment integrity (regression от 28-29.04 fixes)
  if (cardShippedUnpaid.length > 0) {
    lines.push(
      `${ICONS.crit} CARD SHIPPED без плащане: ${cardShippedUnpaid.length}`,
    )
    cardShippedUnpaid.slice(0, 5).forEach((o) => {
      lines.push(`  • #${o.order_number} — ${Number(o.total).toFixed(2)}€`)
    })
  } else {
    lines.push(`${ICONS.ok} CARD shipped без плащане: 0 (28.04 fix държи)`)
  }
  if (cardAwaiting24h.length > 0) {
    lines.push(
      `${ICONS.warn} CARD awaiting_payment >24ч: ${cardAwaiting24h.length}`,
    )
    cardAwaiting24h.slice(0, 5).forEach((o) => {
      lines.push(
        `  • #${o.order_number} — ${Number(o.total).toFixed(2)}€ (${new Date(o.created_at).toLocaleDateString('bg')})`,
      )
    })
  }
  lines.push(
    `${ICONS.info} Поръчки 24ч: COD ${codOrders24h.length} / CARD платени ${cardPaid24h.length}`,
  )
  lines.push('')

  // 3. Shipping
  if (stuckShipped.length >= 5) {
    lines.push(
      `${ICONS.warn} Stuck shipped >7д: ${stuckShipped.length} (sync счупен?)`,
    )
    lines.push(`  • Първи: #${stuckShipped[0]?.order_number}`)
  } else {
    lines.push(`${ICONS.ok} Stuck shipped >7д: ${stuckShipped.length} (норм.)`)
  }
  lines.push(
    `${ICONS.info} Куриери 24ч: Speedy ${courierCounts.speedy} / Econt ${courierCounts.econt} / BoxNow ${courierCounts.boxnow}`,
  )
  lines.push('')

  // 4. Магазин
  if (topProducts.length > 0) {
    lines.push(`${ICONS.info} Top 5 продукти 24ч:`)
    topProducts.forEach(([name, qty], i) => {
      lines.push(`  ${i + 1}. ${name} × ${qty}`)
    })
    lines.push('')
  }
  if (lowStock.length > 0) {
    lines.push(`${ICONS.warn} Low stock (<5):`)
    lowStock.forEach((p) => {
      lines.push(`  • ${p.name} — ${p.stock_quantity}`)
    })
    lines.push('')
  } else {
    lines.push(`${ICONS.ok} Низък stock: 0 продукта под 5 наличност`)
    lines.push('')
  }

  // 5. Health signal
  if (hoursSinceLastPaid === null) {
    lines.push(`${ICONS.warn} Няма paid поръчки в системата изобщо`)
  } else if (hoursSinceLastPaid > 48) {
    lines.push(
      `${ICONS.warn} Последно paid: преди ${hoursSinceLastPaid}ч (VIVA webhook?)`,
    )
  } else {
    lines.push(
      `${ICONS.ok} Последно paid: преди ${hoursSinceLastPaid}ч (webhook жив)`,
    )
  }
  lines.push('')

  // Header signal в subject-а
  const hasCritical = cardShippedUnpaid.length > 0
  const hasWarning =
    cardAwaiting24h.length > 0 ||
    stuckShipped.length >= 5 ||
    lowStock.length > 0 ||
    (hoursSinceLastPaid !== null && hoursSinceLastPaid > 48)

  const subject = hasCritical
    ? `🚨 BOSY Дневен отчет — ${dateBg} — критично`
    : hasWarning
      ? `⚠️ BOSY Дневен отчет — ${dateBg}`
      : `✅ BOSY Дневен отчет — ${dateBg} — здраво`

  await notifyAdmin({ subject, body: lines.join('\n') })

  return NextResponse.json({
    sent: true,
    critical: hasCritical,
    warning: hasWarning,
    summary: {
      orders_24h: newOrders,
      revenue_24h: revenue24h.toFixed(2),
      card_shipped_unpaid: cardShippedUnpaid.length,
      card_awaiting_24h: cardAwaiting24h.length,
      stuck_shipped: stuckShipped.length,
      low_stock: lowStock.length,
      hours_since_last_paid: hoursSinceLastPaid,
    },
  })
}
