'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

const STEPS = [
  'Нов клиент',
  'Контактуван',
  'Не вдига',
  'Заинтересован',
  'Поръчка направена',
  'Повторна поръчка',
  'VIP клиент',
]

export function SalesProcess({
  customerId,
  currentStep,
}: {
  customerId: string
  currentStep: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeStep, setActiveStep] = useState(currentStep)

  const currentIdx = activeStep ? STEPS.indexOf(activeStep) : -1

  async function handleClick(step: string) {
    const newStep = step === activeStep ? null : step
    setActiveStep(newStep)

    const res = await fetch(`/api/customer/sales-step`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, salesStep: newStep }),
    })

    if (res.ok) {
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4">
        Sales Process
      </h2>
      <div className="space-y-1">
        {STEPS.map((step, idx) => {
          const isCompleted = currentIdx >= 0 && idx < currentIdx
          const isCurrent = step === activeStep
          const isAfter = currentIdx >= 0 ? idx > currentIdx : true

          return (
            <button
              key={step}
              onClick={() => handleClick(step)}
              disabled={isPending}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium
                transition-all duration-200
                ${isCurrent
                  ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                  : isCompleted
                    ? 'bg-green-500/10 text-green-400'
                    : 'text-muted-foreground hover:bg-muted/50'
                }
              `}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin opacity-50" />
              ) : isCompleted ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              ) : isCurrent ? (
                <div className="h-5 w-5 shrink-0 rounded-full border-[3px] border-amber-500 bg-amber-500/30" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 opacity-40" />
              )}
              {step}
            </button>
          )
        })}
      </div>
    </div>
  )
}
