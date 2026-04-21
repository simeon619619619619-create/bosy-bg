import { NextResponse } from 'next/server'
import { boxnowJson, type BoxNowLocker } from '@/lib/boxnow/client'

interface RawDestination {
  id?: string | number
  name?: string
  title?: string
  addressLine1?: string
  addressLine2?: string
  postalCode?: string
  country?: string
  region?: string
  lat?: string | number
  lng?: string | number
  type?: string
  note?: string
}

function normalizeLocker(r: RawDestination): BoxNowLocker {
  const id = String(r.id ?? '')
  return {
    id,
    name: r.name ?? r.title ?? `BoxNow ${id}`,
    addressLine1: r.addressLine1 ?? '',
    postalCode: r.postalCode ?? '',
    city: r.addressLine2 ?? '',
    lat: r.lat ? Number(r.lat) : undefined,
    lng: r.lng ? Number(r.lng) : undefined,
  }
}

// GET /api/boxnow/lockers?city=софия  or  ?q=младост
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cityQuery = (searchParams.get('city') ?? '').trim().toLowerCase()
    const freeQuery = (searchParams.get('q') ?? '').trim().toLowerCase()

    // BoxNow's destinations endpoint returns ~400 APMs for BG.
    const data = await boxnowJson<
      { data?: RawDestination[] } | RawDestination[]
    >('/api/v1/destinations?limit=2000')

    const raw: RawDestination[] = Array.isArray(data)
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
