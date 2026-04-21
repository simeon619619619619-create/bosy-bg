'use client'

import { useState, useTransition } from 'react'
import { updateCourier } from '@/app/admin/orders/actions'

type Courier = 'speedy' | 'econt' | 'boxnow'

interface Props {
  orderId: string
  initial: Courier
  locked: boolean
}

const LABELS: Record<Courier, string> = {
  speedy: 'Speedy',
  econt: 'Еконт',
  boxnow: 'BoxNow',
}

export function CourierSelector({ orderId, initial, locked }: Props) {
  const [current, setCurrent] = useState<Courier>(initial)
  const [isPending, startTransition] = useTransition()

  function handleChange(next: Courier) {
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

  const options: Courier[] = ['speedy', 'econt', 'boxnow']

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Куриер</h2>
        {isPending && <span className="text-xs text-muted-foreground">Запазване...</span>}
      </div>
      {locked ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Поръчката е вече изпратена — куриерът не може да се сменя.
          Текущ: <span className="font-medium text-foreground">{LABELS[current]}</span>
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {options.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleChange(c)}
              className={`rounded-md border px-3 py-2 text-sm transition ${
                current === c
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {LABELS[c]}
            </button>
          ))}
        </div>
      )}
      {current === 'boxnow' && !locked && (
        <p className="mt-3 text-xs text-muted-foreground">
          BoxNow пратките се изпращат чрез Speedy API към BoxNow автомат.
          Уверете се, че в &quot;Адрес за доставка&quot; е избран BoxNow и има locker ID.
        </p>
      )}
    </div>
  )
}
