'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCashbackPercent } from '@/app/(admin)/settings/actions'

export function CashbackSettings({ currentPercent }: { currentPercent: number }) {
  const [percent, setPercent] = useState(currentPercent)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(false)
    startTransition(async () => {
      await updateCashbackPercent(percent)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Кешбак програма</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Процент от поръчката, който клиентът получава като кешбак за следваща покупка.
      </p>
      <div className="mt-4 flex items-end gap-4">
        <div className="w-32 space-y-2">
          <Label htmlFor="cashback_percent">Кешбак %</Label>
          <Input
            id="cashback_percent"
            type="number"
            min="0"
            max="30"
            step="1"
            value={percent}
            onChange={(e) => setPercent(Math.min(30, Math.max(0, Number(e.target.value))))}
          />
        </div>
        <Button onClick={handleSave} disabled={isPending || percent === currentPercent}>
          {isPending ? 'Запазване...' : 'Запази'}
        </Button>
        {saved && (
          <span className="text-sm text-green-500">Запазено!</span>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Пример: при 5% и поръчка за 100€, клиентът получава 5€ кешбак. Задай 0 за да изключиш.
      </p>
    </div>
  )
}
