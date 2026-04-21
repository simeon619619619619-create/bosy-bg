import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendShippingNotification } from '@/lib/resend/client'
import { econtPost, type EcontCity } from '@/lib/econt/client'

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
  econt_office_id?: number | null
  boxnow_locker_id?: string | null
}

interface EcontLabelResponse {
  label?: {
    shipmentNumber?: string
    pdfURL?: string
  }
  shipmentNumber?: string
}

async function findCityId(cityName: string): Promise<number | null> {
  try {
    const resp = await econtPost<{ cities: EcontCity[] }>(
      '/Nomenclatures/NomenclaturesService.getCities.json',
      { countryCode: 'BGR' }
    )
    const needle = cityName.toLowerCase()
    const match =
      resp.cities.find((c) => c.name?.toLowerCase() === needle) ||
      resp.cities.find((c) => c.name?.toLowerCase().startsWith(needle))
    return match?.id ?? null
  } catch {
    return null
  }
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
        { error: 'Поръчката трябва да е потвърдена преди изпращане' },
        { status: 400 }
      )
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
        { error: 'Липсва телефон на клиента' },
        { status: 400 }
      )
    }

    const notes = (order.notes as string) ?? ''
    const isCod = notes.includes('[COD]')
    const econtOfficeMatch = notes.match(/\[ECONT_OFFICE:(\d+)\]/)

    // Delivery type: prefer shipping_address, fallback to notes tag
    const deliveryType =
      shipAddr.delivery_type ?? (econtOfficeMatch ? 'office' : 'address')
    const officeId =
      shipAddr.econt_office_id ??
      (econtOfficeMatch ? Number(econtOfficeMatch[1]) : null)

    // Build receiver block
    let receiverAddress: Record<string, unknown>

    if (deliveryType === 'office') {
      if (!officeId) {
        return NextResponse.json(
          { error: 'Липсва ID на офис Еконт за доставка до офис' },
          { status: 400 }
        )
      }
      receiverAddress = { id: officeId }
    } else {
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
      const cityId = await findCityId(addr.city)
      if (!cityId) {
        return NextResponse.json(
          { error: `Не е намерен град "${addr.city}" в Еконт системата` },
          { status: 400 }
        )
      }
      receiverAddress = {
        city: { id: cityId },
        street: addr.street,
      }
    }

    const items = Array.isArray(order.items) ? order.items : []
    const contents =
      items.map((i: { name: string }) => i.name).join(', ').slice(0, 100) ||
      'Стоки'

    const senderOfficeCode = process.env.ECONT_SENDER_OFFICE_CODE
    const senderAddressPayload: Record<string, unknown> = senderOfficeCode
      ? { office: { code: senderOfficeCode } }
      : {}

    const payload: Record<string, unknown> = {
      label: {
        senderClient: {
          name: process.env.ECONT_SENDER_NAME ?? 'BOSY',
          phones: [process.env.ECONT_SENDER_PHONE ?? '0888000000'],
          ...(process.env.ECONT_SENDER_EMAIL && {
            email: process.env.ECONT_SENDER_EMAIL,
          }),
        },
        senderAddress: senderAddressPayload,
        receiverClient: {
          name: recipientName,
          phones: [recipientPhone],
          ...(recipientEmail && { email: recipientEmail }),
        },
        receiverAddress,
        shipmentType: 'PACK',
        packCount: 1,
        weight: 1,
        shipmentDescription: contents,
        services: {
          ...(isCod && {
            cdAmount: Number(order.total ?? 0),
            cdCurrency: 'BGN',
            cdPayOptionsTemplate: 'ON_DELIVERY',
          }),
          declaredValueAmount: Number(order.total ?? 0),
          declaredValueCurrency: 'BGN',
        },
        payAfterAccept: false,
        payAfterTest: false,
      },
      mode: 'create',
    }

    const resp = await econtPost<EcontLabelResponse>(
      '/Shipments/ShipmentService.createLabel.json',
      payload
    )

    const shipmentNumber =
      resp.label?.shipmentNumber || resp.shipmentNumber || null
    const labelUrl = resp.label?.pdfURL || null

    if (!shipmentNumber) {
      console.error('Econt createLabel no shipmentNumber:', resp)
      return NextResponse.json(
        { error: 'Еконт не върна shipmentNumber' },
        { status: 400 }
      )
    }

    // Create shipment record
    await supabase.from('shipments').insert({
      order_id: orderId,
      parcel_id: shipmentNumber,
      tracking_number: shipmentNumber,
      status: 'shipped',
      status_history: [
        {
          status: 'shipped',
          timestamp: new Date().toISOString(),
          description: 'Пратка създадена в Еконт',
        },
      ],
    })

    await supabase
      .from('orders')
      .update({
        status: 'shipped',
        courier: 'econt',
        econt_tracking_number: shipmentNumber,
        econt_parcel_id: shipmentNumber,
        econt_label_url: labelUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (customer?.email) {
      try {
        await sendShippingNotification(
          customer.email,
          order.order_number ?? 0,
          shipmentNumber
        )
      } catch (e) {
        console.error('Failed to send shipping notification:', e)
      }
    }

    return NextResponse.json({
      trackingNumber: shipmentNumber,
      parcelId: shipmentNumber,
      labelUrl,
    })
  } catch (error) {
    console.error('Econt create-label error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
