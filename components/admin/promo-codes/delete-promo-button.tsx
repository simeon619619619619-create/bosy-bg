'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deletePromoCode } from '@/app/admin/promo-codes/actions'

export function DeletePromoButton({ id, code }: { id: string; code: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Изтрий промо код "${code}"?`)) return
    setLoading(true)
    try {
      await deletePromoCode(id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
      title="Изтрий"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
