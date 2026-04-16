import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendShippingNotification } from '@/lib/resend/client'
import { econtPost, type EcontCity } from '@/lib/econt/client'

interface CustomerAddress {
  city?: string
  street?: string
  zip?: string
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

    if (!customer?.phone) {
      return NextResponse.json(
        { error: 'Липсва телефон на клиента' },
        { status: 400 }
      )
    }

    const notes = (order.notes as string) ?? ''
    const isCod = notes.includes('[COD]')
    const econtOfficeMatch = notes.match(/\[ECONT_OFFICE:(\d+)\]/)
    const officeId = econtOfficeMatch ? Number(econtOfficeMatch[1]) : null

    // Parse customer address
    let addr: CustomerAddress = {}
    if (typeof customer.address === 'object' && customer.address !== null) {
      addr = customer.address
    } else if (typeof customer.address === 'string') {
      const parts = customer.address.split(',').map((s) => s.trim())
      addr = { zip: parts[0], city: parts[1], street: parts[2] }
    }

    // Build receiver block
    let receiverAddress: Record<string, unknown>

    if (officeId) {
      // To office
      receiverAddress = { id: officeId }
    } else {
      if (!addr.city || !addr.street) {
        return NextResponse.json(
          { error: 'Адресът на клиента е непълен' },
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
          name: customer.name,
          phones: [customer.phone],
          ...(customer.email && { email: customer.email }),
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
