/**
 * Audit script: за всеки CARD order със 'awaiting_payment' status
 * проверява във Viva дали реално има успешна транзакция.
 *
 * Run: cd ~/Desktop/проекти/bosy-clone && npx tsx scripts/audit-viva-orders.ts
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.prod manually so we don't depend on next-env loaders
const envPath = resolve(process.cwd(), '.env.prod')
const envText = readFileSync(envPath, 'utf-8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(?:"(.*)"|(.*))$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2] ?? m[3] ?? ''
}

const VIVA_API = 'https://api.vivapayments.com'
const VIVA_TOKEN = 'https://accounts.vivapayments.com/connect/token'

let cachedToken: { token: string; exp: number } | null = null
async function token(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.exp - 60_000) return cachedToken.token
  const creds = Buffer.from(
    `${process.env.VIVA_CLIENT_ID}:${process.env.VIVA_CLIENT_SECRET}`
  ).toString('base64')
  const res = await fetch(VIVA_TOKEN, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`Viva OAuth ${res.status}: ${await res.text()}`)
  const data = await res.json()
  cachedToken = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 }
  return cachedToken.token
}

interface VivaTxn {
  transactionId: string
  statusId: string // 'F' = completed/paid, 'A' = active/pending, 'X' = cancelled, 'E' = error, 'M' = void
  amount: number
  orderCode: number
  insDate: string
}

async function vivaTransactionsByOrder(orderCode: string): Promise<VivaTxn[]> {
  const t = await token()
  const res = await fetch(
    `${VIVA_API}/api/transactions?ordercode=${encodeURIComponent(orderCode)}`,
    { headers: { Authorization: `Bearer ${t}` } }
  )
  if (res.status === 404) return []
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Viva txn lookup ${res.status}: ${text}`)
  }
  const body = await res.json()
  const list = (body?.Transactions ?? body?.transactions ?? []) as Array<Record<string, unknown>>
  return list.map((r) => ({
    transactionId: String(r.TransactionId ?? r.transactionId ?? ''),
    statusId: String(r.StatusId ?? r.statusId ?? ''),
    amount: Number(r.Amount ?? r.amount ?? 0),
    orderCode: Number(r.OrderCode ?? r.orderCode ?? 0),
    insDate: String(r.InsDate ?? r.insDate ?? ''),
  }))
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, viva_order_code, viva_transaction_id, total, notes, created_at, customers(name, email)')
    .ilike('notes', '%[CARD]%')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!orders) return

  console.log(`\n🔍 Auditing ${orders.length} CARD orders against Viva\n`)
  console.log('─'.repeat(110))

  let actuallyPaid = 0
  let unpaid = 0
  let errored = 0

  for (const o of orders) {
    const code = o.viva_order_code as string | null
    if (!code) {
      console.log(`#${o.order_number}  status=${o.status}  ⚠️  Няма viva_order_code (clientът никога не е стартирал плащане)`)
      unpaid++
      continue
    }

    try {
      const txns = await vivaTransactionsByOrder(code)
      const paid = txns.find((t) => t.statusId === 'F')
      const customer = (o.customers as unknown as { name?: string; email?: string } | null) ?? {}
      const tag =
        o.status === 'shipped' ? '🚚' :
        o.status === 'confirmed' ? '📦' :
        o.status === 'cancelled' ? '🛑' : '⏳'

      if (paid) {
        actuallyPaid++
        console.log(
          `#${o.order_number}  ${tag} ${o.status.padEnd(10)}  ✅ PAID  amount=${(paid.amount).toFixed(2)} EUR  txn=${paid.transactionId}  total_db=${o.total}`
        )
      } else if (txns.length === 0) {
        unpaid++
        console.log(
          `#${o.order_number}  ${tag} ${o.status.padEnd(10)}  ❌ NO TRANSACTION  code=${code}  ${customer.name ?? ''} <${customer.email ?? ''}>`
        )
      } else {
        unpaid++
        const statuses = txns.map((t) => t.statusId).join(',')
        console.log(
          `#${o.order_number}  ${tag} ${o.status.padEnd(10)}  ❌ NOT PAID  statuses=[${statuses}]  code=${code}`
        )
      }
    } catch (err) {
      errored++
      console.log(`#${o.order_number}  ⚠️ ERR  ${(err as Error).message}`)
    }
    await new Promise((r) => setTimeout(r, 150)) // rate limit safety
  }

  console.log('─'.repeat(110))
  console.log(`\nSUMMARY: ${actuallyPaid} actually paid · ${unpaid} unpaid · ${errored} errors\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
