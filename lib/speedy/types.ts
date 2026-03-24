export interface CreateShipmentParams {
  service: {
    serviceId: number
    autoAdjustPickupDate?: boolean
  }
  content: {
    parcelsCount: number
    totalWeight: number
    contents: string
    package: string
  }
  payment: {
    courierServicePayer: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY'
    declaredValueAmount?: number
    declaredValueCurrency?: string
  }
  sender: {
    phone1: { number: string }
    contactName?: string
    email?: string
  }
  recipient: {
    phone1: { number: string }
    clientName: string
    email?: string
    address?: {
      countryId?: number
      city?: string
      postCode?: string
      streetName?: string
      streetNo?: string
      blockNo?: string
      entranceNo?: string
      floorNo?: string
      apartmentNo?: string
    }
    privatePerson?: boolean
  }
  ref1?: string
  ref2?: string
}

export interface ShipmentResponse {
  id: string
  parcels: Array<{
    id: string
    seqNo: number
    externalCarrierParcelNumber?: string
  }>
  price: {
    amount: number
    currency: string
  }
  pickupDate: string
  deliveryDeadline: string
}

export interface TrackingEvent {
  dateTime: string
  operationDescription: string
  place?: string
}

export interface TrackingResponse {
  parcels: Array<{
    id: string
    operations: TrackingEvent[]
    externalCarrierParcelNumber?: string
  }>
}

export interface PrintResponse {
  parcels: Array<{
    parcel: { id: string }
    pdfURL?: string
    pdf?: string // base64
  }>
}

export interface SpeedyShipment {
  id: string
  order_id: string
  parcel_id: string
  tracking_number: string | null
  status: string
  status_history: Array<{
    status: string
    timestamp: string
    description?: string
  }>
  created_at: string
  updated_at: string
}
