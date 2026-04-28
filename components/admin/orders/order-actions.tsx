'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { confirmOrder, cancelOrder } from '@/app/admin/orders/actions'

export function ConfirmOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await confirmOrder(orderId)
          if (!res.ok) alert(res.error)
        })
      }}
    >
      {isPending ? 'Обработка...' : 'Потвърди'}
    </Button>
  )
}

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await cancelOrder(orderId)
        })
      }}
    >
      {isPending ? 'Обработка...' : 'Откажи'}
    </Button>
  )
}

export function ShipWithSpeedyButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch('/api/speedy/create-parcel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          })

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            alert(data.error ?? 'Грешка при създаване на пратка')
            return
          }

          window.location.reload()
        })
      }}
    >
      {isPending ? 'Изпращане...' : 'Изпрати с Speedy'}
    </Button>
  )
}

export function ShipWithBoxNowButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch('/api/boxnow/create-parcel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          })

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            alert(data.error ?? 'Грешка при създаване на BoxNow пратка')
            return
          }

          window.location.reload()
        })
      }}
    >
      {isPending ? 'Изпращане...' : 'Изпрати с BoxNow'}
    </Button>
  )
}

export function ShipWithEcontButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch('/api/econt/create-label', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          })

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            alert(data.error ?? 'Грешка при създаване на пратка')
            return
          }

          window.location.reload()
        })
      }}
    >
      {isPending ? 'Изпращане...' : 'Изпрати с Еконт'}
    </Button>
  )
}
