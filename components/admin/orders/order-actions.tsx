'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { confirmOrder, cancelOrder } from '@/app/(admin)/orders/actions'

export function ConfirmOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await confirmOrder(orderId)
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
