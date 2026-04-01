import { createPublicSupabaseClient } from '@/lib/supabase/public'

export const metadata = {
  title: 'Отзиви | BOSY Healthy Kitchen',
  description: 'Какво казват клиентите за BOSY - отзиви и мнения.',
}

const FALLBACK_REVIEWS = [
  {
    id: '1',
    title: 'Гала Чалъкова',
    body: 'Ягодата добавя леко кисел вкус на фона на сладкия бял шоколад. Протеинът не се усеща и предлагат удобна здравословна опция за хапване.',
  },
  {
    id: '2',
    title: 'Светослав Тодоров',
    body: 'България бонбоните имат много сладък и едновременно балансиран вкус. Редовно купувам любимия ми вкус и обикновено ги ям след тренировка.',
  },
  {
    id: '3',
    title: 'Катерина Катранджиева',
    body: 'Веган десертите могат да надминат класическите десерти и по съдържание, и по вкусови качества. Любимият ми е California, но препоръчвам да опитате всички.',
  },
  {
    id: '4',
    title: 'Елена Боянова',
    body: 'Суровите бонбони са доказателство, че здравословното е повече от вкусно. Без захар, без глутен, подходящи за фитнес ентусиасти. Africa е предпочитаният ми.',
  },
  {
    id: '5',
    title: 'Виктория Капитонова',
    body: 'Оценявам привлекателната опаковка и подробната хранителна информация. Ценно е да знам точните калории за всяко бонбонче за проследяване на диетата.',
  },
  {
    id: '6',
    title: 'Теодора Тодорова',
    body: 'Впечатлена съм от опаковката и бързата доставка. Те са напълно здравословни, без добавени захари, идеални за активни хора.',
  },
  {
    id: '7',
    title: 'Джулиана Гани',
    body: 'Препоръчвам ги преди/след тренировка заради веган съставките, обичам ги с утрешно кафе или чай.',
  },
  {
    id: '8',
    title: 'Жасмин Маджид',
    body: 'Оценявам ръчното приготвяне и разнообразието от съставки, подходящи за хора, избягващи глутен.',
  },
]

export default async function ReviewsPage() {
  let reviews: Array<{
    id: string
    title: string
    body: string
  }> = []

  try {
    const supabase = createPublicSupabaseClient()
    const { data } = await supabase
      .from('content_blocks')
      .select('id, title, body')
      .eq('type', 'review')
      .order('created_at', { ascending: false })
    if (data && data.length > 0) reviews = data
  } catch {
    // Table might not exist yet
  }

  const displayReviews = reviews.length > 0 ? reviews : FALLBACK_REVIEWS

  return (
    <>
      {/* Page Title */}
      <section className="py-10 text-center">
        <h1
          className="text-3xl md:text-4xl font-extrabold"
          style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
        >
          Отзиви
        </h1>
      </section>

      {/* Reviews Grid */}
      <section className="pb-16 px-5" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {displayReviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: '#888' }}>
              Все още няма публикувани отзиви.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl transition-transform hover:-translate-y-1"
                style={{
                  background: '#fff',
                  padding: 30,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  borderLeft: '4px solid #a78bfa',
                }}
              >
                <div className="mb-4" style={{ color: '#f5a623', fontSize: 20, letterSpacing: 2 }}>
                  &#9733;&#9733;&#9733;&#9733;&#9733;
                </div>
                <p
                  className="text-sm italic mb-4 leading-relaxed"
                  style={{ color: '#555', lineHeight: 1.7 }}
                >
                  &laquo;{review.body}&raquo;
                </p>
                <div
                  className="text-sm font-bold"
                  style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                >
                  {review.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
