const statusLabels: Record<string, string> = {
  pending: 'Нова поръчка',
  confirmed: 'Потвърдена',
  shipped: 'Изпратена',
  delivered: 'Доставена',
  cancelled: 'Отказана',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
}

interface TimelineEntry {
  status: string
  timestamp: string
  label: string
}

export function OrderTimeline({
  status,
  createdAt,
  updatedAt,
  speedyTrackingNumber,
}: {
  status: string
  createdAt: string
  updatedAt: string | null
  speedyTrackingNumber: string | null
}) {
  const entries: TimelineEntry[] = []

  // Always show created
  entries.push({
    status: 'pending',
    timestamp: createdAt,
    label: 'Поръчка създадена',
  })

  // Add status-based entries
  if (status === 'confirmed' || status === 'shipped' || status === 'delivered') {
    entries.push({
      status: 'confirmed',
      timestamp: updatedAt ?? createdAt,
      label: 'Поръчка потвърдена',
    })
  }

  if (status === 'shipped' || status === 'delivered') {
    entries.push({
      status: 'shipped',
      timestamp: updatedAt ?? createdAt,
      label: speedyTrackingNumber
        ? `Изпратена (Speedy: ${speedyTrackingNumber})`
        : 'Изпратена с куриер',
    })
  }

  if (status === 'delivered') {
    entries.push({
      status: 'delivered',
      timestamp: updatedAt ?? createdAt,
      label: 'Доставена успешно',
    })
  }

  if (status === 'cancelled') {
    entries.push({
      status: 'cancelled',
      timestamp: updatedAt ?? createdAt,
      label: 'Поръчка отказана',
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Хронология</h2>
      <div className="mt-4 space-y-0">
        {entries.map((entry, i) => (
          <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Vertical line */}
            {i < entries.length - 1 && (
              <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
            )}
            {/* Dot */}
            <div
              className={`relative mt-1 size-[15px] shrink-0 rounded-full ${statusColors[entry.status] ?? 'bg-muted-foreground'}`}
            />
            {/* Content */}
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {entry.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.timestamp).toLocaleDateString('bg-BG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
