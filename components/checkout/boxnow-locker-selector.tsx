'use client'

import { useEffect, useState, useCallback, useId } from 'react'
import { MapPin } from 'lucide-react'

interface SelectedLocker {
  id: string
  name: string
  address: string
  postalCode: string
}

interface Props {
  onSelect: (locker: SelectedLocker) => void
  selected?: SelectedLocker | null
}

declare global {
  interface Window {
    _bn_map_widget_config?: Record<string, unknown>
  }
}

export function BoxNowLockerSelector({ onSelect, selected }: Props) {
  const [city, setCity] = useState('')
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const uniqueId = useId()
  const btnClass = `boxnow-btn-${uniqueId.replace(/:/g, '')}`

  const handleSelect = useCallback(
    (data: {
      boxnowLockerId?: string
      boxnowLockerName?: string
      boxnowLockerAddressLine1?: string
      boxnowLockerPostalCode?: string
    }) => {
      onSelect({
        id: data.boxnowLockerId ?? '',
        name: data.boxnowLockerName ?? `BoxNow #${data.boxnowLockerId ?? ''}`,
        address: data.boxnowLockerAddressLine1 ?? '',
        postalCode: data.boxnowLockerPostalCode ?? '',
      })
    },
    [onSelect]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    window._bn_map_widget_config = {
      parentElement: '#boxnow-map-root',
      type: 'popup',
      gps: true,
      autoclose: true,
      zip: city.trim() || undefined,
      buttonSelector: `.${btnClass}`,
      afterSelect: handleSelect,
    }

    if (scriptLoaded) return

    const existing = document.querySelector('script[src*="boxnow"]')
    if (existing) {
      setScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://widget-cdn.boxnow.bg/map-widget/client/v5.js'
    script.async = true
    script.defer = true
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [city, scriptLoaded, handleSelect, btnClass])

  // Re-apply config when city changes (so zip updates for map centering)
  useEffect(() => {
    if (!scriptLoaded || typeof window === 'undefined') return
    window._bn_map_widget_config = {
      ...(window._bn_map_widget_config ?? {}),
      zip: city.trim() || undefined,
    }
  }, [city, scriptLoaded])

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#f5f5f5',
    borderColor: '#d1d5db',
    color: '#111',
  }

  return (
    <div>
      {/* City / address field for map centering */}
      <label
        className="mb-1.5 block text-xs font-medium"
        style={{ color: '#4a3728' }}
      >
        Населено място / адрес
      </label>
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="напр. София, Пловдив, Бургас..."
        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#4caf50]"
        style={inputStyle}
      />
      <p className="mt-1 text-[11px]" style={{ color: '#9ca3af' }}>
        Въведете града си за да намерим автомати наблизо
      </p>

      {/* Open map button */}
      <button
        type="button"
        className={`${btnClass} mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90`}
        style={{ background: '#4caf50' }}
      >
        <MapPin className="h-4 w-4" />
        Избери автомат от картата
      </button>

      {/* Hidden root for BoxNow widget */}
      <div id="boxnow-map-root" />

      {/* Selected locker info */}
      {selected && (
        <div
          className="mt-3 rounded-lg border p-3 text-xs"
          style={{
            borderColor: '#4caf50',
            backgroundColor: '#e8f5e9',
            color: '#1b5e20',
          }}
        >
          <p className="font-semibold">
            Избран автомат: {selected.name}
          </p>
          {selected.address && (
            <p className="mt-0.5">{selected.address}</p>
          )}
          {selected.postalCode && (
            <p className="mt-0.5">Пощ. код: {selected.postalCode}</p>
          )}
        </div>
      )}
    </div>
  )
}
