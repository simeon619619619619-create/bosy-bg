'use client'

import { useState, useEffect } from 'react'

const MESSAGES = [
  'Безплатна доставка за поръчки над 69.99€',
  '0 захар, 100% удоволствие',
  'BOSY Club — трупай точки с всяка поръчка',
]

export function AnnouncementBar() {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length)
        setFade(true)
      }, 300)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className="flex items-center justify-center text-center"
      style={{ background: '#c77dba', color: '#fff', height: 40, padding: '0 16px' }}
    >
      <span
        className="text-[13px] font-medium transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {MESSAGES[index]}
      </span>
    </div>
  )
}
