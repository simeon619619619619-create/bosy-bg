'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toEur } from '@/lib/currency'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge'
import { bulkConfirmOrders, bulkCancelOrders } from '@/app/admin/orders/actions'
import { Search } from 'lucide-react'

interface Order {
  id: string
  order_number: number | null
  customer_name: string
  items_count: number
  total: number
  status: string
  speedy_tracking_number: string | null
  created_at: string
}

export function OrdersListClient({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter orders client-side by search query
  const filtered = searchQuery
    ? orders.filter((o) => {
        const q = searchQuery.toLowerCase()
        const num = String(o.order_number ?? '').toLowerCase()
        const name = o.customer_name.toLowerCase()
        return num.includes(q) || name.includes(q)
      })
    : orders

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((o) => o.id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleSearch(value: string) {
    setSearchQuery(value)
    setSelectedIds(new Set())
  }

  const selectedArr = Array.from(selectedIds)
  const hasSelection = selectedArr.length > 0

  return (
    <>
      {/* Search + bulk actions bar */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Търси по номер или клиент..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 max-w-xs"
          />
        </div>

        {hasSelection && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5">
            <span className="text-sm text-muted-foreground">
              {selectedArr.length} избрани
            </span>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await bulkConfirmOrders(selectedArr)
                  setSelectedIds(new Set())
                })
              }}
            >
              {isPending ? 'Обработка...' : 'Потвърди'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await bulkCancelOrders(selectedArr)
                  setSelectedIds(new Set())
                })
              }}
            >
              {isPending ? 'Обработка...' : 'Откажи'}
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 rounded border-border"
                />
              </TableHead>
              <TableHead>Поръчка #</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Артикули</TableHead>
              <TableHead>Общо</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Speedy</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => {
              const orderUrl = `/admin/orders/${order.id}`
              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleOne(order.id)}
                      className="size-4 rounded border-border"
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={orderUrl} className="font-mono text-primary hover:underline">
                      {order.order_number ?? order.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={orderUrl} className="block">{order.customer_name}</Link>
                  </TableCell>
                  <TableCell>
                    <Link href={orderUrl} className="block">{order.items_count}</Link>
                  </TableCell>
                  <TableCell>
                    <Link href={orderUrl} className="block font-mono">{toEur(order.total).toFixed(2)} &euro;</Link>
                  </TableCell>
                  <TableCell>
                    <Link href={orderUrl}>
                      <OrderStatusBadge status={order.status} />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={orderUrl} className="block">
                      {order.speedy_tracking_number ? (
                        <span className="font-mono text-primary">{order.speedy_tracking_number}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={orderUrl} className="block text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('bg-BG')}
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
