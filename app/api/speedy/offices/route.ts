import { NextResponse } from 'next/server'

const SPEEDY_BASE = 'https://api.speedy.bg/v1'

// GET /api/speedy/offices?city=София
// Returns: { sites: [{id, name}], offices: [{id, name, address, workingTime}] }
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('city') ?? ''
    const trimmed = rawQuery.trim()

    if (trimmed.length < 2) {
      return NextResponse.json({ sites: [], offices: [] })
    }

    // Split into city + optional filter text
    // e.g. "софия младост" → cityName="софия", filterText="младост"
    const parts = trimmed.split(/\s+/)
    const cityName = parts[0]
    const filterText = parts.slice(1).join(' ').toLowerCase()

    const userName = process.env.SPEEDY_USERNAME
    const password = process.env.SPEEDY_PASSWORD

    if (!userName || !password) {
      return NextResponse.json(
        { error: 'Speedy credentials not configured' },
        { status: 500 }
      )
    }

    // 1. Find site (city) by name
    const siteRes = await fetch(`${SPEEDY_BASE}/location/site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName,
        password,
        language: 'BG',
        countryId: 100,
        name: cityName.toUpperCase(),
      }),
    })

    const siteData = await siteRes.json()

    // Debug: if Speedy returned an error, surface it
    if (siteData.error) {
      return NextResponse.json({
        sites: [],
        offices: [],
        debug: { stage: 'site-search', speedyError: siteData.error },
      })
    }

    const sites = (siteData.sites || []).slice(0, 10).map((s: {
      id: number
      name: string
      postCode?: string
      type?: string
    }) => ({
      id: s.id,
      name: s.name,
      postCode: s.postCode,
      type: s.type,
    }))

    if (sites.length === 0) {
      return NextResponse.json({
        sites: [],
        offices: [],
        debug: {
          stage: 'no-sites',
          rawResponse: siteData,
          searchedFor: cityName.toUpperCase(),
        },
      })
    }

    // 2. Get offices for the first matching site
    const firstSite = sites[0]
    const officeRes = await fetch(`${SPEEDY_BASE}/location/office`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName,
        password,
        language: 'BG',
        countryId: 100,
        siteId: firstSite.id,
      }),
    })

    const officeData = await officeRes.json()
    let offices = (officeData.offices || []).map((o: {
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
    }) => ({
      id: o.id,
      name: o.name,
      address: o.address?.localAddressString || o.address?.fullAddressString || '',
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
        (o: { name: string; address: string }) =>
          o.name.toLowerCase().includes(needle) ||
          o.address.toLowerCase().includes(needle)
      )
    }

    return NextResponse.json({
      sites,
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
