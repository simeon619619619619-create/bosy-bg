'use client'

export function AnnouncementBar() {
  return (
    <div
      className="overflow-hidden flex items-center relative"
      style={{ background: 'linear-gradient(90deg, #a78bfa, #f472b6, #60a5fa, #a78bfa)', color: '#fff', height: 40 }}
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: 'bosy-scroll-left 20s linear infinite' }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="inline-block px-12 text-[13px] font-medium"
          >
            Безплатна доставка за поръчки над 25 &euro; &bull; BOSY Club отстъпки &bull; -5% при плащане с карта
          </span>
        ))}
      </div>
      <style>{`
        @keyframes bosy-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
