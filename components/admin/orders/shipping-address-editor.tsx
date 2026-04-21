'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateShippingAddress, type ShippingAddressInput } from '@/app/admin/orders/actions'

interface Props {
  orderId: string
  initial: Partial<ShippingAddressInput> | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
}

export function ShippingAddressEditor({ orderId, initial, customerName, customerPhone, customerEmail }: Props) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<ShippingAddressInput>({
    name: initial?.name ?? customerName,
    phone: initial?.phone ?? customerPhone,
    email: initial?.email ?? customerEmail,
    street: initial?.street ?? '',
    city: initial?.city ?? '',
    zip: initial?.zip ?? '',
    delivery_type: initial?.delivery_type ?? 'address',
    speedy_office_id: initial?.speedy_office_id ?? null,
    boxnow_locker_id: initial?.boxnow_locker_id ?? null,
  })

  function handleSave() {
    startTransition(async () => {
      await updateShippingAddress(orderId, form)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const deliveryLabel =
    form.delivery_type === 'office'
      ? `Офис Speedy${form.speedy_office_id ? ` #${form.speedy_office_id}` : ''}`
      : form.delivery_type === 'boxnow'
        ? `BoxNow${form.boxnow_locker_id ? ` ${form.boxnow_locker_id}` : ''}`
        : 'Адрес'

  if (!editing) {
    const parts = [form.street, form.city, form.zip].filter(Boolean).join(', ')
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Адрес за доставка</h2>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-primary hover:underline"
          >
            Редактирай
          </button>
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <p><span className="text-muted-foreground">Получател: </span>{form.name || '—'}</p>
          <p><span className="text-muted-foreground">Телефон: </span>{form.phone || '—'}</p>
          <p><span className="text-muted-foreground">Вид: </span>{deliveryLabel}</p>
          <p><span className="text-muted-foreground">Адрес: </span>{parts || '—'}</p>
          {saved && <p className="text-xs text-green-500">Запазено</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Редакция на адрес</h2>
      <div className="mt-4 grid gap-3 text-sm">
        <label className="grid gap-1">
          <span className="text-muted-foreground">Получател</span>
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-muted-foreground">Телефон</span>
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-muted-foreground">Вид доставка</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.delivery_type ?? 'address'}
            onChange={(e) => setForm({ ...form, delivery_type: e.target.value as 'address' | 'office' | 'boxnow' })}
          >
            <option value="address">До адрес</option>
            <option value="office">До офис Speedy</option>
            <option value="boxnow">До BoxNow автомат</option>
          </select>
        </label>
        {form.delivery_type === 'office' && (
          <label className="grid gap-1">
            <span className="text-muted-foreground">ID на офис Speedy</span>
            <input
              type="number"
              className="rounded-md border border-border bg-background px-3 py-2"
              value={form.speedy_office_id ?? ''}
              onChange={(e) => setForm({ ...form, speedy_office_id: e.target.value ? Number(e.target.value) : null })}
            />
          </label>
        )}
        {form.delivery_type === 'boxnow' && (
          <label className="grid gap-1">
            <span className="text-muted-foreground">BoxNow locker ID</span>
            <input
              className="rounded-md border border-border bg-background px-3 py-2"
              value={form.boxnow_locker_id ?? ''}
              onChange={(e) => setForm({ ...form, boxnow_locker_id: e.target.value || null })}
            />
          </label>
        )}
        <label className="grid gap-1">
          <span className="text-muted-foreground">Улица / адрес</span>
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-muted-foreground">Град</span>
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-muted-foreground">Пощенски код</span>
          <input
            className="rounded-md border border-border bg-background px-3 py-2"
            value={form.zip}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
          />
        </label>
        <div className="flex gap-2">
          <Button size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? 'Запазване...' : 'Запази'}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => setEditing(false)}>
            Отказ
          </Button>
        </div>
      </div>
    </div>
  )
}
