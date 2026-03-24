import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Чакаща',
    className: 'bg-amber-500/15 text-amber-500',
  },
  confirmed: {
    label: 'Потвърдена',
    className: 'bg-blue-500/15 text-blue-500',
  },
  shipped: {
    label: 'Изпратена',
    className: 'bg-orange-500/15 text-orange-500',
  },
  delivered: {
    label: 'Доставена',
    className: 'bg-green-500/15 text-green-500',
  },
  cancelled: {
    label: 'Отказана',
    className: 'bg-red-500/15 text-red-500',
  },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  )
}
