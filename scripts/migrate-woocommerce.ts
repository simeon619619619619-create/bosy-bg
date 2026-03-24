// Run: npx tsx scripts/migrate-woocommerce.ts
// Requires: WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET
//           NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '..', '.env.local') })

const WOO_URL = process.env.WOOCOMMERCE_URL!
const WOO_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!
const WOO_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!WOO_URL || !WOO_KEY || !WOO_SECRET) {
  console.error('Missing WooCommerce environment variables')
  process.exit(1)
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ---------------------------------------------------------------------------
// WooCommerce API helper
// ---------------------------------------------------------------------------

async function fetchWoo(endpoint: string, page = 1): Promise<{ data: any[]; totalPages: number }> {
  const auth = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64')
  const url = `${WOO_URL}/wp-json/wc/v3/${endpoint}?per_page=100&page=${page}`
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) {
    throw new Error(`WooCommerce API error ${res.status}: ${await res.text()}`)
  }
  return {
    data: await res.json(),
    totalPages: parseInt(res.headers.get('x-wp-totalpages') || '1', 10),
  }
}

async function fetchAllWoo(endpoint: string): Promise<any[]> {
  const all: any[] = []
  let page = 1
  let totalPages = 1

  do {
    console.log(`  Fetching ${endpoint} page ${page}/${totalPages}...`)
    const result = await fetchWoo(endpoint, page)
    totalPages = result.totalPages
    all.push(...result.data)
    page++
  } while (page <= totalPages)

  return all
}

// ---------------------------------------------------------------------------
// WooCommerce order status → Supabase order status mapping
// ---------------------------------------------------------------------------

function mapOrderStatus(wcStatus: string): string {
  const mapping: Record<string, string> = {
    pending: 'pending',
    processing: 'confirmed',
    'on-hold': 'pending',
    completed: 'delivered',
    cancelled: 'cancelled',
    refunded: 'cancelled',
    failed: 'cancelled',
    shipped: 'shipped',
  }
  return mapping[wcStatus] || 'pending'
}

// ---------------------------------------------------------------------------
// Migrate Products
// ---------------------------------------------------------------------------

async function migrateProducts(): Promise<number> {
  console.log('\n=== Migrating Products ===')
  const products = await fetchAllWoo('products')
  console.log(`Fetched ${products.length} products from WooCommerce`)

  let inserted = 0

  for (const p of products) {
    const images = (p.images || []).map((img: any) => ({
      src: img.src,
      alt: img.alt || '',
    }))

    const variants = (p.variations || []).length > 0
      ? p.attributes?.map((attr: any) => ({
          name: attr.name,
          options: attr.options,
        })) || []
      : []

    const record = {
      name: p.name,
      slug: p.slug,
      description: p.description || p.short_description || null,
      price: parseFloat(p.price || p.regular_price || '0'),
      compare_price: p.regular_price && p.sale_price
        ? parseFloat(p.regular_price)
        : null,
      category: p.categories?.[0]?.name || null,
      images,
      variants,
      stock_quantity: p.stock_quantity ?? 0,
      is_active: p.status === 'publish',
    }

    const { error } = await supabase.from('products').upsert(record, {
      onConflict: 'slug',
    })

    if (error) {
      console.error(`  Error inserting product "${p.name}": ${error.message}`)
    } else {
      inserted++
    }
  }

  console.log(`Inserted/updated ${inserted}/${products.length} products`)
  return inserted
}

// ---------------------------------------------------------------------------
// Migrate Customers & Orders
// ---------------------------------------------------------------------------

async function migrateCustomersAndOrders(): Promise<{ customers: number; orders: number }> {
  console.log('\n=== Migrating Orders & Customers ===')
  const orders = await fetchAllWoo('orders')
  console.log(`Fetched ${orders.length} orders from WooCommerce`)

  // --- Extract unique customers by email ---
  const customerMap = new Map<string, any>()

  for (const o of orders) {
    const billing = o.billing || {}
    const shipping = o.shipping || {}
    const email = (billing.email || '').trim().toLowerCase()
    if (!email) continue

    const existing = customerMap.get(email)

    const address = {
      address_1: billing.address_1 || '',
      address_2: billing.address_2 || '',
      city: billing.city || '',
      state: billing.state || '',
      postcode: billing.postcode || '',
      country: billing.country || '',
      shipping_address_1: shipping.address_1 || '',
      shipping_city: shipping.city || '',
      shipping_postcode: shipping.postcode || '',
      shipping_country: shipping.country || '',
    }

    if (!existing) {
      customerMap.set(email, {
        name: [billing.first_name, billing.last_name].filter(Boolean).join(' ') || email,
        email,
        phone: billing.phone || null,
        address,
        total_orders: 1,
        total_spent: parseFloat(o.total || '0'),
      })
    } else {
      existing.total_orders += 1
      existing.total_spent += parseFloat(o.total || '0')
      // Update name/phone if previously empty
      if (!existing.name || existing.name === email) {
        existing.name = [billing.first_name, billing.last_name].filter(Boolean).join(' ') || existing.name
      }
      if (!existing.phone && billing.phone) {
        existing.phone = billing.phone
      }
      // Keep latest address
      existing.address = address
    }
  }

  console.log(`Extracted ${customerMap.size} unique customers`)

  // --- Insert customers ---
  let customersInserted = 0
  const emailToId = new Map<string, string>()

  for (const [email, customer] of customerMap) {
    const { data, error } = await supabase
      .from('customers')
      .upsert(customer, { onConflict: 'email' })
      .select('id')
      .single()

    if (error) {
      console.error(`  Error inserting customer "${email}": ${error.message}`)
    } else {
      customersInserted++
      emailToId.set(email, data.id)
    }
  }

  console.log(`Inserted/updated ${customersInserted}/${customerMap.size} customers`)

  // --- Insert orders ---
  let ordersInserted = 0

  for (const o of orders) {
    const email = (o.billing?.email || '').trim().toLowerCase()
    const customerId = emailToId.get(email) || null

    const items = (o.line_items || []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price || item.total || '0'),
    }))

    const subtotal = (o.line_items || []).reduce(
      (sum: number, item: any) => sum + parseFloat(item.subtotal || '0'),
      0
    )

    const record = {
      customer_id: customerId,
      status: mapOrderStatus(o.status),
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping_cost: parseFloat(o.shipping_total || '0'),
      total: parseFloat(o.total || '0'),
      notes: o.customer_note || null,
      created_at: o.date_created || new Date().toISOString(),
    }

    const { error } = await supabase.from('orders').insert(record)

    if (error) {
      console.error(`  Error inserting order #${o.id}: ${error.message}`)
    } else {
      ordersInserted++
    }
  }

  console.log(`Inserted ${ordersInserted}/${orders.length} orders`)
  return { customers: customersInserted, orders: ordersInserted }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(60))
  console.log('WooCommerce → Supabase Migration')
  console.log(`Source: ${WOO_URL}`)
  console.log(`Target: ${SUPABASE_URL}`)
  console.log('='.repeat(60))

  const startTime = Date.now()

  const productsCount = await migrateProducts()
  const { customers, orders } = await migrateCustomersAndOrders()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n' + '='.repeat(60))
  console.log('Migration Complete!')
  console.log(`  Products:  ${productsCount}`)
  console.log(`  Customers: ${customers}`)
  console.log(`  Orders:    ${orders}`)
  console.log(`  Duration:  ${elapsed}s`)
  console.log('='.repeat(60))
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
