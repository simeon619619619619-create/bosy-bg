import type { CreateShipmentParams, ShipmentResponse, TrackingResponse, PrintResponse } from './types'

const SPEEDY_BASE = 'https://api.speedy.bg/v1'

export class SpeedyClient {
  constructor(private username: string, private password: string) {}

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${SPEEDY_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: this.username,
        password: this.password,
        ...body,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Speedy API error: ${res.status} ${text}`)
    }

    return res.json() as Promise<T>
  }

  async createShipment(params: CreateShipmentParams): Promise<ShipmentResponse> {
    return this.request<ShipmentResponse>('shipment', params as unknown as Record<string, unknown>)
  }

  async getShipmentStatus(parcelId: string): Promise<TrackingResponse> {
    return this.request<TrackingResponse>('track', {
      parcels: [{ id: parcelId }],
    })
  }

  async printLabel(parcelId: string): Promise<PrintResponse> {
    return this.request<PrintResponse>('print', {
      parcels: [{ parcel: { id: parcelId } }],
      paperSize: 'A6',
      type: 'label',
    })
  }
}

let _client: SpeedyClient | null = null

export function getSpeedyClient(): SpeedyClient {
  if (!_client) {
    const username = process.env.SPEEDY_USERNAME
    const password = process.env.SPEEDY_PASSWORD
    if (!username || !password) {
      throw new Error('Missing SPEEDY_USERNAME or SPEEDY_PASSWORD env vars')
    }
    _client = new SpeedyClient(username, password)
  }
  return _client
}
