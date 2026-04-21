import { NextResponse } from 'next/server'
import { boxnowJson, type BoxNowLocker } from '@/lib/boxnow/client'

interface RawLocker {
  id?: string | number
  boxId?: string | number
  name?: string
  addressLine1?: string
  address?: string
  postalCode?: string
  zip?: string
  city?: string
  town?: string
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
  status?: string
  type?: string
}

function normalizeLocker(r: RawLocker): BoxNowLocker {
  const id = String(r.id ?? r.boxId ?? '')
  return {
    id,
    name: r.name ?? `BoxNow ${id}`,
    addressLine1: r.addressLine1 ?? r.address ?? '',
    postalCode: r.postalCode ?? r.zip ?? '',
    city: r.city ?? r.town ?? '',
    lat: r.lat ?? r.latitude,
    lng: r.lng ?? r.longitude,
  }
}

// GET /api/boxnow/lockers?city=софия  or  ?q=младост
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cityQuery = (searchParams.get('city') ?? '').trim().toLowerCase()
    const freeQuery = (searchParams.get('q') ?? '').trim().toLowerCase()

    // BoxNow returns ~400 lockers total — fetch all, filter server-side.
    const data = await boxnowJson<
      { data?: RawLocker[] } | RawLocker[]
    >('/api/v1/lockers?limit=2000')

    const raw: RawLocker[] = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
        ? data.data
        : []

    let lockers = raw.map(normalizeLocker).filter((l) => l.id)

    if (cityQuery) {
      lockers = lockers.filter(
        (l) =>
          (l.city ?? '').toLowerCase().includes(cityQuery) ||
          l.addressLine1.toLowerCase().includes(cityQuery) ||
          l.postalCode.startsWith(cityQuery)
      )
    }
    if (freeQuery) {
      lockers = lockers.filter(
        (l) =>
          l.name.toLowerCase().includes(freeQuery) ||
          l.addressLine1.toLowerCase().includes(freeQuery) ||
          (l.city ?? '').toLowerCase().includes(freeQuery)
      )
    }

    return NextResponse.json({ lockers: lockers.slice(0, 200) })
  } catch (error) {
    console.error('BoxNow lockers API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
