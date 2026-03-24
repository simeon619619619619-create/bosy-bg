'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { deleteUser } from '@/app/(admin)/settings/actions'

export function DeleteUserButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 data-icon="inline-start" />
        Изтрий
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изтриване на потребител</DialogTitle>
          <DialogDescription>
            Сигурни ли сте, че искате да изтриете &ldquo;{name}&rdquo;? Това
            действие е необратимо.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Отказ
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await deleteUser(id)
              })
            }}
          >
            {isPending ? 'Изтриване...' : 'Изтрий'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
