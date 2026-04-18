'use client'

import { useState } from 'react'
import { GripVertical, Plus, X, Save, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  slug: string
  name: string
  price: number
  images: string[] | null
  category: string | null
}

export function HomepageEditor({
  allProducts,
  currentSlugs,
  settingId,
}: {
  allProducts: Product[]
  currentSlugs: string[]
  settingId: string | null
}) {
  const [slugs, setSlugs] = useState<string[]>(currentSlugs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const productMap = Object.fromEntries(allProducts.map((p) => [p.slug, p]))
  const selectedProducts = slugs.map((s) => productMap[s]).filter(Boolean)
  const available = allProducts.filter((p) => !slugs.includes(p.slug))

  const moveUp = (i: number) => {
    if (i === 0) return
    const next = [...slugs]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    setSlugs(next)
    setSaved(false)
  }

  const moveDown = (i: number) => {
    if (i === slugs.length - 1) return
    const next = [...slugs]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    setSlugs(next)
    setSaved(false)
  }

  const remove = (slug: string) => {
    setSlugs(slugs.filter((s) => s !== slug))
    setSaved(false)
  }

  const add = (slug: string) => {
    setSlugs([...slugs, slug])
    setSaved(false)
  }

  const handleDragStart = (i: number) => setDragIdx(i)
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    const next = [...slugs]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setSlugs(next)
    setDragIdx(i)
    setSaved(false)
  }
  const handleDragEnd = () => setDragIdx(null)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    if (settingId) {
      await supabase
        .from('content_blocks')
        .update({ body: JSON.stringify(slugs) })
        .eq('id', settingId)
    } else {
      await supabase.from('content_blocks').insert({
        type: 'setting',
        title: 'homepage_featured_slugs',
        body: JSON.stringify(slugs),
      })
    }

    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Selected products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Избрани ({selectedProducts.length})
          </h2>
          <div className="flex gap-2">
            <a
              href="https://bosy.bg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
            >
              <Eye size={14} /> Преглед
            </a>
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

        <div className="space-y-2">
          {selectedProducts.map((p, i) => (
            <div
              key={p.slug}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="flex items-center gap-3 rounded-xl border bg-white p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
              style={{
                opacity: dragIdx === i ? 0.5 : 1,
                borderColor: '#e5e7eb',
              }}
            >
              <GripVertical size={16} className="text-gray-300 shrink-0" />
              <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
              {p.images?.[0] && (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.category} · {(p.price / 1.95583).toFixed(2)}€</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="rounded p-1 hover:bg-gray-100 disabled:opacity-20"
                  title="Нагоре"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === slugs.length - 1}
                  className="rounded p-1 hover:bg-gray-100 disabled:opacity-20"
                  title="Надолу"
                >
                  ▼
                </button>
                <button
                  onClick={() => remove(p.slug)}
                  className="rounded p-1 text-red-400 hover:bg-red-50"
                  title="Премахни"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
          {selectedProducts.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Няма избрани продукти. Добави от списъка вдясно.
            </p>
          )}
        </div>
      </div>

      {/* Available products */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Налични продукти ({available.length})
        </h2>
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {available.map((p) => (
            <div
              key={p.slug}
              className="flex items-center gap-3 rounded-lg border border-dashed p-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#e5e7eb' }}
            >
              {p.images?.[0] && (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="h-8 w-8 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.category}</p>
              </div>
              <button
                onClick={() => add(p.slug)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium hover:bg-gray-100"
                style={{ color: '#c77dba' }}
              >
                <Plus size={14} /> Добави
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
