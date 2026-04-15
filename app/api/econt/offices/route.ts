import { NextResponse } from 'next/server'
import {
  econtPost,
  normalizeOffice,
  type EcontOfficeRaw,
  type EcontCity,
} from '@/lib/econt/client'

// GET /api/econt/offices?city=софия or ?city=софия младост
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = (searchParams.get('city') ?? '').trim()
    if (rawQuery.length < 2) {
      return NextResponse.json({ offices: [] })
    }

    const parts = rawQuery.split(/\s+/)
    const cityName = parts[0]
    const filterText = parts.slice(1).join(' ').toLowerCase()

    // 1. Find city
    const citiesResp = await econtPost<{ cities: EcontCity[] }>(
      '/Nomenclatures/NomenclaturesService.getCities.json',
      { countryCode: 'BGR' }
    )
    const cities = citiesResp.cities || []
    const needle = cityName.toLowerCase()
    const matchedCity =
      cities.find((c) => c.name?.toLowerCase() === needle) ||
      cities.find((c) => c.name?.toLowerCase().startsWith(needle))

    if (!matchedCity) {
      return NextResponse.json({ offices: [] })
    }

    // 2. Offices in that city
    const officesResp = await econtPost<{ offices: EcontOfficeRaw[] }>(
      '/Nomenclatures/NomenclaturesService.getOffices.json',
      { countryCode: 'BGR', cityID: matchedCity.id }
    )
    let offices = (officesResp.offices || []).map(normalizeOffice)

    if (filterText) {
      offices = offices.filter(
        (o) =>
          o.name.toLowerCase().includes(filterText) ||
          o.address.toLowerCase().includes(filterText)
      )
    }

    return NextResponse.json({
      offices,
      city: { id: matchedCity.id, name: matchedCity.name },
    })
  } catch (error) {
    console.error('Econt offices API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
