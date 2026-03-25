import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{ background: '#1a1a1a', color: '#ccc', padding: '50px 0 20px' }}>
      <div className="mx-auto px-5" style={{ maxWidth: 1200 }}>
        {/* Grid */}
        <div className="grid gap-10 mb-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <span
              className="inline-block text-2xl font-extrabold tracking-widest mb-4"
              style={{ color: '#61a229', fontFamily: 'Montserrat, sans-serif' }}
            >
              BOSY
            </span>
            <p className="text-[13px] leading-relaxed" style={{ color: '#aaa' }}>
              Здравословни лакомства без добавена захар, без глутен, на растителна основа.
            </p>
            {/* Social */}
            <div className="flex gap-3 mt-4">
              <a
                href="https://www.facebook.com/Bosy-Healthy-Kitchen-106774147859327"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-full transition-colors duration-300"
                style={{ width: 36, height: 36, background: '#333', color: '#fff' }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/bosyhealthy/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-full transition-colors duration-300"
                style={{ width: 36, height: 36, background: '#333', color: '#fff' }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="17.5" cy="6.5" r="1.5" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/bosyhealthy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-full transition-colors duration-300"
                style={{ width: 36, height: 36, background: '#333', color: '#fff' }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Pages */}
          <div>
            <h4
              className="text-sm uppercase tracking-widest mb-4 font-semibold"
              style={{ color: '#fff' }}
            >
              Страници
            </h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/about" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>За нас</Link>
              <Link href="/contacts" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>Контакти</Link>
              <Link href="/shop" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>Магазин</Link>
              <Link href="/bosy-club" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>BOSY Club</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h4
              className="text-sm uppercase tracking-widest mb-4 font-semibold"
              style={{ color: '#fff' }}
            >
              Информация
            </h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/privacy-policy" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>Условия за ползване</Link>
              <Link href="/cookies" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>Cookie Policy</Link>
              <Link href="/blog" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>Блог</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-sm uppercase tracking-widest mb-4 font-semibold"
              style={{ color: '#fff' }}
            >
              Контакти
            </h4>
            <div className="flex flex-col gap-2.5">
              <a href="tel:+359887808808" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>+359 887 808 808</a>
              <a href="tel:+359879898988" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>+359 879 898 988</a>
              <a href="mailto:info@bosy.bg" className="text-[13px] transition-colors duration-200 hover:text-[#61a229]" style={{ color: '#aaa' }}>info@bosy.bg</a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="text-center pt-5" style={{ borderTop: '1px solid #333' }}>
          <p className="text-xs mb-2" style={{ color: '#777', lineHeight: 1.6 }}>
            BosyKitchen.com &copy; {new Date().getFullYear()} | Всички права запазени
          </p>
          <p className="text-xs" style={{ color: '#777', lineHeight: 1.6 }}>
            Сумата в евро се получава чрез конвертиране на цената по фиксирания обменен курс на БНБ 1 EUR = 1.95583 BGN
          </p>
        </div>
      </div>
    </footer>
  )
}
