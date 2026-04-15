import { NextResponse } from 'next/server'
import { econtPost } from '@/lib/econt/client'

interface EcontTrackStatus {
  trackingEvents?: Array<{
    time?: string
    officeName?: string
    destinationType?: string
    destinationDetails?: string
  }>
  status?: string
  deliveryDate?: string
  shipmentNumber?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('trackingNumber')
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'trackingNumber is required' },
        { status: 400 }
      )
    }

    const resp = await econtPost<{ shipmentStatuses: EcontTrackStatus[] }>(
      '/Shipments/ShipmentService.getShipmentStatuses.json',
      { shipmentNumbers: [trackingNumber] }
    )

    const status = resp.shipmentStatuses?.[0] ?? null
    return NextResponse.json({ status })
  } catch (error) {
    console.error('Econt track error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
