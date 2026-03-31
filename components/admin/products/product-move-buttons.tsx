'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { moveProduct } from '@/app/(admin)/products/actions'

export function ProductMoveButtons({
  id,
  isFirst,
  isLast,
}: {
  id: string
  isFirst: boolean
  isLast: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-0.5">
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={isFirst || isPending}
        onClick={() => startTransition(() => moveProduct(id, 'up'))}
      >
        <ArrowUp className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={isLast || isPending}
        onClick={() => startTransition(() => moveProduct(id, 'down'))}
      >
        <ArrowDown className="size-3" />
      </Button>
    </div>
  )
}
