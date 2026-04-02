import Link from 'next/link'

export const metadata = {
  title: 'BOSY Club | BOSY Healthy Kitchen',
  description: 'Стани част от BOSY Club и получавай ексклузивни отстъпки, подаръци и безплатна доставка.',
}

const BENEFITS = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
        <path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
    title: 'Ексклузивни отстъпки',
    text: 'Получавай специални намаления до -20% на избрани продукти, достъпни само за членове на BOSY Club.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    title: 'Безплатна доставка',
    text: 'Безплатна доставка за всяка поръчка над 40 \u20AC за членовете на клуба.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: 'Точки за лоялност',
    text: 'Събирай точки с всяка покупка и ги използвай за отстъпки при следващите си поръчки.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Ранен достъп',
    text: 'Бъди сред първите, които ще опитат новите ни продукти преди всички останали.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Подаръци за рожден ден',
    text: 'Изненада за теб на рождения ти ден - специален подарък от BOSY.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Общност',
    text: 'Стани част от общността на BOSY и се свържи с хора, които споделят твоите ценности. Присъедини се към BOSY обществото във Founder Club!',
    link: 'https://www.founderclub.bg/community/bosy-club',
  },
]

const STEPS = [
  { num: 1, text: 'Създай безплатен акаунт на нашия сайт.' },
  { num: 2, text: 'Потвърди имейл адреса си.' },
  { num: 3, text: 'Започни да пазаруваш и събирай точки с всяка поръчка!' },
]

export default function BosyClubPage() {
  return (
    <>
      {/* Hero */}
      <section className="text-center" style={{ padding: '60px 20px 40px' }}>
        <h1
          className="text-3xl md:text-4xl font-extrabold mb-5"
          style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', letterSpacing: '-0.5px' }}
        >
          BOSY Club
        </h1>
        <div
          className="mx-auto rounded-xl text-center"
          style={{
            maxWidth: 700,
            background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
            color: '#fff',
            padding: '20px 30px',
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.6,
            boxShadow: '0 4px 20px rgba(97, 162, 41, 0.3)',
          }}
        >
          Стани член на <strong>BOSY Club</strong> и получи достъп до ексклузивни намаления и подаръци.
          <a
            href="https://www.founderclub.bg/community/bosy-club"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 rounded-full text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90"
            style={{
              background: '#fff',
              color: '#8b5cf6',
              padding: '12px 32px',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            ПРИСЪЕДИНИ СЕ &rarr;
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-5" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="mx-auto mb-5" style={{ width: 60, height: 3, background: '#a78bfa', borderRadius: 3 }} />
        <h2
          className="text-center text-2xl md:text-3xl font-bold mb-3"
          style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
        >
          Предимства на членството
        </h2>
        <p
          className="text-center mb-12 mx-auto"
          style={{ color: '#666', fontSize: 15, lineHeight: 1.75, maxWidth: 600 }}
        >
          Открий какво те очаква като член на BOSY Club.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="text-center rounded-2xl transition-transform hover:-translate-y-1"
              style={{
                background: '#fff',
                padding: '36px 28px',
                boxShadow: '0 3px 18px rgba(0,0,0,.05)',
              }}
            >
              <div
                className="mx-auto mb-4 flex items-center justify-center rounded-full"
                style={{ width: 72, height: 72, background: 'rgba(97,162,41,.1)' }}
              >
                {b.icon}
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {b.title}
              </h3>
              <p style={{ color: '#666', fontSize: '14.5px', lineHeight: 1.7 }}>{b.text}</p>
              {b.link && (
                <a
                  href={b.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 rounded-full text-xs font-bold uppercase tracking-wide transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #60a5fa 100%)',
                    color: '#fff',
                    padding: '10px 24px',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  }}
                >
                  БОСИ КЛУБ &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* How to join */}
      <section className="py-16 px-5" style={{ background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="mx-auto mb-5" style={{ width: 60, height: 3, background: '#a78bfa', borderRadius: 3 }} />
          <h2
            className="text-center text-2xl md:text-3xl font-bold mb-10"
            style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
          >
            Как да се присъединиш?
          </h2>
          <div className="flex flex-col gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full text-lg font-bold"
                  style={{
                    width: 48,
                    height: 48,
                    background: '#a78bfa',
                    color: '#fff',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  }}
                >
                  {s.num}
                </div>
                <p className="text-base pt-3" style={{ color: '#555', lineHeight: 1.7 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 text-center" style={{ background: '#fdf5f0' }}>
        <h2
          className="text-3xl font-extrabold mb-4"
          style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
        >
          Готов ли си?
        </h2>
        <p className="text-lg mb-8 mx-auto" style={{ color: '#555', maxWidth: 500 }}>
          Регистрирай се безплатно и започни да се възползваш от всички предимства на BOSY Club.
        </p>
        <Link
          href="/register"
          className="inline-block rounded-full font-bold text-[15px] uppercase tracking-wider transition-all duration-300 hover:opacity-90"
          style={{
            background: '#a78bfa',
            color: '#fff',
            padding: '16px 48px',
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          }}
        >
          Регистрация
        </Link>
      </section>
    </>
  )
}
