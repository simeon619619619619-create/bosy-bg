'use client'

import { useState } from 'react'
import { Plus, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface Badge {
  text: string
  bg: string
  x: number // percent from left (0-100)
  y: number // percent from top (0-100)
}

const PRESET_COLORS = [
  { label: 'Червен', value: '#e63946' },
  { label: 'Розово злато', value: 'linear-gradient(135deg, #c77dba, #e8a0bf)' },
  { label: 'Злато', value: 'linear-gradient(135deg, #b8860b, #d4a853)' },
  { label: 'Тъмен', value: '#333' },
  { label: 'Лилав', value: '#c77dba' },
  { label: 'Зелен', value: '#22c55e' },
]

export function BadgeEditor({
  productId,
  productImage,
  initialBadges,
}: {
  productId: string
  productImage: string | null
  initialBadges: Badge[]
}) {
  const [badges, setBadges] = useState<Badge[]>(initialBadges)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const addBadge = () => {
    setBadges([...badges, { text: 'NEW', bg: '#e63946', x: 10, y: 10 }])
    setSaved(false)
  }

  const removeBadge = (i: number) => {
    setBadges(badges.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  const updateBadge = (i: number, field: keyof Badge, value: string | number) => {
    const next = [...badges]
    next[i] = { ...next[i], [field]: value }
    setBadges(next)
    setSaved(false)
  }

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragIdx === null) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    updateBadge(dragIdx, 'x', Math.max(5, Math.min(95, x)))
    updateBadge(dragIdx, 'y', Math.max(5, Math.min(95, y)))
    setDragIdx(null)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    // Read current variants
    const { data: product } = await supabase
      .from('products')
      .select('variants')
      .eq('id', productId)
      .single()

    const variants = (product?.variants as Record<string, unknown>) ?? {}
    variants.card_badges = badges

    await supabase
      .from('products')
      .update({ variants })
      .eq('id', productId)

    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="mt-8 rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Етикети върху снимката</h3>
        <div className="flex gap-2">
          <button
            onClick={addBadge}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
          >
            <Plus size={14} /> Добави
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            style={{ background: saved ? '#22c55e' : '#c77dba' }}
          >
            <Save size={14} />
            {saving ? 'Запазване...' : saved ? 'Запазено!' : 'Запази'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div>
          <p className="text-xs text-gray-500 mb-2">
            {dragIdx !== null
              ? 'Кликни върху снимката за да позиционираш етикета'
              : 'Преглед'}
          </p>
          <div
            className="relative rounded-xl overflow-hidden border"
            style={{
              width: '100%',
              aspectRatio: '1',
              background: '#fff',
              cursor: dragIdx !== null ? 'crosshair' : 'default',
            }}
            onClick={handlePreviewClick}
          >
            {productImage && (
              <img
                src={productImage}
                alt="Product"
                className="w-full h-full object-contain p-4"
              />
            )}
            {badges.map((b, i) => (
              <span
                key={i}
                className="absolute rounded-md px-2.5 py-1 text-xs font-bold text-white whitespace-nowrap"
                style={{
                  background: b.bg,
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: dragIdx === i ? '2px solid #fff' : 'none',
                  outline: dragIdx === i ? '2px solid #c77dba' : 'none',
                }}
              >
                {b.text}
              </span>
            ))}
          </div>
        </div>

        {/* Badge list */}
        <div className="space-y-3">
          {badges.length === 0 && (
            <p className="text-sm text-gray-400 py-8 text-center">
              Няма етикети. Натисни &quot;Добави&quot; за да създадеш.
            </p>
          )}
          {badges.map((b, i) => (
            <div
              key={i}
              className="rounded-lg border p-3 space-y-3"
              style={{ borderColor: dragIdx === i ? '#c77dba' : '#e5e7eb' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Етикет {i + 1}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDragIdx(dragIdx === i ? null : i)}
                    className="rounded px-2 py-1 text-xs font-medium"
                    style={{
                      background: dragIdx === i ? '#c77dba' : '#f3f4f6',
                      color: dragIdx === i ? '#fff' : '#666',
                    }}
                  >
                    {dragIdx === i ? 'Позициониране...' : 'Позиция'}
                  </button>
                  <button
                    onClick={() => removeBadge(i)}
                    className="rounded p-1 text-red-400 hover:bg-red-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Текст</label>
                <input
                  type="text"
                  value={b.text}
                  onChange={(e) => updateBadge(i, 'text', e.target.value)}
                  className="w-full rounded border px-2 py-1 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Цвят</label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => updateBadge(i, 'bg', c.value)}
                      className="rounded-md px-2 py-1 text-[10px] font-bold text-white"
                      style={{
                        background: c.value,
                        outline: b.bg === c.value ? '2px solid #333' : 'none',
                        outlineOffset: 1,
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
