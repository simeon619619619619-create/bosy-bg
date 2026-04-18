'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  Tag,
  ShoppingBag,
  Users,
  UserCheck,
  BarChart3,
  Mail,
  Image,
  Home,
  Truck,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badgeKey?: 'orders'
}

interface NavSection {
  title: string
  items: NavItem[]
  roles: string[]
}

const navSections: NavSection[] = [
  {
    title: 'Главно',
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid }],
    roles: ['staff', 'manager', 'admin'],
  },
  {
    title: 'Управление',
    items: [
      { label: 'Продукти', href: '/admin/products', icon: Tag },
      { label: 'Нови поръчки', href: '/admin/orders', icon: ShoppingBag, badgeKey: 'orders' as const },
      { label: 'Клиенти', href: '/admin/customers', icon: Users },
      { label: 'Членове', href: '/admin/members', icon: UserCheck },
    ],
    roles: ['staff', 'manager', 'admin'],
  },
  {
    title: 'Маркетинг',
    items: [
      { label: 'Маркетинг', href: '/admin/marketing', icon: BarChart3 },
      { label: 'Meta Ads', href: '/admin/marketing/meta-ads', icon: BarChart3 },
      { label: 'Klaviyo', href: '/admin/marketing/klaviyo', icon: Mail },
    ],
    roles: ['manager', 'admin'],
  },
  {
    title: 'Съдържание',
    items: [
      { label: 'Начална страница', href: '/admin/homepage', icon: Home },
      { label: 'Банери & Блог', href: '/admin/content', icon: Image },
    ],
    roles: ['manager', 'admin'],
  },
  {
    title: 'Доставки',
    items: [{ label: 'Speedy', href: '/admin/speedy', icon: Truck }],
    roles: ['staff', 'manager', 'admin'],
  },
  {
    title: 'Промо',
    items: [{ label: 'Промо кодове', href: '/admin/promo-codes', icon: Tag }],
    roles: ['manager', 'admin'],
  },
  {
    title: 'Настройки',
    items: [{ label: 'Настройки', href: '/admin/settings', icon: Settings }],
    roles: ['admin'],
  },
]

export function SidebarNav({ role, pendingOrders = 0 }: { role: string; pendingOrders?: number }) {
  const pathname = usePathname()

  const visibleSections = navSections.filter((section) =>
    section.roles.includes(role)
  )

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {visibleSections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.badgeKey === 'orders' && pendingOrders > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">
                      {pendingOrders}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
