import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fmczgjtpkviolvzicefr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtY3pnanRwa3Zpb2x2emljZWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMwMjAzMiwiZXhwIjoyMDg5ODc4MDMyfQ.Ct9tMXcjAwP6BRLfGFbz_xKLVAPjZdX7pqZ14cCI_hE'
)

// 1. Add RLS policies for staff to update orders + manage shipments
const rlsSQL = `
-- Staff can update orders (for shipping workflow)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'staff_update_orders' AND tablename = 'orders'
  ) THEN
    CREATE POLICY "staff_update_orders" ON orders FOR UPDATE
    USING (get_user_role() = 'staff')
    WITH CHECK (get_user_role() = 'staff');
  END IF;
END $$;

-- Staff can insert shipments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'staff_insert_shipments' AND tablename = 'shipments'
  ) THEN
    CREATE POLICY "staff_insert_shipments" ON shipments FOR INSERT
    WITH CHECK (get_user_role() = 'staff');
  END IF;
END $$;

-- Staff can update shipments  
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'staff_update_shipments' AND tablename = 'shipments'
  ) THEN
    CREATE POLICY "staff_update_shipments" ON shipments FOR UPDATE
    USING (get_user_role() = 'staff')
    WITH CHECK (get_user_role() = 'staff');
  END IF;
END $$;

-- Also add courier column migration (idempotent)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS econt_tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS econt_parcel_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS econt_label_url TEXT;

UPDATE orders SET courier = 'speedy'
WHERE courier IS NULL AND speedy_tracking_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_courier_idx ON orders(courier);
CREATE INDEX IF NOT EXISTS orders_status_courier_idx ON orders(status, courier);
`

// Run RLS + migration via rpc or pg_meta
// Since we can't run raw SQL via PostgREST, use pg_meta endpoint
const res = await fetch('https://fmczgjtpkviolvzicefr.supabase.co/pg/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtY3pnanRwa3Zpb2x2emljZWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMwMjAzMiwiZXhwIjoyMDg5ODc4MDMyfQ.Ct9tMXcjAwP6BRLfGFbz_xKLVAPjZdX7pqZ14cCI_hE',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtY3pnanRwa3Zpb2x2emljZWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMwMjAzMiwiZXhwIjoyMDg5ODc4MDMyfQ.Ct9tMXcjAwP6BRLfGFbz_xKLVAPjZdX7pqZ14cCI_hE'
  },
  body: JSON.stringify({ query: rlsSQL })
})

if (!res.ok) {
  console.log('pg/query failed, trying alternative...', res.status)
  // Try via SQL editor API
  const r2 = await fetch('https://fmczgjtpkviolvzicefr.supabase.co/rest/v1/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtY3pnanRwa3Zpb2x2emljZWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMwMjAzMiwiZXhwIjoyMDg5ODc4MDMyfQ.Ct9tMXcjAwP6BRLfGFbz_xKLVAPjZdX7pqZ14cCI_hE',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtY3pnanRwa3Zpb2x2emljZWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMwMjAzMiwiZXhwIjoyMDg5ODc4MDMyfQ.Ct9tMXcjAwP6BRLfGFbz_xKLVAPjZdX7pqZ14cCI_hE'
    }
  })
  console.log('Alt status:', r2.status)
} else {
  const data = await res.json()
  console.log('RLS + migration applied:', JSON.stringify(data).slice(0, 200))
}

// 2. Create fulfillment user
const email = 'fulfillment@bosy.bg'
const password = 'Bosy-Pack-2026!'

const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

if (authError) {
  if (authError.message.includes('already been registered')) {
    console.log('User already exists, skipping auth creation')
  } else {
    console.error('Auth error:', authError.message)
    process.exit(1)
  }
} else {
  console.log('Auth user created:', authData.user.id)
  
  const { error: dbError } = await supabase.from('users').insert({
    id: authData.user.id,
    name: 'Фулфилмент екип',
    email,
    role: 'staff',
  })
  
  if (dbError) {
    console.error('DB error:', dbError.message)
    await supabase.auth.admin.deleteUser(authData.user.id)
    process.exit(1)
  }
  console.log('User profile created with role: staff')
}

console.log('\n=== FULFILLMENT ACCESS ===')
console.log('Login URL: https://bosy.bg/login')
console.log('Email:', email)
console.log('Password:', password)
console.log('Role: staff (view orders, print packing slips, create shipments)')
console.log('\nDirect links:')
console.log('- Orders (ready to pack): https://bosy.bg/admin/orders?status=confirmed')
console.log('- All orders: https://bosy.bg/admin/orders')
console.log('- Speedy manifest (today): https://bosy.bg/api/admin/manifest/speedy')
console.log('- Packing slip example: https://bosy.bg/api/admin/packing-slip/{orderId}')
