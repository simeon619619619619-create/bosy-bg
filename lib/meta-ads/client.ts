const META_API = 'https://graph.facebook.com/v25.0'

export async function getCampaigns(accountId: string, accessToken: string) {
  const res = await fetch(
    `${META_API}/${accountId}/campaigns?fields=name,status,insights{impressions,clicks,spend,actions}&access_token=${accessToken}`
  )
  return res.json()
}

export async function getCampaignInsights(
  accountId: string,
  accessToken: string,
  datePreset: string = 'last_7d'
) {
  const res = await fetch(
    `${META_API}/${accountId}/insights?fields=impressions,clicks,spend,actions,ctr,cpc&date_preset=${datePreset}&access_token=${accessToken}`
  )
  return res.json()
}
