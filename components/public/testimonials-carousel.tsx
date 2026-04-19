'use client'

import { useEffect, useRef, useCallback } from 'react'

type Testimonial = {
  name: string
  photo: string
  text: string
}

export function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)
  const touchRef = useRef(false)

  const scrollNext = useCallback(() => {
    const el = ref.current
    if (!el || touchRef.current) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) return
    if (el.scrollLeft >= maxScroll - 10) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      // Scroll by one card width
      const card = el.firstElementChild as HTMLElement | null
      const step = (card?.offsetWidth ?? 280) + 24
      el.scrollBy({ left: step, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    timerRef.current = setInterval(scrollNext, 3000)

    const pause = () => {
      touchRef.current = true
      if (timerRef.current) clearInterval(timerRef.current)
    }
    const resume = () => {
      touchRef.current = false
      timerRef.current = setInterval(scrollNext, 3000)
    }

    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('mouseenter', pause)
    el.addEventListener('touchend', () => setTimeout(resume, 3000), { passive: true })
    el.addEventListener('mouseleave', () => setTimeout(resume, 1000))

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
    }
  }, [scrollNext])

  return (
    <div
      ref={ref}
      className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {items.map((t) => (
        <figure
          key={t.name}
          className="rounded-2xl p-5 md:p-6 flex flex-col items-center text-center snap-center shrink-0"
          style={{
            background: '#fdf5f0',
            border: '1px solid #f3e6dc',
            width: '75vw',
            maxWidth: '280px',
          }}
        >
          <img
            src={t.photo}
            alt={t.name}
            className="mb-3 md:mb-4 h-14 w-14 md:h-16 md:w-16 rounded-full object-cover"
          />
          <figcaption
            className="mb-2 md:mb-3 text-sm font-bold"
            style={{ color: '#333' }}
          >
            {t.name}
          </figcaption>
          <blockquote
            className="text-xs md:text-sm leading-relaxed italic"
            style={{ color: '#555' }}
          >
            &ldquo;{t.text}&rdquo;
          </blockquote>
        </figure>
      ))}
    </div>
  )
}
