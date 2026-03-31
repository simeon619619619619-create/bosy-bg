const VIVA_TOKEN_URL = 'https://accounts.vivapayments.com/connect/token'
const VIVA_API_URL = 'https://api.vivapayments.com'
const VIVA_CHECKOUT_URL = 'https://www.vivapayments.com/web/checkout'

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const clientId = process.env.VIVA_CLIENT_ID!
  const clientSecret = process.env.VIVA_CLIENT_SECRET!
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(VIVA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Viva OAuth failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return data.access_token
}

interface CreatePaymentOrderParams {
  amountCents: number
  customerEmail: string
  customerName: string
  customerPhone?: string
  orderDescription: string
  merchantTrns?: string
  sourceCode?: string
}

interface PaymentOrderResponse {
  orderCode: number
}

export async function createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResponse> {
  const token = await getAccessToken()

  const body: Record<string, unknown> = {
    amount: params.amountCents,
    customerTrns: params.orderDescription,
    customer: {
      email: params.customerEmail,
      fullName: params.customerName,
      phone: params.customerPhone || undefined,
      requestLang: 'bg-BG',
    },
    paymentTimeout: 1800,
    currencyCode: '978', // EUR
  }

  if (params.sourceCode) {
    body.sourceCode = params.sourceCode
  }
  if (params.merchantTrns) {
    body.merchantTrns = params.merchantTrns
  }

  const res = await fetch(`${VIVA_API_URL}/checkout/v2/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Viva create order failed: ${res.status} ${text}`)
  }

  return res.json()
}

export async function verifyTransaction(transactionId: string): Promise<{
  statusId: string
  amount: number
  orderCode: number
}> {
  const token = await getAccessToken()

  const res = await fetch(`${VIVA_API_URL}/checkout/v2/transactions/${transactionId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Viva verify failed: ${res.status} ${text}`)
  }

  return res.json()
}

export function getCheckoutUrl(orderCode: number): string {
  return `${VIVA_CHECKOUT_URL}?ref=${orderCode}`
}
