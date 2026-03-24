import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const dateFilters = [
  { key: '7', label: '7 дни', days: 7 },
  { key: '30', label: '30 дни', days: 30 },
  { key: '90', label: '90 дни', days: 90 },
] as const

interface CampaignRow {
  campaign_id: string
  campaign_name: string
  status: string
  impressions: number
  clicks: number
  spend: number
  actions: Array<{ action_type?: string; value?: string }>
}

export default async function MetaAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { period } = await searchParams
  const activePeriod = typeof period === 'string' ? period : '7'
  const days =
    dateFilters.find((f) => f.key === activePeriod)?.days ?? 7

  const supabase = await createServerSupabaseClient()

  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { data: rows } = await supabase
    .from('meta_ads_cache')
    .select('*')
    .gte('date', sinceDate)
    .order('spend', { ascending: false })

  // Group by campaign
  const campaignMap = new Map<string, CampaignRow>()
  for (const row of rows ?? []) {
    const existing = campaignMap.get(row.campaign_id)
    if (existing) {
      existing.impressions += Number(row.impressions ?? 0)
      existing.clicks += Number(row.clicks ?? 0)
      existing.spend += Number(row.spend ?? 0)
      // merge actions
      const actions = Array.isArray(row.actions) ? row.actions : []
      existing.actions = [...existing.actions, ...actions]
    } else {
      campaignMap.set(row.campaign_id, {
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        status: row.status,
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        spend: Number(row.spend ?? 0),
        actions: Array.isArray(row.actions) ? row.actions : [],
      })
    }
  }

  const campaigns = Array.from(campaignMap.values())

  return (
    <div>
      <h1 className="text-3xl font-bold">Meta Ads</h1>

      {/* Date filter tabs */}
      <div className="mt-6 flex items-center gap-1">
        {dateFilters.map((tab) => (
          <Button
            key={tab.key}
            variant={activePeriod === tab.key ? 'secondary' : 'ghost'}
            size="sm"
            render={
              <Link
                href={
                  tab.key === '7'
                    ? '/marketing/meta-ads'
                    : `/marketing/meta-ads?period=${tab.key}`
                }
              />
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      {campaigns.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold">Няма данни</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Все още няма синхронизирани кампании
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Кампания</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Харчове</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const ctr =
                  c.impressions > 0
                    ? ((c.clicks / c.impressions) * 100).toFixed(2)
                    : '0.00'
                const conversions = c.actions
                  .filter(
                    (a) =>
                      a.action_type === 'offsite_conversion' ||
                      a.action_type === 'purchase'
                  )
                  .reduce((sum, a) => sum + Number(a.value ?? 0), 0)
                const purchaseValue = c.actions
                  .filter((a) => a.action_type === 'omni_purchase')
                  .reduce((sum, a) => sum + Number(a.value ?? 0), 0)
                const roas =
                  c.spend > 0
                    ? (purchaseValue / c.spend).toFixed(2)
                    : '—'

                return (
                  <TableRow key={c.campaign_id}>
                    <TableCell className="font-medium">
                      {c.campaign_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === 'ACTIVE' ? 'default' : 'secondary'
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {c.impressions.toLocaleString('bg-BG')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {c.clicks.toLocaleString('bg-BG')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {ctr}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {c.spend.toFixed(2)} лв.
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {conversions}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {roas}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
