import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSpeedyClient } from '@/lib/speedy/client'
import { sendShippingNotification } from '@/lib/resend/client'

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customers(name, email, phone, address)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Order must be confirmed before shipping' },
        { status: 400 }
      )
    }

    const customer = order.customers as {
      name: string
      email: string | null
      phone: string | null
      address: string | null
    } | null

    if (!customer?.phone) {
      return NextResponse.json(
        { error: 'Customer phone is required for shipping' },
        { status: 400 }
      )
    }

    const speedy = getSpeedyClient()

    const items = Array.isArray(order.items) ? order.items : []
    const contents = items
      .map((i: { name: string }) => i.name)
      .join(', ')
      .slice(0, 100)

    const shipment = await speedy.createShipment({
      service: {
        serviceId: 505, // Speedy standard
        autoAdjustPickupDate: true,
      },
      content: {
        parcelsCount: 1,
        totalWeight: 1,
        contents: contents || 'Стоки',
        package: 'BOX',
      },
      payment: {
        courierServicePayer: 'SENDER',
        declaredValueAmount: Number(order.total ?? 0),
        declaredValueCurrency: 'BGN',
      },
      sender: {
        phone1: { number: process.env.SPEEDY_SENDER_PHONE ?? '' },
        contactName: process.env.SPEEDY_SENDER_NAME ?? 'BOSY',
        email: process.env.SPEEDY_SENDER_EMAIL,
      },
      recipient: {
        phone1: { number: customer.phone },
        clientName: customer.name,
        email: customer.email ?? undefined,
        privatePerson: true,
      },
      ref1: order.order_number ?? order.id,
    })

    const parcelId = shipment.parcels?.[0]?.id ?? shipment.id
    const trackingNumber =
      shipment.parcels?.[0]?.externalCarrierParcelNumber ?? parcelId

    // Create shipment record
    await supabase.from('shipments').insert({
      order_id: orderId,
      parcel_id: parcelId,
      tracking_number: trackingNumber,
      status: 'shipped',
      status_history: [
        {
          status: 'shipped',
          timestamp: new Date().toISOString(),
          description: 'Пратка създадена в Speedy',
        },
      ],
    })

    // Update order
    await supabase
      .from('orders')
      .update({
        status: 'shipped',
        speedy_tracking_number: trackingNumber,
        speedy_parcel_id: parcelId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // Send shipping notification email
    if (customer?.email) {
      try {
        await sendShippingNotification(
          customer.email,
          order.order_number ?? 0,
          String(trackingNumber)
        )
      } catch (e) {
        console.error('Failed to send shipping notification:', e)
      }
    }

    return NextResponse.json({ trackingNumber, parcelId })
  } catch (error) {
    console.error('Create parcel error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
