'use client'

import { useEffect, useState } from 'react'
import { MapPin, Clock, Search } from 'lucide-react'

export interface SpeedyOfficeHit {
  id: number
  name: string
  address: string
  workingTime: string
}

export interface EcontOfficeHit {
  id: number
  name: string
  address: string
  workingTime: string
  isAutomat?: boolean
}

export interface BoxNowLockerHit {
  id: string
  name: string
  addressLine1: string
  postalCode: string
  city?: string
}

type OfficeKind = 'speedy' | 'econt' | 'boxnow'

interface Props {
  kind: OfficeKind
  selectedId: string | number | null
  initialCity?: string
  onSelect: (id: string | number, label: string) => void
}

export function OfficePicker({ kind, selectedId, initialCity = '', onSelect }: Props) {
  const [query, setQuery] = useState(initialCity)
  const [hits, setHits] = useState<
    SpeedyOfficeHit[] | EcontOfficeHit[] | BoxNowLockerHit[]
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setError(null)
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const url =
          kind === 'speedy'
            ? `/api/speedy/offices?city=${encodeURIComponent(q)}`
            : kind === 'econt'
              ? `/api/econt/offices?city=${encodeURIComponent(q)}`
              : `/api/boxnow/lockers?city=${encodeURIComponent(q)}`
        const res = await fetch(url)
        const data = await res.json()
        if (data.error) {
          setError(data.error)
          setHits([])
        } else if (kind === 'boxnow') {
          setHits(data.lockers || [])
        } else {
          setHits(data.offices || [])
        }
      } catch {
        setError('Грешка при зареждане')
        setHits([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [query, kind])

  const placeholder =
    kind === 'boxnow'
      ? 'Град или пощенски код (напр. 1000, Пловдив)'
      : 'напр. София, Пловдив, Бургас'

  return (
    <div className="grid gap-2">
      <label className="text-xs text-muted-foreground">
        {kind === 'boxnow' ? 'Търси BoxNow автомат' : 'Търси офис по град'}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-border bg-background px-3 py-2 pl-10 text-sm outline-none focus:border-primary"
        />
      </div>
      {loading && <p className="text-xs text-muted-foreground">Зареждане...</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!loading && !error && query.trim().length >= 2 && hits.length === 0 && (
        <p className="text-xs text-muted-foreground">Няма намерени резултати.</p>
      )}
      {hits.length > 0 && (
        <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-md border border-border p-2">
          {hits.map((h) => {
            const id =
              kind === 'boxnow'
                ? (h as BoxNowLockerHit).id
                : (h as SpeedyOfficeHit | EcontOfficeHit).id
            const isSelected = String(selectedId ?? '') === String(id)
            const name =
              kind === 'boxnow'
                ? (h as BoxNowLockerHit).name
                : (h as SpeedyOfficeHit | EcontOfficeHit).name
            const address =
              kind === 'boxnow'
                ? [
                    (h as BoxNowLockerHit).addressLine1,
                    (h as BoxNowLockerHit).city,
                    (h as BoxNowLockerHit).postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ')
                : (h as SpeedyOfficeHit | EcontOfficeHit).address
            const workingTime =
              kind === 'boxnow'
                ? ''
                : (h as SpeedyOfficeHit | EcontOfficeHit).workingTime
            const label = `${name}${address ? ` · ${address}` : ''}`
            return (
              <button
                key={String(id)}
                type="button"
                onClick={() => onSelect(id, label)}
                className={`w-full rounded-md border p-2.5 text-left text-xs transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/60'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-semibold">{name}</p>
                    {address && (
                      <p className="mt-0.5 text-muted-foreground">{address}</p>
                    )}
                    {workingTime && (
                      <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {workingTime}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
