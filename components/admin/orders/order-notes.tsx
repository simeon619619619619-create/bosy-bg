'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateOrderNotes } from '@/app/admin/orders/actions'

export function OrderNotes({ orderId, initialNotes }: { orderId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    startTransition(async () => {
      await updateOrderNotes(orderId, notes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Бележки</h2>
      <div className="mt-4 space-y-3">
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={4}
          placeholder="Добави бележка..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? 'Запазване...' : 'Запази'}
          </Button>
          {saved && (
            <span className="text-sm text-green-500">Запазено</span>
          )}
        </div>
      </div>
    </div>
  )
}
