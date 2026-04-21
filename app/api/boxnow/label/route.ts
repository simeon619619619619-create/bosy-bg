import { NextResponse } from 'next/server'
import { boxnowFetch } from '@/lib/boxnow/client'

// GET /api/boxnow/label?id=<deliveryRequestId>
// Proxies the label PDF so the admin can print it without exposing the token.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // BoxNow returns labels under /delivery-requests/{id}/shipping-labels.
    // Some partners get them via /parcels/{id}/label.pdf — try both.
    let res = await boxnowFetch(
      `/api/v1/delivery-requests/${encodeURIComponent(id)}/shipping-labels`
    )
    if (!res.ok) {
      res = await boxnowFetch(
        `/api/v1/parcels/${encodeURIComponent(id)}/label.pdf`
      )
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { error: `BoxNow label ${res.status}: ${text.slice(0, 200)}` },
        { status: 400 }
      )
    }

    const body = await res.arrayBuffer()
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="boxnow-${id}.pdf"`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('BoxNow label error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
