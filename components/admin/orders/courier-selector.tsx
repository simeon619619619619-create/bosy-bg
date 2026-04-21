'use client'

import { useState, useTransition } from 'react'
import { updateCourier } from '@/app/admin/orders/actions'

interface Props {
  orderId: string
  initial: 'speedy' | 'econt'
  locked: boolean
}

export function CourierSelector({ orderId, initial, locked }: Props) {
  const [current, setCurrent] = useState<'speedy' | 'econt'>(initial)
  const [isPending, startTransition] = useTransition()

  function handleChange(next: 'speedy' | 'econt') {
    if (next === current || locked) return
    const prev = current
    setCurrent(next)
    startTransition(async () => {
      try {
        await updateCourier(orderId, next)
      } catch {
        setCurrent(prev)
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Куриер</h2>
        {isPending && <span className="text-xs text-muted-foreground">Запазване...</span>}
      </div>
      {locked ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Поръчката е вече изпратена — куриерът не може да се сменя.
          Текущ: <span className="font-medium text-foreground">{current === 'econt' ? 'Еконт' : 'Speedy'}</span>
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleChange('speedy')}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              current === 'speedy'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            Speedy
          </button>
          <button
            type="button"
            onClick={() => handleChange('econt')}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              current === 'econt'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            Еконт
          </button>
        </div>
      )}
    </div>
  )
}
