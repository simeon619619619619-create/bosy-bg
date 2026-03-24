import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge'

interface RecentOrder {
  id: string
  order_number: string | null
  customer_name: string
  items_count: number
  total: number
  status: string
  speedy_tracking_number: string | null
  created_at: string
}

interface RecentOrdersProps {
  orders: RecentOrder[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold">Последни поръчки</h3>
        <Link
          href="/orders"
          className="text-sm text-primary hover:underline"
        >
          Виж всички &rarr;
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Няма поръчки</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Поръчка</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Продукти</TableHead>
                <TableHead>Сума</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Speedy</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-mono text-primary hover:underline"
                    >
                      {order.order_number ?? order.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.items_count}</TableCell>
                  <TableCell className="font-mono">
                    {order.total.toFixed(2)} лв.
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    {order.speedy_tracking_number ? (
                      <span className="font-mono text-primary">
                        {order.speedy_tracking_number}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('bg-BG', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
