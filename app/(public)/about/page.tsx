export const metadata = {
  title: 'За нас — BOSY Healthy Kitchen',
  description:
    'Научете повече за BOSY Healthy Kitchen — българска марка за растителни протеинови десерти без добавена захар, глутен или лактоза. Нашата мисия за здравословно удоволствие.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'За нас | BOSY',
    description:
      'Българска марка за растителни протеинови десерти без захар, глутен и лактоза.',
    url: 'https://bosy.bg/about',
  },
}

const GOALS = [
  {
    num: 1,
    title: 'Качество без компромис',
    text: 'Грижлив подбор на съставки от доверени доставчици, за да гарантираме чистота и полезност във всеки продукт, който достига до вас.',
  },
  {
    num: 2,
    title: 'Здравословен начин на живот за всеки',
    text: 'Достъпни хранителни опции, създадени за хора с различни нужди и начин на живот, без да правите компромис с вкуса.',
  },
  {
    num: 3,
    title: 'Вдъхновяване на общността',
    text: 'Споделяне на знания за уелнес, здравословно хранене и балансиран начин на живот чрез активна комуникация с нашата общност.',
  },
]

const FOUNDERS = [
  {
    name: 'Саня Ганчева',
    role: 'Мениджър търговия',
    bio: 'Завършила УНСС, специалност маркетинг. Отговаря за търговското развитие на BOSY и изграждането на партньорската мрежа.',
    image: '/team/boyana2.jpg',
  },
  {
    name: 'Бояна Генова',
    role: 'Маркетинг мениджър',
    bio: 'Икономист, сертифициран диетолог, създател на концепцията и рецептите на BOSY. Движещата сила зад всеки продукт.',
    image: '/team/sanya.jpg',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-center"
        style={{
          background: 'linear-gradient(135deg, #61a229 0%, #4e871f 100%)',
          color: '#fff',
          padding: '80px 30px 70px',
        }}
      >
        <h1
          className="text-4xl md:text-5xl font-extrabold mb-5 relative"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
        >
          Нашата храна за вашето здраве!
        </h1>
        <p
          className="text-base md:text-lg relative mx-auto leading-relaxed"
          style={{ maxWidth: 680, opacity: 0.92 }}
        >
          В BOSY създаваме растителни протеинови десерти без добавена захар, глутен или лактоза. Марката залага на натурални съставки и съчетава вкус с хранителна стойност.
        </p>
      </section>

      {/* Mission */}
      <section className="py-16 px-5">
        <div
          className="mx-auto text-center rounded-2xl"
          style={{
            maxWidth: 860,
            background: '#fff',
            padding: '50px 44px',
            boxShadow: '0 4px 24px rgba(0,0,0,.05)',
          }}
        >
          <div
            className="mx-auto mb-5 flex items-center justify-center rounded-full text-2xl"
            style={{
              width: 64,
              height: 64,
              background: 'rgba(167,139,250,.12)',
              color: '#61a229',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
          >
            Нашата мисия
          </h2>
          <p className="leading-relaxed" style={{ color: '#555', fontSize: '15.5px', lineHeight: 1.8 }}>
            В BOSY вярваме, че здравословното хранене не трябва да изисква компромис. Нашата мисия е да предложим вкусни, хранителни и изцяло натурални десерти, които подкрепят ежедневните ви предизвикателства и ви зареждат с енергия.
          </p>
        </div>
      </section>

      {/* Goals */}
      <section className="px-5 pb-16" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="mx-auto mb-5" style={{ width: 60, height: 3, background: 'linear-gradient(135deg, #61a229 0%, #4e871f 100%)', borderRadius: 3 }} />
        <h2
          className="text-center text-2xl md:text-3xl font-bold mb-3"
          style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
        >
          Нашите цели
        </h2>
        <p
          className="text-center mb-12 mx-auto"
          style={{ color: '#666', fontSize: 15, lineHeight: 1.75, maxWidth: 740 }}
        >
          Вярваме в баланса между вкус, качество и грижа за здравето. Ето какво ни движи всеки ден.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {GOALS.map((g) => (
            <div
              key={g.num}
              className="text-center rounded-2xl transition-transform hover:-translate-y-1"
              style={{
                background: '#fff',
                padding: '40px 30px',
                boxShadow: '0 3px 18px rgba(0,0,0,.05)',
              }}
            >
              <div
                className="mx-auto mb-5 flex items-center justify-center rounded-full text-xl font-bold"
                style={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #61a229 0%, #4e871f 100%)',
                  color: '#fff',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                }}
              >
                {g.num}
              </div>
              <h3
                className="text-lg font-bold mb-3"
                style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {g.title}
              </h3>
              <p style={{ color: '#666', fontSize: '14.5px', lineHeight: 1.7 }}>{g.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team / Founders */}
      <section className="relative overflow-hidden py-16 px-5" style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="mx-auto mb-5" style={{ width: 60, height: 3, background: 'linear-gradient(135deg, #61a229 0%, #4e871f 100%)', borderRadius: 3 }} />
          <h2
            className="text-center text-2xl md:text-3xl font-bold mb-3"
            style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
          >
            Основатели
          </h2>
          <p
            className="text-center mb-12 mx-auto"
            style={{ color: '#666', fontSize: 15, lineHeight: 1.75, maxWidth: 740 }}
          >
            Запознайте се с хората, които стоят зад BOSY и ежедневно работят за по-здравословен свят.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-9 mx-auto" style={{ maxWidth: 780 }}>
            {FOUNDERS.map((f) => (
              <div
                key={f.name}
                className="rounded-2xl overflow-hidden text-center transition-transform hover:-translate-y-1"
                style={{ background: '#fdf5f0', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: 160,
                    background: 'linear-gradient(135deg, rgba(167,139,250,.12), rgba(244,114,182,.06))',
                  }}
                >
                  <div
                    className="rounded-full overflow-hidden"
                    style={{
                      width: 110,
                      height: 110,
                      border: '4px solid #61a229',
                    }}
                  >
                    <img
                      src={f.image}
                      alt={f.name}
                      className="object-cover object-top"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </div>
                <div style={{ padding: '28px 24px 32px' }}>
                  <h3
                    className="text-xl font-bold mb-1"
                    style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                  >
                    {f.name}
                  </h3>
                  <span
                    className="inline-block text-xs font-semibold mb-3 rounded-full"
                    style={{
                      background: 'rgba(167,139,250,.1)',
                      color: '#61a229',
                      padding: '4px 14px',
                    }}
                  >
                    {f.role}
                  </span>
                  <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7 }}>{f.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
