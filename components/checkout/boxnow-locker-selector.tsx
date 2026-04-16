'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [showWidget, setShowWidget] = useState(false)

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
      setShowWidget(false)
    },
    [onSelect]
  )

  useEffect(() => {
    if (!showWidget) return
    if (typeof window === 'undefined') return

    window._bn_map_widget_config = {
      parentElement: '#boxnow-map-container',
      type: 'inline',
      afterSelect: handleSelect,
    }

    if (loaded) return

    const script = document.createElement('script')
    script.src = 'https://widget-cdn.boxnow.bg/map-widget/client/v5.js'
    script.async = true
    script.defer = true
    script.onload = () => setLoaded(true)
    document.head.appendChild(script)

    return () => {}
  }, [showWidget, loaded, handleSelect])

  return (
    <div>
      {selected ? (
        <div
          className="rounded-lg border p-3 text-xs"
          style={{
            borderColor: '#4caf50',
            backgroundColor: '#f0fdf4',
            color: '#166534',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">
                Избран автомат: {selected.name}
              </p>
              {selected.address && (
                <p className="mt-0.5">{selected.address}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowWidget(true)
              }}
              className="shrink-0 text-xs font-semibold underline"
              style={{ color: '#4caf50' }}
            >
              Промени
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowWidget(true)}
          className="w-full rounded-lg border-2 border-dashed px-4 py-4 text-center text-sm font-semibold transition-colors hover:border-[#4caf50] hover:bg-[#f0fdf4]"
          style={{ borderColor: '#d1d5db', color: '#333' }}
        >
          Избери автомат на BoxNow
        </button>
      )}

      {showWidget && (
        <div className="mt-3">
          <div
            id="boxnow-map-container"
            ref={containerRef}
            className="overflow-hidden rounded-lg border"
            style={{
              height: 420,
              borderColor: '#d1d5db',
            }}
          />
        </div>
      )}
    </div>
  )
}
