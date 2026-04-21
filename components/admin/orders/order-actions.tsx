'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { confirmOrder, cancelOrder, markShippedManually } from '@/app/admin/orders/actions'

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

export function ShipWithBoxNowButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        const tracking = window.prompt(
          'Въведи BoxNow tracking номер (по желание, от BoxNow портала):',
          ''
        )
        // Cancelled prompt
        if (tracking === null) return

        startTransition(async () => {
          try {
            await markShippedManually(orderId, tracking.trim() || null)
          } catch (e) {
            alert(e instanceof Error ? e.message : 'Грешка при маркиране')
          }
        })
      }}
    >
      {isPending ? 'Обработка...' : 'Маркирай като изпратена (BoxNow)'}
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
