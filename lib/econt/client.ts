const ECONT_BASE = 'https://ee.econt.com/services'

export function econtHeaders() {
  const user = process.env.ECONT_USERNAME
  const pass = process.env.ECONT_PASSWORD
  if (!user || !pass) {
    throw new Error('Econt credentials not configured')
  }
  const token = Buffer.from(`${user}:${pass}`).toString('base64')
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${token}`,
  }
}

export async function econtPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${ECONT_BASE}${path}`, {
    method: 'POST',
    headers: econtHeaders(),
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(`Econt invalid JSON: ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    const msg =
      (parsed as { message?: string; error?: string })?.message ||
      (parsed as { error?: string })?.error ||
      `HTTP ${res.status}`
    throw new Error(`Econt ${path}: ${msg}`)
  }
  return parsed as T
}

export interface EcontCity {
  id: number
  name: string
  nameEn?: string
  postCode?: string
  regionName?: string
}

export interface EcontOfficeRaw {
  id: number
  code?: string
  name: string
  nameEn?: string
  isMPS?: boolean
  isAPS?: boolean
  address?: {
    id?: number
    city?: EcontCity
    fullAddress?: string
    street?: string
    num?: string
  }
  info?: string
  currency?: string
  normalBusinessHoursFrom?: string
  normalBusinessHoursTo?: string
  normalBusinessHoursFromSaturday?: string
  normalBusinessHoursToSaturday?: string
}

export interface EcontOffice {
  id: number
  name: string
  address: string
  workingTime: string
  isAutomat: boolean
  cityId: number | null
  cityName: string
}

export function normalizeOffice(raw: EcontOfficeRaw): EcontOffice {
  const addr = raw.address?.fullAddress || raw.address?.street || ''
  const cityName = raw.address?.city?.name || ''
  const hoursFrom = raw.normalBusinessHoursFrom
  const hoursTo = raw.normalBusinessHoursTo
  return {
    id: raw.id,
    name: raw.name,
    address: addr,
    workingTime:
      hoursFrom && hoursTo ? `${hoursFrom} - ${hoursTo}` : '',
    isAutomat: raw.isAPS === true,
    cityId: raw.address?.city?.id ?? null,
    cityName,
  }
}
