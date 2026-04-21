// BoxNow Partner API client.
// Docs: POST /api/v1/auth-sessions (OAuth2 client_credentials)
//       GET  /api/v1/lockers
//       POST /api/v1/delivery-requests
//       GET  /api/v1/delivery-requests/{id}/shipping-labels

const DEFAULT_BASE = 'https://api-production.boxnow.bg'

interface CachedToken {
  accessToken: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null

function boxnowConfig() {
  const baseUrl = process.env.BOXNOW_API_URL || DEFAULT_BASE
  const clientId = process.env.BOXNOW_CLIENT_ID
  const clientSecret = process.env.BOXNOW_CLIENT_SECRET
  const partnerId = process.env.BOXNOW_PARTNER_ID
  const warehouseId = process.env.BOXNOW_WAREHOUSE_ID
  if (!clientId || !clientSecret) {
    throw new Error('BoxNow credentials not configured')
  }
  return { baseUrl, clientId, clientSecret, partnerId, warehouseId }
}

async function fetchAccessToken(): Promise<string> {
  const { baseUrl, clientId, clientSecret } = boxnowConfig()

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken
  }

  const res = await fetch(`${baseUrl}/api/v1/auth-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const text = await res.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(`BoxNow auth invalid JSON: ${text.slice(0, 200)}`)
  }

  if (!res.ok) {
    const msg =
      (parsed as { message?: string; error?: string })?.message ||
      (parsed as { error?: string })?.error ||
      `HTTP ${res.status}`
    throw new Error(`BoxNow auth failed: ${msg}`)
  }

  const data = parsed as { access_token?: string; expires_in?: number }
  if (!data.access_token) {
    throw new Error('BoxNow auth: no access_token in response')
  }

  const ttlMs = (data.expires_in ?? 3600) * 1000
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + ttlMs,
  }
  return data.access_token
}

export async function boxnowFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const { baseUrl } = boxnowConfig()
  const token = await fetchAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(`${baseUrl}${path}`, { ...init, headers })
}

export async function boxnowJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await boxnowFetch(path, init)
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`BoxNow ${path} invalid JSON: ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    const err = parsed as { message?: string; error?: string; errors?: unknown }
    const msg =
      err.message ||
      err.error ||
      (err.errors ? JSON.stringify(err.errors) : `HTTP ${res.status}`)
    throw new Error(`BoxNow ${path}: ${msg}`)
  }
  return parsed as T
}

export interface BoxNowLocker {
  id: string
  name: string
  addressLine1: string
  postalCode: string
  city?: string
  lat?: number
  lng?: number
}

export function boxnowPartnerId(): string {
  const { partnerId } = boxnowConfig()
  if (!partnerId) throw new Error('BOXNOW_PARTNER_ID not configured')
  return partnerId
}

export function boxnowWarehouseId(): string {
  const { warehouseId } = boxnowConfig()
  if (!warehouseId) throw new Error('BOXNOW_WAREHOUSE_ID not configured')
  return warehouseId
}
