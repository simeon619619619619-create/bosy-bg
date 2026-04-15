'use client'

import { useEffect, useState } from 'react'
import { MapPin, Clock, Search } from 'lucide-react'

interface Office {
  id: number
  name: string
  address: string
  workingTime: string
  isAutomat?: boolean
}

interface Props {
  onSelect: (office: Office) => void
  selectedOfficeId?: number | null
  initialCity?: string
}

export function EcontOfficeSelector({
  onSelect,
  selectedOfficeId,
  initialCity = '',
}: Props) {
  const [city, setCity] = useState(initialCity)
  const [offices, setOffices] = useState<Office[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function searchOffices(q: string) {
    if (q.trim().length < 2) {
      setOffices([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/econt/offices?city=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setOffices([])
      } else {
        setOffices(data.offices || [])
      }
    } catch {
      setError('Грешка при зареждане на офисите')
      setOffices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => searchOffices(city), 400)
    return () => clearTimeout(t)
  }, [city])

  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-medium"
        style={{ color: '#4a3728' }}
      >
        Търсене на град / квартал <span style={{ color: '#dc2626' }}>*</span>
      </label>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: '#9ca3af' }}
        />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="напр. софия, или софия младост"
          className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#c77dba]"
          style={{
            backgroundColor: '#f5f5f5',
            borderColor: '#d1d5db',
            color: '#111',
          }}
        />
      </div>

      <div className="mt-3">
        {loading && (
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Зареждане на офисите...
          </p>
        )}
        {error && (
          <p className="text-xs" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}
        {!loading && !error && city.length >= 2 && offices.length === 0 && (
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Няма намерени офиси в този град.
          </p>
        )}

        {offices.length > 0 && (
          <>
            <p
              className="mb-2 text-xs font-medium"
              style={{ color: '#4a3728' }}
            >
              Изберете офис ({offices.length}):
            </p>
            <div
              className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-2"
              style={{ borderColor: '#d1d5db', backgroundColor: '#fafafa' }}
            >
              {offices.map((office) => {
                const isSelected = selectedOfficeId === office.id
                return (
                  <button
                    key={office.id}
                    type="button"
                    onClick={() => onSelect(office)}
                    className="w-full rounded-md border p-3 text-left text-xs transition-all"
                    style={{
                      borderColor: isSelected ? '#c77dba' : '#e5e7eb',
                      backgroundColor: isSelected ? '#f0fdf4' : '#fff',
                      borderWidth: isSelected ? '2px' : '1px',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        style={{ color: isSelected ? '#c77dba' : '#9ca3af' }}
                      />
                      <div className="flex-1">
                        <p
                          className="font-semibold"
                          style={{ color: '#111' }}
                        >
                          {office.name}
                          {office.isAutomat && (
                            <span
                              className="ml-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ background: '#fef3c7', color: '#b45309' }}
                            >
                              АВТОМАТ
                            </span>
                          )}
                        </p>
                        {office.address && (
                          <p className="mt-0.5" style={{ color: '#6b7280' }}>
                            {office.address}
                          </p>
                        )}
                        {office.workingTime && (
                          <p
                            className="mt-1 flex items-center gap-1"
                            style={{ color: '#9ca3af' }}
                          >
                            <Clock className="h-3 w-3" />
                            {office.workingTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
