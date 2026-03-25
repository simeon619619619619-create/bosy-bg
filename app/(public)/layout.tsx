import { Montserrat, Inter } from 'next/font/google'
import { AnnouncementBar } from '@/components/public/announcement-bar'
import { Header } from '@/components/public/header'
import { Footer } from '@/components/public/footer'
import { CartProvider } from '@/components/public/cart-provider'

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

export const metadata = {
  title: 'BOSY - Healthy Kitchen',
  description: 'Здравословни лакомства без добавена захар, без глутен, на растителна основа. Протеинови барове и топчета.',
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${montserrat.variable} ${inter.variable} min-h-screen`}
      style={{ background: '#fdf5f0', color: '#333', fontFamily: 'var(--font-inter), Inter, sans-serif' }}
    >
      <CartProvider>
        <AnnouncementBar />
        <Header />
        <main>{children}</main>
        <Footer />
      </CartProvider>
    </div>
  )
}
