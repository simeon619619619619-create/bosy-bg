import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Блог | BOSY Healthy Kitchen',
  description: 'Статии за здравословно хранене, рецепти и съвети от BOSY.',
}

const FALLBACK_POSTS = [
  {
    id: '1',
    title: 'BOSY - Здравословни и красиви',
    body: 'Здравословното хранене е ключът към красивата кожа, блестящата коса и доброто самочувствие. Научете как натуралните съставки в продуктите на BOSY подпомагат вашата красота отвътре навън, без компромис с вкуса.',
    image_url: 'https://bosy.bg/wp-content/uploads/2020/11/BOSY-blog-1.jpg',
  },
  {
    id: '2',
    title: 'Hunger for sweet? No more worried!',
    body: 'Желанието за сладко е напълно естествено, но не е нужно да се притеснявате. С BOSY можете да задоволите апетита си за сладко без добавена захар и без излишни калории. Открийте здравословните алтернативи.',
    image_url: 'https://bosy.bg/wp-content/uploads/2020/11/BOSY-blog-2.jpg',
  },
  {
    id: '3',
    title: 'Hollywood and Healthy Eating',
    body: 'Холивудските звезди отдавна са открили тайната на здравословното хранене. Вижте какви диети следват любимите ви знаменитости и как можете да приложите техните навици в ежедневието си с помощта на BOSY.',
    image_url: 'https://bosy.bg/wp-content/uploads/2020/11/BOSY-blog-3.jpg',
  },
  {
    id: '4',
    title: 'С BOSY храната е здраве',
    body: 'Храната е най-мощното лекарство, което имаме. С BOSY вярваме, че всяка хапка трябва да носи полза за тялото. Разберете как нашите продукти съчетават вкус и хранителна стойност за вашето здраве.',
    image_url: 'https://bosy.bg/wp-content/uploads/2020/11/BOSY-blog-4.jpg',
  },
]

export default async function BlogPage() {
  let posts: Array<{
    id: string
    title: string
    body: string
    image_url: string | null
  }> = []

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('content_blocks')
      .select('id, title, body, image_url')
      .eq('type', 'blog')
      .order('created_at', { ascending: false })
    if (data && data.length > 0) posts = data
  } catch {
    // Table might not exist yet
  }

  const displayPosts = posts.length > 0 ? posts : FALLBACK_POSTS

  return (
    <>
      {/* Page Title */}
      <section className="py-10 text-center">
        <h1
          className="text-3xl md:text-4xl font-extrabold"
          style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
        >
          Блог
        </h1>
      </section>

      {/* Blog Grid */}
      <section className="pb-16 px-5" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {displayPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: '#888' }}>
              Все още няма публикувани статии. Очаквайте скоро!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayPosts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
                style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}
              >
                {post.image_url && (
                  <div className="relative overflow-hidden" style={{ height: 280 }}>
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{
                      color: '#333',
                      lineHeight: 1.4,
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    }}
                  >
                    {post.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-5 flex-grow"
                    style={{ color: '#666', lineHeight: 1.7 }}
                  >
                    {post.body.length > 200 ? `${post.body.substring(0, 200)}...` : post.body}
                  </p>
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: '#61a229',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    }}
                  >
                    Прочети повече &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
