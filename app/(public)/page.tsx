import Link from 'next/link'
import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { FeaturedProducts } from '@/components/public/featured-products'

const BADGES = [
  { label: 'БЕЗ ДОБАВЕНА ЗАХАР', icon: 'https://bosy.bg/wp-content/uploads/2026/02/bosy-no-added-sugar-512.png' },
  { label: 'БЕЗ ГЛУТЕН', icon: 'https://bosy.bg/wp-content/uploads/2026/02/bosy-gluten-free-512.png' },
  { label: 'РАСТИТЕЛНА ОСНОВА', icon: 'https://bosy.bg/wp-content/uploads/2026/02/bosy-natural-origin-512.png' },
  { label: 'ВИСОК ПРОТЕИН', icon: 'https://bosy.bg/wp-content/uploads/2026/02/bosy-high-protein-512.png' },
  { label: 'OMEGA-3', icon: 'https://bosy.bg/wp-content/uploads/2026/02/bosy-omega-3-512.png' },
  { label: 'АНТИОКСИДАНТИ', icon: 'https://bosy.bg/wp-content/uploads/2026/02/bosy-antioxidant-512.png' },
]

const CATEGORIES = [
  { name: 'Africa Balls', image: 'https://bosy.bg/wp-content/uploads/2024/11/afrika_455x300-1.webp' },
  { name: 'Miami', image: 'https://bosy.bg/wp-content/uploads/2024/11/miami_455x300-1.webp' },
  { name: 'California', image: 'https://bosy.bg/wp-content/uploads/2024/11/california_455x300-1.webp' },
  { name: 'Moscow', image: 'https://bosy.bg/wp-content/uploads/2024/11/moscow_455x300-1.webp' },
  { name: 'Turkey', image: 'https://bosy.bg/wp-content/uploads/2024/11/turkey_455x300-1.webp' },
  { name: 'Dominicana', image: 'https://bosy.bg/wp-content/uploads/2024/11/dominicana_455x300-1.webp' },
]

const TESTIMONIALS = [
  {
    name: 'Gala Chalkova',
    text: 'Балансирани вкусове, качествени съставки и невероятно удоволствие без излишна захар. BOSY топчетата са моят фаворит за здравословно лакомство!',
  },
  {
    name: 'Svetoslav Todorov',
    text: 'След тренировка BOSY топчетата са перфектният снак - бърз, вкусен и с качествен протеин. Препоръчвам ги на всеки активен човек!',
  },
  {
    name: 'Katerina Katrandzieva',
    text: 'Като веган, рядко намирам толкова вкусни десерти на растителна основа. BOSY продуктите са истинско откритие за мен!',
  },
  {
    name: 'Dimitar Petrov',
    text: 'BOSY протеиновият бар е ежедневният ми спътник. Страхотен вкус, добър протеин и ме държи сит до следващото хранене.',
  },
  {
    name: 'Maria Ivanova',
    text: 'Децата обожават BOSY топчетата! Радвам се, че мога да им дам нещо вкусно без излишна захар.',
  },
  {
    name: 'Nikolay Georgiev',
    text: 'Пробвах много протеинови барове, но BOSY е различен - истински вкус, не химия. Абонирах се за месечна доставка!',
  },
]

const PARTNERS = [
  'https://bosy.bg/wp-content/uploads/2024/10/10-bosy-logo-4-1.png',
  'https://bosy.bg/wp-content/uploads/2024/10/10-bosy-logo-2-1.png',
  'https://bosy.bg/wp-content/uploads/2024/10/partners-logo-01-1.png',
  'https://bosy.bg/wp-content/uploads/2024/10/partners-logo-03-1.png',
  'https://bosy.bg/wp-content/uploads/2024/10/partners-logo-08-1.png',
  'https://bosy.bg/wp-content/uploads/2024/10/partners-logo-11-1.png',
  'https://bosy.bg/wp-content/uploads/2024/10/partners-logo-12-1.png',
]

export default async function HomePage() {
  let products: Array<{
    id: string
    name: string
    slug: string
    price: number
    compare_at_price: number | null
    image_url: string | null
    is_active: boolean
  }> = []

  try {
    const supabase = createPublicSupabaseClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, image_url, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(9)
    if (data) products = data
  } catch {
    // Products table might not exist yet
  }

  return (
    <div style={{ background: '#fdf5f0' }}>
      {/* ===== 1. Hero Banner ===== */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 500 }}>
        <img
          src="https://bosy.bg/wp-content/uploads/2026/03/Website_2400x1256-scaled.jpg"
          alt="BOSY - Healthy Kitchen"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            minHeight: 500,
          }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.15)' }}
        >
          <Link
            href="/shop"
            className="inline-block rounded-full font-bold text-[15px] uppercase tracking-wider transition-all duration-300 hover:bg-[#4a8a1e]"
            style={{
              background: '#61a229',
              color: '#fff',
              padding: '16px 52px',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              letterSpacing: '0.12em',
              fontSize: 16,
            }}
          >
            ПАЗАРУВАЙ
          </Link>
        </div>
      </section>

      {/* ===== 2. Feature Badges ===== */}
      <section className="py-14" style={{ background: '#fff' }}>
        <div className="mx-auto px-5" style={{ maxWidth: 1100 }}>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 text-center">
            {BADGES.map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 90,
                    height: 90,
                    background: '#f0f7e8',
                    border: '2px solid #61a229',
                  }}
                >
                  <img
                    src={b.icon}
                    alt={b.label}
                    style={{ width: 48, height: 48, objectFit: 'contain' }}
                  />
                </div>
                <span
                  className="text-[11px] font-bold uppercase tracking-wide leading-tight"
                  style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. Product Categories ===== */}
      <section className="py-16" style={{ background: '#fdf5f0' }}>
        <div className="mx-auto px-5" style={{ maxWidth: 1200 }}>
          <h2
            className="text-center text-3xl md:text-4xl font-extrabold mb-10"
            style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
          >
            Нашите продукти
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href="/shop"
                className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      transition: 'transform 0.4s ease',
                    }}
                    className="group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 flex items-end justify-center pb-5"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
                    }}
                  >
                    <span
                      className="text-lg font-bold uppercase tracking-wider"
                      style={{
                        color: '#fff',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                      }}
                    >
                      {cat.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. Featured Products ===== */}
      {products.length > 0 && (
        <section className="py-16" style={{ background: '#fff' }}>
          <div className="mx-auto px-5" style={{ maxWidth: 1200 }}>
            <h2
              className="text-center text-3xl md:text-4xl font-extrabold mb-10"
              style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Най-продавани
            </h2>
            <FeaturedProducts products={products} />
            <div className="text-center mt-10">
              <Link
                href="/shop"
                className="inline-block rounded-full font-bold text-[15px] uppercase tracking-wider transition-all duration-300 hover:opacity-90"
                style={{
                  background: '#61a229',
                  color: '#fff',
                  padding: '14px 40px',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                }}
              >
                Виж всички
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 5. Testimonials ===== */}
      <section className="py-16" style={{ background: '#f7f9f4' }}>
        <div className="mx-auto px-5" style={{ maxWidth: 1100 }}>
          <h2
            className="text-center text-3xl md:text-4xl font-extrabold mb-12"
            style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
          >
            Какво казват клиентите
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col items-center text-center p-6 rounded-2xl"
                style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
              >
                {/* Circular placeholder avatar with initials */}
                <div
                  className="flex items-center justify-center rounded-full mb-5 text-lg font-bold"
                  style={{
                    width: 80,
                    height: 80,
                    background: '#e8f5d6',
                    border: '3px solid #61a229',
                    color: '#61a229',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  }}
                >
                  {t.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <p
                  className="text-[15px] italic leading-relaxed mb-4"
                  style={{ color: '#555' }}
                >
                  &ldquo;{t.text}&rdquo;
                </p>
                <span
                  className="text-[15px] font-bold"
                  style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                >
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. Partners ===== */}
      <section className="py-14" style={{ background: '#fff' }}>
        <div className="mx-auto px-5" style={{ maxWidth: 1100 }}>
          <h2
            className="text-center text-3xl md:text-4xl font-extrabold mb-10"
            style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
          >
            Нашите партньори
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {PARTNERS.map((logo, i) => (
              <img
                key={i}
                src={logo}
                alt={`Partner ${i + 1}`}
                style={{
                  height: 60,
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'grayscale(100%)',
                  opacity: 0.7,
                  transition: 'all 0.3s ease',
                }}
                className="hover:opacity-100 hover:grayscale-0"
                onMouseOver={undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 7. CTA Banner ===== */}
      <section className="py-20" style={{ background: '#fdf5f0' }}>
        <div className="mx-auto px-5 text-center" style={{ maxWidth: 700 }}>
          <h2
            className="text-3xl md:text-4xl font-extrabold mb-4"
            style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
          >
            Стани част от BOSY Club
          </h2>
          <p className="text-lg mb-8" style={{ color: '#555' }}>
            Получавай ексклузивни отстъпки, ранен достъп до нови продукти и безплатна доставка при всяка поръчка.
          </p>
          <Link
            href="/bosy-club"
            className="inline-block rounded-full font-bold text-[15px] uppercase tracking-wider transition-all duration-300 hover:opacity-90"
            style={{
              background: '#61a229',
              color: '#fff',
              padding: '16px 48px',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            Присъедини се
          </Link>
        </div>
      </section>
    </div>
  )
}
