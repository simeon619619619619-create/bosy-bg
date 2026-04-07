import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendShippingNotification } from '@/lib/resend/client'

const SPEEDY_BASE = 'https://api.speedy.bg/v1'

// Look up Speedy siteId for a city name
async function findSiteId(city: string): Promise<number | null> {
  const res = await fetch(`${SPEEDY_BASE}/location/site`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: process.env.SPEEDY_USERNAME,
      password: process.env.SPEEDY_PASSWORD,
      language: 'BG',
      countryId: 100,
      name: city.toUpperCase(),
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const exact = (data.sites || []).find(
    (s: { name: string }) => s.name === city.toUpperCase()
  )
  return exact?.id ?? data.sites?.[0]?.id ?? null
}

interface CustomerAddress {
  city?: string
  street?: string
  zip?: string
}

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
      address: CustomerAddress | string | null
    } | null

    if (!customer?.phone) {
      return NextResponse.json(
        { error: 'Customer phone is required for shipping' },
        { status: 400 }
      )
    }

    // Determine delivery type from notes ([OFFICE:X] tag)
    const notes = (order.notes as string) ?? ''
    const isCod = notes.includes('[COD]')
    const officeMatch = notes.match(/\[OFFICE:(\d+)\]/)
    const deliveryToOffice = !!officeMatch
    const pickupOfficeId = officeMatch ? Number(officeMatch[1]) : null

    // Build recipient block based on delivery type
    let recipientLocation: Record<string, unknown>

    if (deliveryToOffice && pickupOfficeId) {
      // Delivery to Speedy office — only need pickupOfficeId
      recipientLocation = { pickupOfficeId }
    } else {
      // Delivery to address — need full street info
      let addr: CustomerAddress = {}
      if (typeof customer.address === 'object' && customer.address !== null) {
        addr = customer.address
      } else if (typeof customer.address === 'string') {
        const parts = customer.address.split(',').map((s) => s.trim())
        addr = { zip: parts[0], city: parts[1], street: parts[2] }
      }

      if (!addr.city || !addr.street) {
        return NextResponse.json(
          { error: 'Адресът на клиента е непълен (липсва град или улица)' },
          { status: 400 }
        )
      }

      const siteId = await findSiteId(addr.city)
      if (!siteId) {
        return NextResponse.json(
          { error: `Не е намерен град "${addr.city}" в Speedy системата` },
          { status: 400 }
        )
      }

      const streetMatch = addr.street.match(/^(.+?)\s+(\S+)$/)
      const streetName = streetMatch?.[1] ?? addr.street
      const streetNo = streetMatch?.[2] ?? '1'

      recipientLocation = {
        address: { siteId, streetName, streetNo },
      }
    }

    // Build contents description from items
    const items = Array.isArray(order.items) ? order.items : []
    const contents =
      items
        .map((i: { name: string }) => i.name)
        .join(', ')
        .slice(0, 100) || 'Стоки'

    // Build Speedy shipment payload
    const payload: Record<string, unknown> = {
      userName: process.env.SPEEDY_USERNAME,
      password: process.env.SPEEDY_PASSWORD,
      language: 'BG',
      service: { serviceId: 505, autoAdjustPickupDate: true },
      content: {
        parcelsCount: 1,
        totalWeight: 1,
        contents,
        package: 'BOX',
      },
      payment: {
        courierServicePayer: 'RECIPIENT',
        ...(isCod && {
          cod: {
            amount: Number(order.total ?? 0),
            processingType: 'CASH',
          },
        }),
        declaredValueAmount: Number(order.total ?? 0),
        declaredValueCurrency: 'BGN',
      },
      sender: {
        phone1: { number: process.env.SPEEDY_SENDER_PHONE ?? '0888000000' },
        contactName: process.env.SPEEDY_SENDER_NAME ?? 'BOSY',
        ...(process.env.SPEEDY_SENDER_EMAIL && {
          email: process.env.SPEEDY_SENDER_EMAIL,
        }),
      },
      recipient: {
        phone1: { number: customer.phone },
        clientName: customer.name,
        ...(customer.email && { email: customer.email }),
        privatePerson: true,
        ...recipientLocation,
      },
      ref1: String(order.order_number ?? order.id),
    }

    // Call Speedy API
    const speedyRes = await fetch(`${SPEEDY_BASE}/shipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const shipmentData = await speedyRes.json()

    // Validate response — Speedy returns errors with HTTP 200 sometimes
    if (shipmentData.error || !shipmentData.id) {
      const errMsg = shipmentData.error?.message || 'Speedy API върна непълен отговор'
      console.error('Speedy createShipment failed:', shipmentData)
      return NextResponse.json({ error: errMsg }, { status: 400 })
    }

    const parcelId: string = shipmentData.id
    const trackingNumber: string = shipmentData.parcels?.[0]?.id ?? parcelId

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
