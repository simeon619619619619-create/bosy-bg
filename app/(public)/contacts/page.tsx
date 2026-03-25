export const metadata = {
  title: 'Контакти | BOSY Healthy Kitchen',
  description: 'Свържете се с BOSY Healthy Kitchen. Телефон, имейл, контактна форма.',
}

export default function ContactsPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-center"
        style={{
          background: 'linear-gradient(135deg, #61a229 0%, #4a8a1e 100%)',
          color: '#fff',
          padding: '60px 30px',
        }}
      >
        <h1
          className="text-3xl md:text-4xl font-extrabold mb-2 relative"
          style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
        >
          Контакти
        </h1>
        <p className="relative" style={{ fontSize: 16, opacity: 0.9 }}>
          Свържете се с нас - ще се радваме да чуем от вас!
        </p>
      </section>

      {/* Contact Content */}
      <section className="py-16 px-5" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left: Info Cards */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Phone Card */}
            <div
              className="rounded-2xl transition-transform hover:-translate-y-1"
              style={{ background: '#fff', padding: '28px 30px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{
                    width: 48,
                    height: 48,
                    background: 'linear-gradient(135deg, #61a229, #4a8a1e)',
                    color: '#fff',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                >
                  Телефон
                </h3>
              </div>
              <a
                href="tel:+359887808808"
                className="flex items-center gap-2.5 py-2 text-sm transition-colors hover:text-[#61a229]"
                style={{ color: '#555', borderBottom: '1px solid #f0f0f0' }}
              >
                +359 887 808 808
              </a>
              <a
                href="tel:+359879898988"
                className="flex items-center gap-2.5 py-2 text-sm transition-colors hover:text-[#61a229]"
                style={{ color: '#555' }}
              >
                +359 879 898 988
              </a>
            </div>

            {/* Email Card */}
            <div
              className="rounded-2xl transition-transform hover:-translate-y-1"
              style={{ background: '#fff', padding: '28px 30px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{
                    width: 48,
                    height: 48,
                    background: 'linear-gradient(135deg, #61a229, #4a8a1e)',
                    color: '#fff',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                >
                  Имейл
                </h3>
              </div>
              <a
                href="mailto:sales@bosy.bg"
                className="block py-2 text-sm transition-colors hover:text-[#61a229]"
                style={{ color: '#555', borderBottom: '1px solid #f0f0f0' }}
              >
                sales@bosy.bg
                <span className="block text-xs mt-0.5" style={{ color: '#999' }}>Продажби</span>
              </a>
              <a
                href="mailto:marketing@bosy.bg"
                className="block py-2 text-sm transition-colors hover:text-[#61a229]"
                style={{ color: '#555' }}
              >
                marketing@bosy.bg
                <span className="block text-xs mt-0.5" style={{ color: '#999' }}>Маркетинг, Събития, Сътрудничество</span>
              </a>
            </div>

            {/* Social Card */}
            <div
              className="rounded-2xl"
              style={{ background: '#fff', padding: '28px 30px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <h3
                className="text-lg font-bold mb-4"
                style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                Последвайте ни
              </h3>
              <div className="flex gap-3.5">
                <a
                  href="https://www.facebook.com/Bosy-Healthy-Kitchen-106774147859327"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-xl transition-transform hover:-translate-y-1"
                  style={{ width: 52, height: 52, background: '#1877f2', color: '#fff' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                </a>
                <a
                  href="https://www.instagram.com/bosyhealthy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-xl transition-transform hover:-translate-y-1"
                  style={{ width: 52, height: 52, background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', color: '#fff' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/bosyhealthy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-xl transition-transform hover:-translate-y-1"
                  style={{ width: 52, height: 52, background: '#0a66c2', color: '#fff' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div
            className="lg:col-span-3 rounded-2xl"
            style={{ background: '#fff', padding: '36px 40px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: '#333', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              Зареди обекта си с BOSY
            </h2>
            <p className="text-sm mb-7" style={{ color: '#888' }}>
              Попълнете формата и ще се свържем с вас възможно най-скоро.
            </p>
            <form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#555', letterSpacing: '0.3px' }}>
                    Име
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Вашето име"
                    className="w-full rounded-lg text-sm outline-none transition-colors focus:border-[#61a229] focus:bg-white"
                    style={{
                      padding: '14px 16px',
                      border: '2px solid #e8e8e8',
                      background: '#fafafa',
                      color: '#333',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#555', letterSpacing: '0.3px' }}>
                    Имейл
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Вашият имейл"
                    className="w-full rounded-lg text-sm outline-none transition-colors focus:border-[#61a229] focus:bg-white"
                    style={{
                      padding: '14px 16px',
                      border: '2px solid #e8e8e8',
                      background: '#fafafa',
                      color: '#333',
                    }}
                  />
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-2" style={{ color: '#555', letterSpacing: '0.3px' }}>
                  Телефон
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Вашият телефон"
                  className="w-full rounded-lg text-sm outline-none transition-colors focus:border-[#61a229] focus:bg-white"
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e8e8e8',
                    background: '#fafafa',
                    color: '#333',
                  }}
                />
              </div>
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-2" style={{ color: '#555', letterSpacing: '0.3px' }}>
                  Съобщение
                </label>
                <textarea
                  name="message"
                  placeholder="Напишете вашето съобщение тук..."
                  rows={5}
                  className="w-full rounded-lg text-sm outline-none transition-colors resize-y focus:border-[#61a229] focus:bg-white"
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e8e8e8',
                    background: '#fafafa',
                    color: '#333',
                  }}
                />
              </div>
              <button
                type="button"
                className="w-full rounded-lg font-bold text-sm tracking-wide transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #61a229, #4a8a1e)',
                  color: '#fff',
                  padding: '16px 40px',
                  border: 'none',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                }}
              >
                Изпрати
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
