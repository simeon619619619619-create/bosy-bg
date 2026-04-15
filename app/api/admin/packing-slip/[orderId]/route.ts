import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatAddress(customer: {
  address?: unknown
} | null): string {
  if (!customer) return '—'
  const addr = customer.address
  if (!addr) return '—'
  if (typeof addr === 'string') return addr
  if (typeof addr === 'object' && addr !== null) {
    const a = addr as Record<string, unknown>
    const parts = [a.street, a.city, a.zip].filter(Boolean).map(String)
    return parts.join(', ') || '—'
  }
  return '—'
}

// GET /api/admin/packing-slip/[orderId] → HTML printable
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, customers(name, email, phone, address)')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const customer = order.customers as {
    name: string
    email: string | null
    phone: string | null
    address: unknown
  } | null

  const items: Array<{
    name: string
    quantity: number
    price: number
    sku?: string
    id?: string
  }> = Array.isArray(order.items) ? order.items : []

  const notes = (order.notes as string) ?? ''
  const officeMatch = notes.match(/\[OFFICE:(\d+)\]/)
  const econtOfficeMatch = notes.match(/\[ECONT_OFFICE:(\d+)\]/)
  const isCod = notes.includes('[COD]')
  const courier = (order.courier as string) || 'speedy'
  const courierLabel = courier === 'econt' ? 'Еконт' : 'Speedy'

  let deliveryLine = formatAddress(customer)
  if (officeMatch) deliveryLine = `${courierLabel} офис #${officeMatch[1]}`
  if (econtOfficeMatch) deliveryLine = `Еконт офис #${econtOfficeMatch[1]}`

  const totalQty = items.reduce((s, i) => s + (i.quantity ?? 0), 0)

  const cleanNotes = notes.replace(/\[[^\]]+\]/g, '').trim()

  const itemRows = items
    .map(
      (i) => `
    <tr>
      <td class="sku">${esc(i.sku ?? i.id ?? '—')}</td>
      <td>${esc(i.name)}</td>
      <td class="num">${esc(i.quantity)}</td>
    </tr>`
    )
    .join('')

  const html = `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8" />
<title>Packing Slip #${esc(order.order_number ?? order.id)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: system-ui, -apple-system, Arial, sans-serif; color: #111; font-size: 13px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #c77dba; padding-bottom:12px; margin-bottom:16px; }
  .logo { font-weight:800; font-size:22px; color:#c77dba; letter-spacing:2px; }
  .meta { text-align:right; }
  .meta .order-no { font-size:18px; font-weight:800; }
  .meta .date { color:#666; font-size:12px; margin-top:2px; }
  .section { margin-top:14px; }
  h2 { font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#666; margin:0 0 6px 0; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .box { border:1px solid #e5e7eb; border-radius:8px; padding:10px 12px; background:#fff; }
  .box .line { margin:2px 0; }
  .big-courier { display:inline-block; padding:4px 10px; border-radius:6px; font-weight:800; background:#fef3c7; color:#b45309; font-size:12px; letter-spacing:1px; }
  .cod-tag { display:inline-block; padding:4px 10px; border-radius:6px; font-weight:800; background:#fee2e2; color:#b91c1c; font-size:12px; letter-spacing:1px; margin-left:6px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  thead th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#666; border-bottom:1px solid #e5e7eb; padding:6px 8px; }
  tbody td { padding:8px; border-bottom:1px solid #f1f1f1; font-size:13px; }
  .num { text-align:right; font-weight:700; width:80px; }
  .sku { font-family:'SF Mono', Menlo, monospace; font-size:12px; color:#6b7280; width:140px; }
  .total-row td { font-weight:800; font-size:14px; padding-top:12px; border-top:2px solid #111; border-bottom:none; }
  .notes-box { border-left:4px solid #c77dba; background:#fdf7fc; padding:10px 12px; border-radius:4px; margin-top:12px; white-space:pre-wrap; font-size:13px; }
  .footer { margin-top:22px; text-align:center; color:#999; font-size:11px; }
  @media print { .no-print { display:none; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">BOSY</div>
      <div style="font-size:11px;color:#666;">Packing Slip · Лист за пакетиране</div>
    </div>
    <div class="meta">
      <div class="order-no">№ ${esc(order.order_number ?? order.id)}</div>
      <div class="date">${new Date(order.created_at).toLocaleString('bg-BG')}</div>
      <div style="margin-top:6px;">
        <span class="big-courier">${esc(courierLabel.toUpperCase())}</span>
        ${isCod ? '<span class="cod-tag">НАЛ. ПЛАЩАНЕ</span>' : ''}
      </div>
    </div>
  </div>

  <div class="row">
    <div class="box">
      <h2>Получател</h2>
      <div class="line" style="font-weight:700">${esc(customer?.name ?? '—')}</div>
      <div class="line">${esc(customer?.phone ?? '—')}</div>
      <div class="line" style="color:#666;font-size:12px;">${esc(customer?.email ?? '—')}</div>
    </div>
    <div class="box">
      <h2>Доставка</h2>
      <div class="line" style="font-weight:700">${esc(deliveryLine)}</div>
      ${cleanNotes ? `<div class="line" style="color:#666;font-size:12px;margin-top:4px">Коментар: ${esc(cleanNotes)}</div>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Продукти за пакетиране (${items.length} артикула · ${totalQty} бр. общо)</h2>
    <table>
      <thead>
        <tr>
          <th>SKU / ID</th>
          <th>Продукт</th>
          <th class="num">Брой</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="total-row">
          <td></td>
          <td>Общо бройки за опаковане</td>
          <td class="num">${totalQty}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${cleanNotes ? `<div class="notes-box"><strong>⚠ Бележка от клиента:</strong><br />${esc(cleanNotes)}</div>` : ''}

  <div class="footer">BOSY — bosy.bg · Разпечатано ${new Date().toLocaleString('bg-BG')}</div>

  <div class="no-print" style="position:fixed;top:8px;right:8px;">
    <button onclick="window.print()" style="padding:8px 16px;border-radius:6px;border:0;background:#c77dba;color:#fff;cursor:pointer;font-weight:700">Печат</button>
  </div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 300))</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
