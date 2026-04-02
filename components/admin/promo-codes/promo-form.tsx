'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createPromoCode } from '@/app/admin/promo-codes/actions'

export function PromoCodeForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      await createPromoCode(formData)
      router.push('/admin/promo-codes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Код *</label>
        <input
          name="code"
          required
          placeholder="SUMMER20"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm uppercase"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Тип отстъпка *</label>
          <select name="discount_type" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="percent">Процент (%)</option>
            <option value="fixed">Фиксирана (BGN)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Стойност *</label>
          <input
            name="discount_value"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="10"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Мин. поръчка (BGN)</label>
          <input
            name="min_order_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Макс. използвания</label>
          <input
            name="max_uses"
            type="number"
            min="1"
            placeholder="Без лимит"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Изтича на</label>
        <input
          name="expires_at"
          type="datetime-local"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Запазване...' : 'Създай промо код'}
        </Button>
        <Button type="button" variant="outline" render={<a href="/admin/promo-codes" />}>
          Отказ
        </Button>
      </div>
    </form>
  )
}
