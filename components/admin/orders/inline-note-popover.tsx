'use client'

import { useState, useTransition } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { updateAdminNotes } from '@/app/admin/orders/actions'
import { StickyNote } from 'lucide-react'

interface Props {
  orderId: string
  customerNote: string | null
  initialAdminNotes: string
}

export function InlineNotePopover({
  orderId,
  customerNote,
  initialAdminNotes,
}: Props) {
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes)
  const [savedAdminNotes, setSavedAdminNotes] = useState(initialAdminNotes)
  const [justSaved, setJustSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hasCustomerNote = !!customerNote?.trim()
  const hasAdminNotes = !!savedAdminNotes.trim()
  const hasAnyNote = hasCustomerNote || hasAdminNotes
  const isDirty = adminNotes !== savedAdminNotes

  function handleSave() {
    startTransition(async () => {
      await updateAdminNotes(orderId, adminNotes)
      setSavedAdminNotes(adminNotes)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1500)
    })
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={hasAnyNote ? 'Виж бележка' : 'Добави бележка'}
            className={
              'inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent ' +
              (hasAnyNote
                ? 'text-amber-500'
                : 'text-muted-foreground hover:text-foreground')
            }
          />
        }
      >
        <StickyNote
          className="size-4"
          fill={hasAnyNote ? 'currentColor' : 'none'}
          fillOpacity={hasAnyNote ? 0.2 : 0}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground">
            Бележка от клиента
          </h3>
          {hasCustomerNote ? (
            <p className="mt-1.5 whitespace-pre-wrap rounded-md border border-dashed border-border bg-background/50 p-2.5 text-sm">
              {customerNote}
            </p>
          ) : (
            <p className="mt-1.5 text-xs italic text-muted-foreground">
              Няма бележка от клиента.
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground">
            Вътрешни бележки
          </h3>
          <textarea
            className="mt-1.5 w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            rows={4}
            placeholder="Бележки за екипа..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              disabled={isPending || !isDirty}
              onClick={handleSave}
            >
              {isPending ? 'Запазване...' : 'Запази'}
            </Button>
            {justSaved && (
              <span className="text-xs text-green-500">Запазено</span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
