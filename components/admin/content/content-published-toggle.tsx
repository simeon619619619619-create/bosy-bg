'use client'

import { useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { togglePublished } from '@/app/admin/content/actions'

export function ContentPublishedToggle({
  id,
  isPublished,
}: {
  id: string
  isPublished: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Switch
      checked={isPublished}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          await togglePublished(id, checked)
        })
      }}
      disabled={isPending}
      size="sm"
    />
  )
}
