import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCampaigns } from '@/lib/meta-ads/client'

export async function GET(request: Request) {
  if (
    request.headers.get('authorization') !==
    'Bearer ' + process.env.CRON_SECRET
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const accountId = process.env.META_AD_ACCOUNT_ID!
    const accessToken = process.env.META_ACCESS_TOKEN!

    const data = await getCampaigns(accountId, accessToken)
    const campaigns = data.data ?? []

    let upsertedCount = 0
    const today = new Date().toISOString().slice(0, 10)

    for (const campaign of campaigns) {
      const insights = campaign.insights?.data?.[0]
      if (!insights) continue

      const { error } = await supabase.from('meta_ads_cache').upsert(
        {
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status,
          impressions: Number(insights.impressions ?? 0),
          clicks: Number(insights.clicks ?? 0),
          spend: Number(insights.spend ?? 0),
          actions: insights.actions ?? [],
          date: today,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'campaign_id,date' }
      )

      if (error) {
        console.error(`Error upserting campaign ${campaign.id}:`, error)
      } else {
        upsertedCount++
      }
    }

    return NextResponse.json({
      message: 'Meta Ads sync complete',
      total: campaigns.length,
      upserted: upsertedCount,
    })
  } catch (error) {
    console.error('Sync meta error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
