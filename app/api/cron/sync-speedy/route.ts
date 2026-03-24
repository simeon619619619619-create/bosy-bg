import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSpeedyClient } from '@/lib/speedy/client'
import { sendDeliveryConfirmation } from '@/lib/resend/client'

export async function GET(request: Request) {
  // Verify cron secret
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

    const speedy = getSpeedyClient()

    // Fetch all non-delivered shipments
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('*')
      .neq('status', 'delivered')

    if (error) {
      throw new Error(error.message)
    }

    if (!shipments || shipments.length === 0) {
      return NextResponse.json({ message: 'No shipments to sync', updated: 0 })
    }

    let updatedCount = 0

    for (const shipment of shipments) {
      try {
        const trackingResult = await speedy.getShipmentStatus(shipment.parcel_id)
        const parcelData = trackingResult.parcels?.[0]

        if (!parcelData) continue

        const operations = parcelData.operations ?? []
        const lastOperation = operations[operations.length - 1]

        // Determine if delivered based on operations
        const isDelivered = operations.some(
          (op) =>
            op.operationDescription?.toLowerCase().includes('доставена') ||
            op.operationDescription?.toLowerCase().includes('delivered')
        )

        const newStatus = isDelivered ? 'delivered' : shipment.status

        // Append to status history
        const history = Array.isArray(shipment.status_history)
          ? shipment.status_history
          : []

        if (lastOperation) {
          const alreadyLogged = history.some(
            (h: { timestamp: string; description?: string }) =>
              h.timestamp === lastOperation.dateTime &&
              h.description === lastOperation.operationDescription
          )

          if (!alreadyLogged) {
            history.push({
              status: newStatus,
              timestamp: lastOperation.dateTime,
              description: lastOperation.operationDescription,
            })
          }
        }

        // Update shipment
        await supabase
          .from('shipments')
          .update({
            status: newStatus,
            status_history: history,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shipment.id)

        // If delivered, update order and send notification
        if (isDelivered && newStatus !== shipment.status) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('order_number, customers(email)')
            .eq('id', shipment.order_id)
            .single()

          await supabase
            .from('orders')
            .update({
              status: 'delivered',
              updated_at: new Date().toISOString(),
            })
            .eq('id', shipment.order_id)

          // Send delivery confirmation email
          const customerEmail = (orderData?.customers as unknown as { email: string | null } | null)?.email
          if (customerEmail && orderData?.order_number) {
            try {
              await sendDeliveryConfirmation(customerEmail, orderData.order_number)
            } catch (e) {
              console.error('Failed to send delivery confirmation:', e)
            }
          }
        }

        updatedCount++
      } catch (err) {
        console.error(`Error syncing shipment ${shipment.id}:`, err)
      }
    }

    return NextResponse.json({
      message: 'Sync complete',
      total: shipments.length,
      updated: updatedCount,
    })
  } catch (error) {
    console.error('Sync speedy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
