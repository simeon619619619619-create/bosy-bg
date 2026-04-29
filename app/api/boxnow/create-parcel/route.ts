import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { sendShippingNotification } from '@/lib/resend/client'
import { boxnowJson } from '@/lib/boxnow/client'
import { assertOrderShippable, UnpaidCardOrderError } from '@/lib/orders/payment-guard'
import { assertCodPayloadIntegrity } from '@/lib/shipping/cod-invariants'

interface ShippingAddress {
  name?: string
  phone?: string
  email?: string | null
  delivery_type?: 'address' | 'office' | 'boxnow'
  boxnow_locker_id?: string | null
}

interface BoxNowDeliveryResponse {
  id?: string
  orderNumber?: string
  referenceNumber?: string
  parcels?: Array<{ id?: string }>
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

    const items = Array.isArray(order.items) ? order.items : []
    const contents =
      items
        .map((i: { name: string; quantity?: number }) => {
          const qty = Number(i.quantity ?? 1)
          return qty > 1 ? `${qty}x ${i.name}` : i.name
        })
        .join(', ')
        .slice(0, 100) || 'Стоки'

    const declaredValue = Number(order.total ?? 0).toFixed(2)
    const codAmount = isCod ? Number(order.total ?? 0).toFixed(2) : '0'

    // BoxNow Partner API schema (verified live 2026-04-21): numeric monetary
    // fields go as STRINGS; locationId is a string; origin/destination share
    // the same anyOf schema (either `locationId` for APM or a full address).
    const totalQty = items.reduce(
      (sum: number, i: { quantity?: number }) => sum + (i.quantity ?? 1),
      0
    )

    const payload = {
      orderNumber: String(order.order_number ?? order.id),
      paymentMode: isCod ? 'cod' : 'prepaid',
      amountToBeCollected: codAmount,
      invoiceValue: declaredValue,
      allowReturn: true,
      comment: contents,
      itemsCount: totalQty,
      items: items.map((i: { name: string; quantity?: number; price?: number }) => ({
        description: i.name,
        quantity: i.quantity ?? 1,
        value: String(Number(i.price ?? 0).toFixed(2)),
      })),
      origin: {
        addressLine1: process.env.BOXNOW_SENDER_ADDRESS ?? 'ул. Тест 1',
        addressLine2: process.env.BOXNOW_SENDER_CITY ?? 'София',
        postalCode: process.env.BOXNOW_SENDER_POSTCODE ?? '1000',
        country: 'BG',
        contactName: process.env.BOXNOW_SENDER_NAME ?? 'BOSY',
        contactNumber: toE164BG(process.env.BOXNOW_SENDER_PHONE ?? '0888000000'),
        ...(process.env.BOXNOW_SENDER_EMAIL && {
          contactEmail: process.env.BOXNOW_SENDER_EMAIL,
        }),
      },
      destination: {
        locationId: String(lockerId),
        contactName: recipientName,
        contactNumber: toE164BG(recipientPhoneRaw),
        contactEmail: recipientEmail ?? 'noreply@bosy.bg',
      },
    }

    // Pre-flight COD integrity check
    assertCodPayloadIntegrity(payload, {
      courier: 'boxnow',
      isCod,
      total: Number(order.total ?? 0),
    })

    const resp = await boxnowJson<BoxNowDeliveryResponse>(
      '/api/v1/delivery-requests',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )

    // Response shape (verified live): { id, parcels: [{ id }] }. `id` is the
    // delivery-request reference; `parcels[0].id` is what we track and what
    // the /parcels/{id}/label.pdf endpoint expects.
    const trackingNumber =
      resp.parcels?.[0]?.id ??
      resp.id ??
      resp.orderNumber ??
      resp.referenceNumber ??
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
