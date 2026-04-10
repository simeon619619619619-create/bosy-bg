'use client'

import { useState } from 'react'

interface Props {
  images: string[]
  name: string
}

export function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div
        className="flex items-center justify-center overflow-hidden rounded-xl p-8"
        style={{
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          minHeight: '400px',
        }}
      >
        <div className="flex h-full w-full items-center justify-center text-gray-400">
          Няма снимка
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="flex items-center justify-center overflow-hidden rounded-xl p-8"
        style={{
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          minHeight: '400px',
        }}
      >
        <img
          src={images[active]}
          alt={`${name} - ${active + 1}`}
          className="max-h-[450px] w-auto object-contain"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="flex-shrink-0 cursor-pointer overflow-hidden rounded-lg transition-all"
              style={{
                width: '72px',
                height: '72px',
                border: i === active ? '2px solid #c77dba' : '2px solid #e5e5e5',
                opacity: i === active ? 1 : 0.7,
                background: '#fff',
              }}
            >
              <img
                src={img}
                alt={`${name} thumbnail ${i + 1}`}
                className="h-full w-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
