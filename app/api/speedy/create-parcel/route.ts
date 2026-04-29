import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendShippingNotification } from '@/lib/resend/client'
import { assertOrderShippable, UnpaidCardOrderError } from '@/lib/orders/payment-guard'
import { assertCodPayloadIntegrity } from '@/lib/shipping/cod-invariants'

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

interface ShippingAddress {
  name?: string
  phone?: string
  email?: string | null
  street?: string
  city?: string
  zip?: string
  delivery_type?: 'address' | 'office' | 'boxnow'
  speedy_office_id?: number | null
  boxnow_locker_id?: string | null
}

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

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

    try {
      await assertOrderShippable(supabase, orderId, 'shipped')
    } catch (e) {
      if (e instanceof UnpaidCardOrderError) {
        return NextResponse.json({ error: e.message }, { status: 402 })
      }
      throw e
    }

    const customer = order.customers as {
      name: string
      email: string | null
      phone: string | null
      address: CustomerAddress | string | null
    } | null

    // Admin-edited shipping address (overrides customer fields when present)
    const shipAddr = (order.shipping_address as ShippingAddress | null) ?? {}

    const recipientName = shipAddr.name || customer?.name || ''
    const recipientPhone = shipAddr.phone || customer?.phone || ''
    const recipientEmail = shipAddr.email || customer?.email || null

    if (!recipientPhone) {
      return NextResponse.json(
        { error: 'Customer phone is required for shipping' },
        { status: 400 }
      )
    }

    const notes = (order.notes as string) ?? ''
    const isCod = notes.includes('[COD]')
    const officeMatch = notes.match(/\[OFFICE:(\d+)\]/)

    // Delivery type: prefer shipping_address, fallback to notes tag
    const deliveryType =
      shipAddr.delivery_type ?? (officeMatch ? 'office' : 'address')
    const pickupOfficeId =
      shipAddr.speedy_office_id ?? (officeMatch ? Number(officeMatch[1]) : null)

    // Build recipient block based on delivery type
    let recipientLocation: Record<string, unknown>

    if (deliveryType === 'office') {
      if (!pickupOfficeId) {
        return NextResponse.json(
          { error: 'Липсва ID на офис Speedy за доставка до офис' },
          { status: 400 }
        )
      }
      recipientLocation = { pickupOfficeId }
    } else {
      // Address fields: prefer order.shipping_address. customer.address е legacy
      // free-text поле и често няма city/street keys → не го ползваме за
      // Speedy validation (иначе потребителят получава "Адресът е непълен"
      // дори след като е попълнил и запазил адреса).
      const addr: CustomerAddress = {
        street: shipAddr.street?.trim(),
        city: shipAddr.city?.trim(),
        zip: shipAddr.zip?.trim(),
      }

      if (!addr.city || !addr.street) {
        return NextResponse.json(
          {
            error:
              'Липсва град или улица в адреса за доставка. Отвори "Редактирай" и запази адреса преди изпращане.',
          },
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

    // Build contents description from items.
    // Format: "2x Iron Maiden, 1x Барбел" — slice(0,100) defends срещу Speedy
    // limit на полето; quantity prefix дава на admin/получател видим брой.
    const items = Array.isArray(order.items) ? order.items : []
    const contents =
      items
        .map((i: { name: string; quantity?: number }) => {
          const qty = Number(i.quantity ?? 1)
          return qty > 1 ? `${qty}x ${i.name}` : i.name
        })
        .join(', ')
        .slice(0, 100) || 'Стоки'

    // Build Speedy shipment payload
    const totalAmount = Number(order.total ?? 0)
    const payload: Record<string, unknown> = {
      userName: process.env.SPEEDY_USERNAME,
      password: process.env.SPEEDY_PASSWORD,
      language: 'BG',
      service: {
        serviceId: 505,
        autoAdjustPickupDate: true,
        additionalServices: {
          ...(isCod && {
            cod: {
              amount: totalAmount,
              processingType: 'CASH',
            },
          }),
          declaredValue: {
            amount: totalAmount,
            fragile: false,
            ignoreIfRepeated: true,
          },
        },
      },
      content: {
        parcelsCount: 1,
        totalWeight: 1,
        contents,
        package: 'BOX',
      },
      payment: {
        courierServicePayer: 'RECIPIENT',
      },
      sender: {
        phone1: { number: process.env.SPEEDY_SENDER_PHONE ?? '0888000000' },
        contactName: process.env.SPEEDY_SENDER_NAME ?? 'BOSY',
        ...(process.env.SPEEDY_SENDER_EMAIL && {
          email: process.env.SPEEDY_SENDER_EMAIL,
        }),
      },
      recipient: {
        phone1: { number: recipientPhone },
        clientName: recipientName,
        ...(recipientEmail && { email: recipientEmail }),
        privatePerson: true,
        ...recipientLocation,
      },
      ref1: String(order.order_number ?? order.id),
    }

    // Pre-flight COD integrity check — fail closed ако сумата е дублирана
    // или различна от order.total (защита срещу bug-а от 28.04 #67).
    assertCodPayloadIntegrity(payload, {
      courier: 'speedy',
      isCod,
      total: totalAmount,
    })

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
