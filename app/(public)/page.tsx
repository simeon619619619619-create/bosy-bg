import Link from 'next/link'
import Image from 'next/image'
import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { FeaturedProducts } from '@/components/public/featured-products'

const BENEFITS = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#61a229" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2-6h4l2 6" />
        <line x1="7" y1="12" x2="17" y2="12" />
        <path d="M9 16c1.5 1 4.5 1 6 0" />
      </svg>
    ),
    label: 'Без добавена захар',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#61a229" strokeWidth="2">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    ),
    label: 'Без глутен',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#61a229" strokeWidth="2">
        <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    label: 'Растителна основа',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#61a229" strokeWidth="2">
        <path d="M6.5 6.5l11 11M6.5 17.5l11-11" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    label: 'Висок протеин',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#61a229" strokeWidth="2">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    label: 'Omega-3',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#61a229" strokeWidth="2">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    label: 'Антиоксиданти',
  },
]

const TESTIMONIALS = [
  {
    name: 'Gala Chalkova',
    image: 'https://bosy.bg/wp-content/uploads/2024/02/ladyygala-300x300.jpg',
    text: 'Балансирани вкусове, качествени съставки и невероятно удоволствие без излишна захар. BOSY топчетата са моят фаворит за здравословно лакомство!',
  },
  {
    name: 'Svetoslav Todorov',
    image: 'https://bosy.bg/wp-content/uploads/2020/12/st-300x300.jpg',
    text: 'След тренировка BOSY топчетата са перфектният снак - бърз, вкусен и с качествен протеин. Препоръчвам ги на всеки активен човек!',
  },
  {
    name: 'Katerina Katrandzieva',
    image: 'https://bosy.bg/wp-content/uploads/2020/12/unnamed-300x268.jpg',
    text: 'Като веган, рядко намирам толкова вкусни десерти на растителна основа. BOSY продуктите са истинско откритие за мен!',
  },
  {
    name: 'Elena Boyanova',
    image: 'https://bosy.bg/wp-content/uploads/2021/10/elena-212x300.jpeg',
    text: 'Нула захар и пълен вкус! Най-накрая мога да се наслаждавам на сладко без угризения. BOSY промениха начина, по който гледам на здравословното хранене.',
  },
  {
    name: 'Victoria Kapitonova',
    image: 'https://bosy.bg/wp-content/uploads/2023/05/BOSY_SQUARE_1-optimized-300x300.png',
    text: 'Следя калориите си и BOSY топчетата перфектно се вписват в хранителния ми план. Вкусни, удобни и с ясна хранителна информация!',
  },
  {
    name: 'Teodora Todorova',
    image: 'https://bosy.bg/wp-content/uploads/2021/09/4-248x300.jpg',
    text: 'Здравословното хапване никога не е било толкова лесно и вкусно. BOSY са моят go-to снак за офиса и за вкъщи!',
  },
]

export default async function HomePage() {
  // Fetch featured products
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
      .limit(8)
    if (data) products = data
  } catch {
    // Products table might not exist yet
  }

  return (
    <>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{ aspectRatio: '2400 / 1256' }}
      >
        <Image
          src="/hero-banner.jpg"
          alt="BOSY - Healthy Kitchen"
          fill
          className="object-cover object-center"
          priority
        />
        <Link
          href="/shop"
          className="absolute z-10 inline-block rounded-full font-bold text-[15px] uppercase tracking-wider transition-all duration-300 hover:bg-[#333] hover:text-white"
          style={{
            top: '60%',
            left: '18%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            color: '#333',
            padding: '14px 44px',
            border: '2px solid #333',
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          }}
        >
          Пазарувай
        </Link>
      </section>

      {/* Feature Badges */}
      <section className="py-16" style={{ background: '#fafafa' }}>
        <div className="mx-auto px-5" style={{ maxWidth: 1200 }}>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-5 text-center">
            {BENEFITS.map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 80,
                    height: 80,
                    background: '#fff',
                    border: '2px solid #61a229',
                  }}
                >
                  {b.icon}
                </div>
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#555' }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-16" style={{ background: '#fafafa' }}>
          <div className="mx-auto px-5" style={{ maxWidth: 1200 }}>
            <h2
              className="text-center text-4xl font-extrabold mb-10"
              style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Нашите продукти
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

      {/* Testimonials */}
      <section className="py-16" style={{ background: '#f7f9f4' }}>
        <div className="mx-auto px-5" style={{ maxWidth: 1100 }}>
          <h2
            className="text-center text-4xl font-extrabold mb-12"
            style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
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
                <Image
                  src={t.image}
                  alt={t.name}
                  width={90}
                  height={90}
                  className="rounded-full object-cover mb-5"
                  style={{ border: '3px solid #61a229', width: 90, height: 90 }}
                />
                <p
                  className="text-[15px] italic leading-relaxed mb-4"
                  style={{ color: '#555' }}
                >
                  &ldquo;{t.text}&rdquo;
                </p>
                <span
                  className="text-[15px] font-bold"
                  style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                >
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOSY Club CTA */}
      <section className="py-20" style={{ background: '#fdf5f0' }}>
        <div className="mx-auto px-5 text-center" style={{ maxWidth: 700 }}>
          <h2
            className="text-4xl font-extrabold mb-4"
            style={{ color: '#222', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
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
    </>
  )
}
