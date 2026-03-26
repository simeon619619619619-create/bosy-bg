import { createServerSupabaseClient } from '@/lib/supabase/server'
import { toEur } from '@/lib/currency'
import { StatCard } from '@/components/admin/dashboard/stat-card'
import { RevenueChart } from '@/components/admin/dashboard/revenue-chart'
import { TopProducts } from '@/components/admin/dashboard/top-products'
import { RecentOrders } from '@/components/admin/dashboard/recent-orders'
import { MarketingOverview } from '@/components/admin/dashboard/marketing-overview'

interface OrderItem {
  product_name?: string
  name?: string
  quantity?: number
  price?: number
  total?: number
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const yesterday = new Date(now.getTime() - 86_400_000)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  // ── 1. Revenue today ──────────────────────────────────────
  const { data: revTodayRows } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', `${todayStr}T00:00:00`)
    .lt('created_at', `${todayStr}T23:59:59.999`)
    .neq('status', 'cancelled')

  const revenueToday = (revTodayRows ?? []).reduce(
    (sum, r) => sum + Number(r.total ?? 0),
    0
  )

  // ── 2. Revenue yesterday ──────────────────────────────────
  const { data: revYesterdayRows } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', `${yesterdayStr}T00:00:00`)
    .lt('created_at', `${yesterdayStr}T23:59:59.999`)
    .neq('status', 'cancelled')

  const revenueYesterday = (revYesterdayRows ?? []).reduce(
    (sum, r) => sum + Number(r.total ?? 0),
    0
  )

  const revChange =
    revenueYesterday > 0
      ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
      : revenueToday > 0
        ? 100
        : 0
  const revDirection: 'up' | 'down' | 'neutral' =
    revChange > 0 ? 'up' : revChange < 0 ? 'down' : 'neutral'

  // ── 3. New orders today ───────────────────────────────────
  const { count: ordersToday } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${todayStr}T00:00:00`)
    .lt('created_at', `${todayStr}T23:59:59.999`)

  const { count: ordersYesterday } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${yesterdayStr}T00:00:00`)
    .lt('created_at', `${yesterdayStr}T23:59:59.999`)

  const ordersDiff = (ordersToday ?? 0) - (ordersYesterday ?? 0)

  // ── 4. Active customers ───────────────────────────────────
  const { count: customersCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })

  // ── 5. Meta Ads ROAS (last 7 days) ────────────────────────
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10)

  const { data: metaRows } = await supabase
    .from('meta_ads_cache')
    .select('spend, impressions, actions')
    .gte('date', sevenDaysAgo)

  let metaTotalSpend = 0
  let metaTotalImpressions = 0
  let metaTotalPurchaseValue = 0

  for (const row of metaRows ?? []) {
    metaTotalSpend += Number(row.spend ?? 0)
    metaTotalImpressions += Number(row.impressions ?? 0)
    const actions = Array.isArray(row.actions) ? row.actions : []
    for (const a of actions) {
      if (
        (a as { action_type?: string }).action_type === 'omni_purchase' ||
        (a as { action_type?: string }).action_type === 'purchase'
      ) {
        metaTotalPurchaseValue += Number(
          (a as { value?: string }).value ?? 0
        )
      }
    }
  }

  const roas = metaTotalSpend > 0 ? metaTotalPurchaseValue / metaTotalSpend : 0

  // ── 6. Revenue chart (last 14 days) ───────────────────────
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000)
    .toISOString()
    .slice(0, 10)

  const { data: chartOrderRows } = await supabase
    .from('orders')
    .select('total, created_at')
    .gte('created_at', `${fourteenDaysAgo}T00:00:00`)
    .neq('status', 'cancelled')

  // Group by date
  const dailyMap = new Map<string, number>()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000)
    dailyMap.set(d.toISOString().slice(0, 10), 0)
  }
  for (const row of chartOrderRows ?? []) {
    const dateKey = row.created_at.slice(0, 10)
    if (dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + Number(row.total ?? 0))
    }
  }
  const chartData = Array.from(dailyMap.entries()).map(([date, total]) => ({
    date,
    total,
  }))

  // ── 7. Top 5 products ────────────────────────────────────
  const { data: allOrders } = await supabase
    .from('orders')
    .select('items')
    .neq('status', 'cancelled')

  const productMap = new Map<string, { sales: number; revenue: number }>()
  for (const order of allOrders ?? []) {
    const items: OrderItem[] = Array.isArray(order.items) ? order.items : []
    for (const item of items) {
      const name = item.product_name ?? item.name ?? 'Неизвестен'
      const qty = Number(item.quantity ?? 1)
      const rev = Number(item.total ?? item.price ?? 0) * qty
      const existing = productMap.get(name)
      if (existing) {
        existing.sales += qty
        existing.revenue += rev
      } else {
        productMap.set(name, { sales: qty, revenue: rev })
      }
    }
  }
  const topProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // ── 8. Last 5 orders ─────────────────────────────────────
  const { data: recentOrderRows } = await supabase
    .from('orders')
    .select('id, order_number, total, status, speedy_tracking_number, created_at, items, customers(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const recentOrders = (recentOrderRows ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name:
      (o.customers as unknown as { name: string } | null)?.name ?? '--',
    items_count: Array.isArray(o.items) ? o.items.length : 0,
    total: Number(o.total ?? 0),
    status: o.status,
    speedy_tracking_number: o.speedy_tracking_number,
    created_at: o.created_at,
  }))

  // ── 9. Marketing overview ────────────────────────────────
  const { data: klaviyoProfiles } = await supabase
    .from('klaviyo_cache')
    .select('data, synced_at')
    .eq('metric_type', 'profiles')
    .single()

  const { data: klaviyoCampaigns } = await supabase
    .from('klaviyo_cache')
    .select('data, synced_at')
    .eq('metric_type', 'campaigns')
    .single()

  const klaviyoSubscribers = Number(
    (klaviyoProfiles?.data as Record<string, unknown>)?.total ?? 0
  )

  const campaigns = Array.isArray(klaviyoCampaigns?.data)
    ? (klaviyoCampaigns.data as Array<{ stats?: { open_rate?: number } }>)
    : []
  const latestOpenRate =
    campaigns.length > 0 ? (campaigns[0].stats?.open_rate ?? null) : null

  // Find latest sync time across both sources
  const syncTimes = [
    klaviyoProfiles?.synced_at,
    klaviyoCampaigns?.synced_at,
  ].filter(Boolean) as string[]

  // Also check meta_ads_cache for latest sync
  const { data: latestMeta } = await supabase
    .from('meta_ads_cache')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()

  if (latestMeta?.synced_at) syncTimes.push(latestMeta.synced_at)
  const lastSyncedAt =
    syncTimes.length > 0
      ? syncTimes.sort().reverse()[0]
      : null

  return (
    <div>
      {/* Header */}
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Добре дошъл. Ето какво се случва днес.
      </p>

      {/* Stat cards — 4 columns */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Приходи днес"
          value={`${toEur(revenueToday).toFixed(0)} \u20AC`}
          changePercent={revChange}
          changeText="спрямо вчера"
          direction={revDirection}
          valueColor="text-green-500"
        />
        <StatCard
          label="Нови поръчки"
          value={String(ordersToday ?? 0)}
          changeText={`${ordersDiff >= 0 ? '+' : ''}${ordersDiff} спрямо вчера`}
          direction={ordersDiff > 0 ? 'up' : ordersDiff < 0 ? 'down' : 'neutral'}
          valueColor="text-primary"
        />
        <StatCard
          label="Активни клиенти"
          value={String(customersCount ?? 0)}
        />
        <StatCard
          label="Meta Ads ROAS"
          value={roas > 0 ? `${roas.toFixed(1)}x` : '--'}
          valueColor="text-blue-400"
        />
      </div>

      {/* Revenue chart + Top products — 2/3 + 1/3 */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <RevenueChart data={chartData} />
        <TopProducts products={topProducts} />
      </div>

      {/* Marketing overview */}
      <div className="mt-8">
        <MarketingOverview
          metaSpend={metaTotalSpend}
          metaImpressions={metaTotalImpressions}
          klaviyoOpenRate={latestOpenRate}
          klaviyoSubscribers={klaviyoSubscribers}
          lastSyncedAt={lastSyncedAt}
        />
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <RecentOrders orders={recentOrders} />
      </div>
    </div>
  )
}
