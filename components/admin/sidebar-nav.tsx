'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  Tag,
  ShoppingBag,
  Users,
  BarChart3,
  Mail,
  Image,
  Truck,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface NavSection {
  title: string
  items: NavItem[]
  roles: string[]
}

const navSections: NavSection[] = [
  {
    title: 'Главно',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutGrid }],
    roles: ['staff', 'manager', 'admin'],
  },
  {
    title: 'Управление',
    items: [
      { label: 'Продукти', href: '/products', icon: Tag },
      { label: 'Поръчки', href: '/orders', icon: ShoppingBag },
      { label: 'Клиенти', href: '/customers', icon: Users },
    ],
    roles: ['staff', 'manager', 'admin'],
  },
  {
    title: 'Маркетинг',
    items: [
      { label: 'Маркетинг', href: '/marketing', icon: BarChart3 },
      { label: 'Meta Ads', href: '/marketing/meta-ads', icon: BarChart3 },
      { label: 'Klaviyo', href: '/marketing/klaviyo', icon: Mail },
    ],
    roles: ['manager', 'admin'],
  },
  {
    title: 'Съдържание',
    items: [{ label: 'Банери & Блог', href: '/content', icon: Image }],
    roles: ['manager', 'admin'],
  },
  {
    title: 'Доставки',
    items: [{ label: 'Speedy', href: '/speedy', icon: Truck }],
    roles: ['staff', 'manager', 'admin'],
  },
  {
    title: 'Настройки',
    items: [{ label: 'Настройки', href: '/settings', icon: Settings }],
    roles: ['admin'],
  },
]

export function SidebarNav({ role }: { role: string }) {
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
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
