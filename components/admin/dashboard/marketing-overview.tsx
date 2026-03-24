interface MarketingOverviewProps {
  metaSpend: number
  metaImpressions: number
  klaviyoOpenRate: number | null
  klaviyoSubscribers: number
  lastSyncedAt: string | null
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('bg-BG')
}

function minutesAgo(dateStr: string | null): string {
  if (!dateStr) return 'няма данни'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'току-що'
  if (mins < 60) return `преди ${mins} мин`
  const hours = Math.floor(mins / 60)
  return `преди ${hours} ч`
}

export function MarketingOverview({
  metaSpend,
  metaImpressions,
  klaviyoOpenRate,
  klaviyoSubscribers,
  lastSyncedAt,
}: MarketingOverviewProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold">Маркетинг Overview</h3>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">
            Синхронизирано {minutesAgo(lastSyncedAt)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Meta Ads Харчове
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold text-primary">
            {metaSpend.toFixed(0)} лв.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Последни 7 дни
          </p>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Meta Impressions
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold">
            {formatNumber(metaImpressions)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Последни 7 дни
          </p>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Klaviyo Open Rate
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold text-green-500">
            {klaviyoOpenRate != null
              ? `${(klaviyoOpenRate * 100).toFixed(1)}%`
              : '--'}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Последна кампания
          </p>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Email абонати
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold">
            {klaviyoSubscribers.toLocaleString('bg-BG')}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Klaviyo общо
          </p>
        </div>
      </div>
    </div>
  )
}
