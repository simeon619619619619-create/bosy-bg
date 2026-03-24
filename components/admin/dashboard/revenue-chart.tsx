interface RevenueChartProps {
  data: { date: string; total: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxValue = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold">Приходи (последни 14 дни)</h3>
      </div>

      {/* Bars */}
      <div className="flex h-[220px] items-end gap-2">
        {data.map((d) => {
          const heightPct = Math.max((d.total / maxValue) * 100, 2)
          return (
            <div
              key={d.date}
              className="group relative flex-1"
              style={{ height: '100%' }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t-md transition-opacity hover:opacity-80"
                style={{
                  height: `${heightPct}%`,
                  background:
                    'linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.3))',
                }}
                title={`${d.total.toFixed(0)} лв.`}
              />
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 font-mono text-xs text-popover-foreground shadow group-hover:block">
                {d.total.toFixed(0)} лв.
              </div>
            </div>
          )
        })}
      </div>

      {/* Date labels */}
      <div className="mt-3 flex gap-2">
        {data.map((d) => {
          const day = new Date(d.date).getDate()
          return (
            <span
              key={d.date}
              className="flex-1 text-center font-mono text-[11px] text-muted-foreground"
            >
              {day}
            </span>
          )
        })}
      </div>
    </div>
  )
}
