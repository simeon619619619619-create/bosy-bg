import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendShippingNotification } from '@/lib/resend/client'
import {
  boxnowJson,
  boxnowPartnerId,
  boxnowWarehouseId,
} from '@/lib/boxnow/client'

interface ShippingAddress {
  name?: string
  phone?: string
  email?: string | null
  delivery_type?: 'address' | 'office' | 'boxnow'
  boxnow_locker_id?: string | null
}

interface BoxNowDeliveryResponse {
  data?: {
    id?: string
    orderNumber?: string
    referenceNumber?: string
    parcels?: Array<{ id?: string; boxId?: string }>
  }
  id?: string
  orderNumber?: string
  referenceNumber?: string
  parcels?: Array<{ id?: string; boxId?: string }>
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

function toE164BG(phone: string): string {
  const d = digitsOnly(phone)
  if (d.startsWith('359')) return `+${d}`
  if (d.startsWith('0')) return `+359${d.slice(1)}`
  return `+359${d}`
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
      .select('*, customers(name, email, phone)')
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
    } | null

    const shipAddr = (order.shipping_address as ShippingAddress | null) ?? {}

    const recipientName = shipAddr.name || customer?.name || ''
    const recipientPhoneRaw = shipAddr.phone || customer?.phone || ''
    const recipientEmail = shipAddr.email || customer?.email || null

    if (!recipientName || !recipientPhoneRaw) {
      return NextResponse.json(
        { error: 'Липсват име или телефон на получателя' },
        { status: 400 }
      )
    }

    const notes = (order.notes as string) ?? ''
    const isCod = notes.includes('[COD]')
    const boxnowMatch = notes.match(/\[BOXNOW:([^\]]+)\]/)

    const lockerId =
      shipAddr.boxnow_locker_id ?? (boxnowMatch ? boxnowMatch[1] : null)

    if (!lockerId) {
      return NextResponse.json(
        {
          error:
            'Липсва избран BoxNow автомат. Редактирай адреса и избери локер.',
        },
        { status: 400 }
      )
    }

    const partnerId = boxnowPartnerId()
    const warehouseId = boxnowWarehouseId()

    const items = Array.isArray(order.items) ? order.items : []
    const contents =
      items.map((i: { name: string }) => i.name).join(', ').slice(0, 100) ||
      'Стоки'

    const declaredValue = Number(order.total ?? 0)
    const codAmount = isCod ? declaredValue : 0

    // Partner API delivery request. Keeping the field set conservative —
    // BoxNow ignores unknown keys but requires partnerId, senderName,
    // addressLine1 on sender (warehouse fallback), recipientName/phone,
    // destination deliveryBoxId.
    const payload = {
      partnerId,
      orderNumber: String(order.order_number ?? order.id),
      parcelValue: declaredValue * 100, // cents
      parcelWeight: 1000, // grams — override later if we track real weight
      compartmentSize: 1, // 1=small, 2=medium, 3=large
      items: [
        {
          description: contents,
          quantity: 1,
        },
      ],
      ...(codAmount > 0 && {
        codAmount: Math.round(codAmount * 100),
        codCurrency: 'BGN',
      }),
      sender: {
        warehouseId: Number(warehouseId),
        name: process.env.BOXNOW_SENDER_NAME ?? 'BOSY',
        phone: toE164BG(process.env.BOXNOW_SENDER_PHONE ?? '0888000000'),
        ...(process.env.BOXNOW_SENDER_EMAIL && {
          email: process.env.BOXNOW_SENDER_EMAIL,
        }),
      },
      recipient: {
        name: recipientName,
        phone: toE164BG(recipientPhoneRaw),
        ...(recipientEmail && { email: recipientEmail }),
      },
      deliveryBoxId: lockerId,
    }

    const resp = await boxnowJson<BoxNowDeliveryResponse>(
      '/api/v1/delivery-requests',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )

    const payloadData = resp.data ?? resp
    const trackingNumber =
      payloadData.parcels?.[0]?.id ||
      payloadData.parcels?.[0]?.boxId ||
      payloadData.id ||
      payloadData.orderNumber ||
      payloadData.referenceNumber ||
      null

    if (!trackingNumber) {
      console.error('BoxNow no tracking in response:', resp)
      return NextResponse.json(
        { error: 'BoxNow не върна tracking номер' },
        { status: 400 }
      )
    }

    const labelUrl = `/api/boxnow/label?id=${encodeURIComponent(String(trackingNumber))}`

    await supabase.from('shipments').insert({
      order_id: orderId,
      parcel_id: String(trackingNumber),
      tracking_number: String(trackingNumber),
      status: 'shipped',
      status_history: [
        {
          status: 'shipped',
          timestamp: new Date().toISOString(),
          description: 'Пратка създадена в BoxNow',
        },
      ],
    })

    await supabase
      .from('orders')
      .update({
        status: 'shipped',
        courier: 'boxnow',
        boxnow_tracking_number: String(trackingNumber),
        boxnow_parcel_id: String(trackingNumber),
        boxnow_label_url: labelUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

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

    return NextResponse.json({
      trackingNumber: String(trackingNumber),
      parcelId: String(trackingNumber),
      labelUrl,
    })
  } catch (error) {
    console.error('BoxNow create-parcel error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
