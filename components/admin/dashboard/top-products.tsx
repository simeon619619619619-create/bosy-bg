import Link from 'next/link'
import { toEur } from '@/lib/currency'

interface TopProduct {
  name: string
  sales: number
  revenue: number
}

interface TopProductsProps {
  products: TopProduct[]
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold">Топ продукти</h3>
        <Link
          href="/admin/products"
          className="text-sm text-primary hover:underline"
        >
          Виж всички &rarr;
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">Няма данни</p>
        )}
        {products.map((p, i) => (
          <div
            key={`${p.name}-${i}`}
            className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono text-sm font-bold text-primary">
              #{i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.sales} продажби
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold text-green-500">
              {toEur(p.revenue).toFixed(0)} &euro;
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
