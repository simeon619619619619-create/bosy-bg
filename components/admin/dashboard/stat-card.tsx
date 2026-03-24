import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  changePercent?: number
  changeText?: string
  direction?: 'up' | 'down' | 'neutral'
  valueColor?: string
}

export function StatCard({
  label,
  value,
  changePercent,
  changeText,
  direction = 'neutral',
  valueColor,
}: StatCardProps) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-[0_0_30px_rgba(255,120,32,0.08)]">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn('mt-2 font-mono text-3xl font-bold', valueColor)}
      >
        {value}
      </p>
      {(changePercent != null || changeText) && (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-xs',
            direction === 'up' && 'text-green-500',
            direction === 'down' && 'text-red-500',
            direction === 'neutral' && 'text-muted-foreground'
          )}
        >
          {direction === 'up' && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
          )}
          {direction === 'down' && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            </svg>
          )}
          {changePercent != null && (
            <span>
              {direction === 'up' ? '+' : ''}
              {changePercent.toFixed(1)}%
            </span>
          )}
          {changeText && <span>{changeText}</span>}
        </div>
      )}
    </div>
  )
}
