import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// GET /api/admin/manifest/speedy?date=2026-04-15
// GET /api/admin/manifest/econt?date=2026-04-15
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courier: string }> }
) {
  const { courier } = await params
  if (courier !== 'speedy' && courier !== 'econt') {
    return NextResponse.json({ error: 'Invalid courier' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  const dayStart = new Date(`${dateStr}T00:00:00+03:00`)
  const dayEnd = new Date(`${dateStr}T23:59:59+03:00`)

  const supabase = await createServerSupabaseClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, customer_id, total, items, speedy_tracking_number, econt_tracking_number, courier, updated_at, notes, customers(name, phone)')
    .eq('courier', courier)
    .gte('updated_at', dayStart.toISOString())
    .lte('updated_at', dayEnd.toISOString())
    .in('status', ['shipped', 'delivered'])
    .order('updated_at', { ascending: true })

  const courierLabel = courier === 'econt' ? 'Еконт' : 'Speedy'
  const rows = (orders ?? [])
    .map((o, i) => {
      const customer = (o.customers as { name?: string; phone?: string } | null) ?? {}
      const tracking =
        courier === 'econt' ? o.econt_tracking_number : o.speedy_tracking_number
      const items = Array.isArray(o.items) ? o.items : []
      const totalQty = items.reduce(
        (s, it) => s + Number((it as { quantity?: number }).quantity ?? 0),
        0
      )
      return `
        <tr>
          <td>${i + 1}</td>
          <td class="mono">${esc(o.order_number ?? o.id.slice(0, 8))}</td>
          <td class="mono">${esc(tracking ?? '—')}</td>
          <td>${esc(customer.name ?? '—')}</td>
          <td>${esc(customer.phone ?? '—')}</td>
          <td class="num">${totalQty}</td>
          <td class="num">${Number(o.total ?? 0).toFixed(2)}</td>
        </tr>`
    })
    .join('')

  const count = orders?.length ?? 0
  const totalSum = (orders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0)

  const html = `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8" />
<title>Manifest ${esc(courierLabel)} · ${esc(dateStr)}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: system-ui, -apple-system, Arial, sans-serif; color: #111; font-size: 12px; }
  .header { display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid #111; padding-bottom:10px; margin-bottom:14px; }
  .title { font-size: 22px; font-weight: 800; }
  .sub { color:#666; margin-top:2px; }
  .badge { display:inline-block; padding:4px 10px; border-radius:4px; font-weight:700; background:${courier === 'econt' ? '#00a650' : '#e30613'}; color:#fff; font-size:12px; letter-spacing:1px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th, td { text-align:left; padding:6px 8px; border-bottom:1px solid #eee; }
  th { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#444; border-bottom:2px solid #111; }
  .num { text-align:right; font-family:'SF Mono', Menlo, monospace; }
  .mono { font-family:'SF Mono', Menlo, monospace; font-size:11px; }
  .summary { margin-top:14px; padding-top:10px; border-top:2px solid #111; display:flex; justify-content:space-between; font-weight:700; }
  .sign { margin-top:30px; display:flex; justify-content:space-between; gap:40px; }
  .sign-box { flex:1; border-top:1px solid #333; padding-top:4px; font-size:11px; text-align:center; color:#666; }
  @media print { .no-print { display:none; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Приемо-предавателен лист</div>
      <div class="sub"><span class="badge">${esc(courierLabel.toUpperCase())}</span> · Дата: <strong>${esc(dateStr)}</strong></div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:800;font-size:18px;color:#c77dba">BOSY</div>
      <div style="font-size:11px;color:#666">bosy.bg</div>
    </div>
  </div>

  ${
    count === 0
      ? '<p style="color:#666;text-align:center;padding:30px 0">Няма изпратени пратки с този куриер на тази дата.</p>'
      : `<table>
    <thead>
      <tr>
        <th>#</th>
        <th>Поръчка</th>
        <th>Tracking</th>
        <th>Получател</th>
        <th>Тел.</th>
        <th class="num">Бр.</th>
        <th class="num">Сума BGN</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="summary">
    <span>Общо пратки: ${count}</span>
    <span>Обща сума: ${totalSum.toFixed(2)} лв</span>
  </div>

  <div class="sign">
    <div class="sign-box">Подпис BOSY</div>
    <div class="sign-box">Подпис куриер · ${esc(courierLabel)}</div>
  </div>`
  }

  <div class="no-print" style="position:fixed;top:8px;right:8px;">
    <button onclick="window.print()" style="padding:8px 16px;border-radius:6px;border:0;background:#111;color:#fff;cursor:pointer;font-weight:700">Печат</button>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
