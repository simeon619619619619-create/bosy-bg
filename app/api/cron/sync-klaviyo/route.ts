import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getProfiles,
  getCampaigns,
  getFlows,
} from '@/lib/klaviyo/client'

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

    const apiKey = process.env.KLAVIYO_API_KEY!

    const [profilesData, campaignsData, flowsData] = await Promise.all([
      getProfiles(apiKey),
      getCampaigns(apiKey),
      getFlows(apiKey),
    ])

    // Upsert profiles count
    await supabase.from('klaviyo_cache').upsert(
      {
        metric_type: 'profiles',
        data: { total: profilesData.data?.length ?? 0 },
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'metric_type' }
    )

    // Upsert campaigns
    const recentCampaigns = (campaignsData.data ?? []).slice(0, 20).map(
      (c: Record<string, unknown>) => ({
        id: c.id,
        name: (c.attributes as Record<string, unknown>)?.name,
        status: (c.attributes as Record<string, unknown>)?.status,
        send_time: (c.attributes as Record<string, unknown>)?.send_time,
        stats: (c.attributes as Record<string, unknown>)?.statistics,
      })
    )

    await supabase.from('klaviyo_cache').upsert(
      {
        metric_type: 'campaigns',
        data: recentCampaigns,
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'metric_type' }
    )

    // Upsert flows
    const activeFlows = (flowsData.data ?? []).map(
      (f: Record<string, unknown>) => ({
        id: f.id,
        name: (f.attributes as Record<string, unknown>)?.name,
        status: (f.attributes as Record<string, unknown>)?.status,
      })
    )

    await supabase.from('klaviyo_cache').upsert(
      {
        metric_type: 'flows',
        data: activeFlows,
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'metric_type' }
    )

    return NextResponse.json({
      message: 'Klaviyo sync complete',
      profiles: profilesData.data?.length ?? 0,
      campaigns: recentCampaigns.length,
      flows: activeFlows.length,
    })
  } catch (error) {
    console.error('Sync klaviyo error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
