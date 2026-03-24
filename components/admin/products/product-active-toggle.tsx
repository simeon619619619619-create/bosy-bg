'use client'

import { useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { toggleProductActive } from '@/app/(admin)/products/actions'

export function ProductActiveToggle({
  id,
  isActive,
}: {
  id: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Switch
      checked={isActive}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          await toggleProductActive(id, checked)
        })
      }}
      disabled={isPending}
      size="sm"
    />
  )
}
