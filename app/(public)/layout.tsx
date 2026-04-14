import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import { AnnouncementBar } from '@/components/public/announcement-bar'
import { Header } from '@/components/public/header'
import { Footer } from '@/components/public/footer'
import { CartProvider } from '@/components/public/cart-provider'
import { EasterPopup } from '@/components/public/easter-popup'
import { FloatingTimer } from '@/components/public/floating-timer'

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://bosy.bg'),
  title: {
    default: 'BOSY — Healthy Kitchen | Здравословни лакомства без захар',
    template: '%s | BOSY',
  },
  description:
    'BOSY Healthy Kitchen — протеинови барове, топчета и напитки без добавена захар, без глутен, на растителна основа. Здравословни лакомства с чист състав. Доставка в цяла България.',
  keywords: [
    'BOSY',
    'Healthy Kitchen',
    'без захар',
    'без глутен',
    'протеинов бар',
    'протеинови топчета',
    'веган лакомства',
    'здравословни десерти',
    'растителна основа',
    'колагенова напитка',
    'фитнес снак',
  ],
  applicationName: 'BOSY — Healthy Kitchen',
  authors: [{ name: 'BOSY' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://bosy.bg',
    siteName: 'BOSY — Healthy Kitchen',
    locale: 'bg_BG',
    title: 'BOSY — Healthy Kitchen',
    description:
      'Здравословни лакомства без добавена захар, без глутен, на растителна основа.',
    images: [{ url: '/hero-banner.jpg', width: 1200, height: 630, alt: 'BOSY' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BOSY — Healthy Kitchen',
    description: 'Здравословни лакомства без добавена захар.',
    images: ['/hero-banner.jpg'],
  },
}

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'FoodEstablishment'],
  '@id': 'https://bosy.bg/#organization',
  name: 'BOSY — Healthy Kitchen',
  alternateName: 'BOSY',
  legalName: 'Боси Хелти ООД',
  url: 'https://bosy.bg',
  logo: 'https://bosy.bg/bosy-logo.jpg',
  image: 'https://bosy.bg/bosy-logo.jpg',
  description:
    'BOSY Healthy Kitchen — българска марка за здравословни лакомства: протеинови барове, топчета и напитки без добавена захар и глутен.',
  taxID: 'BG206532236',
  vatID: 'BG206532236',
  iso6523Code: '0199:206532236',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'ул. Боряна 33',
    addressLocality: 'София',
    addressRegion: 'София-град',
    postalCode: '1618',
    addressCountry: 'BG',
  },
  sameAs: [
    'https://www.facebook.com/Bosy-Healthy-Kitchen-106774147859327',
    'https://www.instagram.com/bosyhealthy/',
    'https://www.linkedin.com/company/bosyhealthy',
  ],
  areaServed: { '@type': 'Country', name: 'Bulgaria' },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+359-887-808-808',
      email: 'sales@bosy.bg',
      availableLanguage: ['Bulgarian', 'English'],
      areaServed: 'BG',
    },
  ],
}

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://bosy.bg/#website',
  url: 'https://bosy.bg',
  name: 'BOSY — Healthy Kitchen',
  inLanguage: 'bg-BG',
  publisher: { '@id': 'https://bosy.bg/#organization' },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://bosy.bg/shop?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${montserrat.variable} ${inter.variable} min-h-screen`}
      style={{ background: '#fdf5f0', color: '#333', fontFamily: 'var(--font-inter), Inter, sans-serif' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <CartProvider>
        <AnnouncementBar />
        <Header />
        <main>{children}</main>
        <Footer />
        <EasterPopup />
        <FloatingTimer />
      </CartProvider>
    </div>
  )
}
