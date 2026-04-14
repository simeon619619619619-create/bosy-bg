import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Runs daily; self-heals DETOX TRIO price on/after May 1, 2026.
// After the bundle is restored, the cron becomes a no-op.
const EASTER_END = new Date('2026-04-30T23:59:59+03:00')
const BUNDLE_SLUG = 'detox-trio-bundle'
const RESTORED_PRICE_BGN_CENTS = 9329 // 93.29 BGN

export async function GET(request: Request) {
  if (
    request.headers.get('authorization') !==
    'Bearer ' + process.env.CRON_SECRET
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (Date.now() < EASTER_END.getTime()) {
    return NextResponse.json({ status: 'easter-active', action: 'noop' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: bundle, error: fetchError } = await supabase
    .from('products')
    .select('id, price, compare_price, is_active')
    .eq('slug', BUNDLE_SLUG)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!bundle) {
    return NextResponse.json({ status: 'bundle-not-found' })
  }

  const alreadyRestored =
    bundle.price >= RESTORED_PRICE_BGN_CENTS && bundle.compare_price == null

  if (alreadyRestored) {
    return NextResponse.json({ status: 'already-restored' })
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({
      price: RESTORED_PRICE_BGN_CENTS,
      compare_price: null,
    })
    .eq('id', bundle.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    status: 'restored',
    bundle_id: bundle.id,
    previous_price: bundle.price,
    previous_compare_price: bundle.compare_price,
    new_price: RESTORED_PRICE_BGN_CENTS,
  })
}
