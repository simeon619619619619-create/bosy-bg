import { NextResponse } from 'next/server'

const SPEEDY_BASE = 'https://api.speedy.bg/v1'
const DEFAULT_CITY = 'СОФИЯ'

interface SpeedySite {
  id: number
  name: string
  postCode?: string
  type?: string
}

interface SpeedyOffice {
  id: number
  name: string
  nameEn?: string
  address?: {
    fullAddressString?: string
    localAddressString?: string
  }
  workingTimeFrom?: string
  workingTimeTo?: string
  type?: string
  siteId?: number
}

async function searchSites(
  userName: string,
  password: string,
  name: string
): Promise<SpeedySite[]> {
  const res = await fetch(`${SPEEDY_BASE}/location/site`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName,
      password,
      language: 'BG',
      countryId: 100,
      name: name.toUpperCase(),
    }),
  })
  const data = await res.json()
  if (data.error) return []
  return (data.sites || []) as SpeedySite[]
}

async function fetchOffices(
  userName: string,
  password: string,
  siteId: number
): Promise<SpeedyOffice[]> {
  const res = await fetch(`${SPEEDY_BASE}/location/office`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName,
      password,
      language: 'BG',
      countryId: 100,
      siteId,
    }),
  })
  const data = await res.json()
  if (data.error) return []
  return (data.offices || []) as SpeedyOffice[]
}

// GET /api/speedy/offices?city=софия младост
// Returns: { sites: [...], offices: [...] }
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('city') ?? ''
    const trimmed = rawQuery.trim()

    if (trimmed.length < 2) {
      return NextResponse.json({ sites: [], offices: [] })
    }

    const userName = process.env.SPEEDY_USERNAME
    const password = process.env.SPEEDY_PASSWORD

    if (!userName || !password) {
      return NextResponse.json(
        { error: 'Speedy credentials not configured' },
        { status: 500 }
      )
    }

    // Split into city + optional filter text
    // e.g. "софия младост" → cityName="софия", filterText="младост"
    const parts = trimmed.split(/\s+/)
    let cityName = parts[0]
    let filterText = parts.slice(1).join(' ').toLowerCase()

    // Try to find sites for the first word
    let sites = await searchSites(userName, password, cityName)

    // Fallback: if first word isn't a known city, default to София and treat
    // the entire input as filter text (e.g. user types just "младост")
    if (sites.length === 0) {
      cityName = DEFAULT_CITY
      filterText = trimmed.toLowerCase()
      sites = await searchSites(userName, password, cityName)
    }

    if (sites.length === 0) {
      return NextResponse.json({ sites: [], offices: [] })
    }

    // Get offices for the first matching site
    const firstSite = sites[0]
    const rawOffices = await fetchOffices(userName, password, firstSite.id)

    let offices = rawOffices.map((o) => ({
      id: o.id,
      name: o.name,
      address:
        o.address?.localAddressString || o.address?.fullAddressString || '',
      workingTime:
        o.workingTimeFrom && o.workingTimeTo
          ? `${o.workingTimeFrom} - ${o.workingTimeTo}`
          : '',
      type: o.type,
      siteId: o.siteId,
    }))

    // Filter by extra text (e.g. "софия младост" → filter by "младост")
    if (filterText) {
      const needle = filterText.toLowerCase()
      offices = offices.filter(
        (o) =>
          o.name.toLowerCase().includes(needle) ||
          o.address.toLowerCase().includes(needle)
      )
    }

    return NextResponse.json({
      sites: sites.slice(0, 10).map((s) => ({
        id: s.id,
        name: s.name,
        postCode: s.postCode,
        type: s.type,
      })),
      offices,
      selectedSiteId: firstSite.id,
      filterApplied: filterText || null,
    })
  } catch (error) {
    console.error('Offices API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
