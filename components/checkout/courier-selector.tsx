'use client'

type Courier = 'speedy' | 'econt'

interface Props {
  value: Courier
  onChange: (c: Courier) => void
}

const COURIERS: Array<{
  id: Courier
  name: string
  logo: string
  subtitle: string
}> = [
  {
    id: 'speedy',
    name: 'Speedy',
    logo: 'S',
    subtitle: 'Доставка до офис или адрес',
  },
  {
    id: 'econt',
    name: 'Еконт',
    logo: 'E',
    subtitle: 'Доставка до офис или адрес',
  },
]

export function CourierSelector({ value, onChange }: Props) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-semibold"
        style={{ color: '#333' }}
      >
        Избери куриер <span style={{ color: '#dc2626' }}>*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {COURIERS.map((c) => {
          const active = value === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className="rounded-lg border p-3 text-left transition-all"
              style={{
                borderColor: active ? '#c77dba' : '#e5e7eb',
                backgroundColor: active ? '#f0fdf4' : '#fff',
                borderWidth: active ? '2px' : '1px',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
                  style={{
                    background:
                      c.id === 'speedy'
                        ? '#e30613'
                        : '#00a650',
                  }}
                >
                  {c.logo}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: '#111' }}
                  >
                    {c.name}
                  </p>
                  <p
                    className="mt-0.5 text-[11px] leading-tight"
                    style={{ color: '#6b7280' }}
                  >
                    {c.subtitle}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
