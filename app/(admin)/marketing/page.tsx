import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { toEur } from '@/lib/currency'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BarChart3, Mail, Eye, DollarSign } from 'lucide-react'

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Няма данни'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Току-що'
  if (minutes < 60) return `преди ${minutes} мин`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `преди ${hours} ч`
  return `преди ${Math.floor(hours / 24)} дни`
}

export default async function MarketingPage() {
  const supabase = await createServerSupabaseClient()

  // Meta Ads: sum spend & impressions for last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { data: metaRows } = await supabase
    .from('meta_ads_cache')
    .select('spend, impressions, synced_at')
    .gte('date', sevenDaysAgo)

  const totalSpend = (metaRows ?? []).reduce(
    (sum, r) => sum + Number(r.spend ?? 0),
    0
  )
  const totalImpressions = (metaRows ?? []).reduce(
    (sum, r) => sum + Number(r.impressions ?? 0),
    0
  )
  const metaSyncedAt =
    metaRows && metaRows.length > 0
      ? metaRows.reduce((latest, r) =>
          r.synced_at > latest.synced_at ? r : latest
        ).synced_at
      : null

  // Klaviyo: open rate from campaigns, subscriber count from profiles
  const { data: klaviyoCampaigns } = await supabase
    .from('klaviyo_cache')
    .select('data, synced_at')
    .eq('metric_type', 'campaigns')
    .single()

  const { data: klaviyoProfiles } = await supabase
    .from('klaviyo_cache')
    .select('data, synced_at')
    .eq('metric_type', 'profiles')
    .single()

  const campaignsData = Array.isArray(klaviyoCampaigns?.data)
    ? klaviyoCampaigns.data
    : []
  const openRates = campaignsData
    .map((c: Record<string, unknown>) => {
      const stats = c.stats as Record<string, unknown> | undefined
      return stats?.open_rate as number | undefined
    })
    .filter((r): r is number => r != null)
  const avgOpenRate =
    openRates.length > 0
      ? (openRates.reduce((a, b) => a + b, 0) / openRates.length) * 100
      : null

  const profilesTotal =
    (klaviyoProfiles?.data as Record<string, unknown>)?.total ?? 0

  const klaviyoSyncedAt = klaviyoCampaigns?.synced_at ?? klaviyoProfiles?.synced_at ?? null

  const latestSync = [metaSyncedAt, klaviyoSyncedAt as string | null]
    .filter(Boolean)
    .sort()
    .pop() ?? null

  const cards = [
    {
      title: 'Meta Ads Харчове (7 дни)',
      value: `${toEur(totalSpend).toFixed(2)} \u20AC`,
      icon: DollarSign,
    },
    {
      title: 'Meta Impressions (7 дни)',
      value: totalImpressions.toLocaleString('bg-BG'),
      icon: Eye,
    },
    {
      title: 'Klaviyo Open Rate',
      value: avgOpenRate != null ? `${avgOpenRate.toFixed(1)}%` : '—',
      icon: Mail,
    },
    {
      title: 'Email абонати',
      value: Number(profilesTotal).toLocaleString('bg-BG'),
      icon: Mail,
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold">Маркетинг</h1>

      {/* Sync status */}
      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block size-2 rounded-full bg-green-500" />
        Синхронизирано {timeAgo(latestSync)}
      </div>

      {/* Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Links */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/marketing/meta-ads"
          className="flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <BarChart3 className="size-4" />
          Meta Ads детайли
        </Link>
        <Link
          href="/marketing/klaviyo"
          className="flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Mail className="size-4" />
          Klaviyo детайли
        </Link>
      </div>
    </div>
  )
}
