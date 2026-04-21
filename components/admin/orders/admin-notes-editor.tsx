'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateAdminNotes } from '@/app/admin/orders/actions'

interface Props {
  orderId: string
  initial: string
  customerNote: string | null
  paymentMethod: string | null
  promoCode: string | null
  officeId: string | null
  boxnowId: string | null
}

export function AdminNotesEditor({
  orderId,
  initial,
  customerNote,
  paymentMethod,
  promoCode,
  officeId,
  boxnowId,
}: Props) {
  const [notes, setNotes] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateAdminNotes(orderId, notes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const badges: { label: string; value: string }[] = []
  if (paymentMethod) badges.push({ label: 'Плащане', value: paymentMethod === 'COD' ? 'Наложен платеж' : 'Карта' })
  if (promoCode) badges.push({ label: 'Промо', value: promoCode })
  if (officeId) badges.push({ label: 'Офис', value: `#${officeId}` })
  if (boxnowId) badges.push({ label: 'BoxNow', value: boxnowId })

  return (
    <div className="space-y-4">
      {/* Customer note (read-only, prominent) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Бележка от клиента</h2>
        {customerNote ? (
          <p className="mt-3 whitespace-pre-wrap rounded-md border border-dashed border-border bg-background/50 p-3 text-sm">
            {customerNote}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Клиентът не е оставил бележка.</p>
        )}

        {badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.label}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
              >
                <span className="font-medium text-foreground">{b.label}:</span> {b.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Admin notes (editable) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Вътрешни бележки</h2>
        <div className="mt-4 space-y-3">
          <textarea
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            rows={4}
            placeholder="Бележки за екипа..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={isPending} onClick={handleSave}>
              {isPending ? 'Запазване...' : 'Запази'}
            </Button>
            {saved && <span className="text-sm text-green-500">Запазено</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
