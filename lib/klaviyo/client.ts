const KLAVIYO_API = 'https://a.klaviyo.com/api'

const headers = (apiKey: string) => ({
  Authorization: `Klaviyo-API-Key ${apiKey}`,
  revision: '2024-10-15',
})

export async function getProfiles(apiKey: string) {
  const res = await fetch(`${KLAVIYO_API}/profiles`, {
    headers: headers(apiKey),
  })
  return res.json()
}

export async function getCampaigns(apiKey: string) {
  const res = await fetch(
    `${KLAVIYO_API}/campaigns?filter=equals(messages.channel,'email')`,
    { headers: headers(apiKey) }
  )
  return res.json()
}

export async function getFlows(apiKey: string) {
  const res = await fetch(`${KLAVIYO_API}/flows`, {
    headers: headers(apiKey),
  })
  return res.json()
}
