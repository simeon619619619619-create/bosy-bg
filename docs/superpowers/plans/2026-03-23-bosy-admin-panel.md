# BOSY.BG Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full admin panel for bosy.bg with product/order/customer management, marketing dashboards (Meta Ads + Klaviyo), Speedy courier integration, and content management — all on Next.js 16 + Supabase.

**Architecture:** Monolithic Next.js 16 app with `(admin)` and `(public)` route groups. Supabase for auth, database, and storage. Vercel cron jobs sync external API data (Meta Ads, Klaviyo, Speedy) into cache tables. Dark theme with BOSY branding (#FF7820 orange).

**Tech Stack:** Next.js 16, Supabase (Postgres + Auth + Storage), shadcn/ui, Tailwind CSS, Geist fonts, Vercel, Meta Graph API v25.0, Klaviyo API, Speedy API

**Spec:** `docs/superpowers/specs/2026-03-23-bosy-admin-panel-design.md`

---

## Phase 1: Foundation (Project Setup + Auth + Admin Shell)

### Task 1: Scaffold Next.js 16 project with Supabase + shadcn/ui

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- Create: `app/layout.tsx` (root layout with Geist fonts)
- Create: `lib/supabase/client.ts` (browser client)
- Create: `lib/supabase/server.ts` (server client using @supabase/ssr)
- Create: `lib/supabase/types.ts` (generated DB types)
- Create: `.env.local.example`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/Sim/Desktop
npx create-next-app@latest bosy-bg-app --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
cd bosy-bg-app
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install geist
npx shadcn@latest init
```

When shadcn init asks:
- Style: Default
- Base color: Zinc
- CSS variables: Yes

- [ ] **Step 3: Configure Geist fonts in root layout**

```tsx
// app/layout.tsx
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Create Supabase client utilities**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

- [ ] **Step 5: Create .env.local.example and .gitignore entry**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
META_ADS_ACCESS_TOKEN=
META_ADS_ACCOUNT_ID=act_1111578709979183
KLAVIYO_API_KEY=
SPEEDY_USERNAME=
SPEEDY_PASSWORD=
CRON_SECRET=
```

Ensure `.env*.local` is in `.gitignore`.

- [ ] **Step 6: Customize Tailwind + CSS for BOSY dark theme**

Update `app/globals.css` to set BOSY brand colors:

```css
@layer base {
  :root {
    --background: 270 20% 5%;       /* #0F0B14 */
    --foreground: 270 30% 95%;      /* #F5F0FA */
    --card: 270 15% 9%;             /* #1A1520 */
    --card-foreground: 270 30% 95%;
    --primary: 24 100% 55%;         /* #FF7820 */
    --primary-foreground: 0 0% 0%;
    --muted: 270 12% 15%;           /* #2A2433 */
    --muted-foreground: 270 15% 62%;/* #9B8FB0 */
    --border: 270 12% 15%;
    --ring: 24 100% 55%;
  }
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server running on localhost:3000 with dark theme.

- [ ] **Step 8: Commit**

```bash
git init && git add -A
git commit -m "feat: scaffold Next.js 16 + Supabase + shadcn/ui with BOSY theme"
```

---

### Task 2: Supabase database schema + RLS + triggers

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migration file with full schema**

Write `supabase/migrations/001_initial_schema.sql` containing all CREATE TABLE statements from the spec:
- `users` (id references auth.users)
- `products` (with UNIQUE slug)
- `customers`
- `orders` (with FK to customers)
- `meta_ads_cache` (with UNIQUE(campaign_id, date))
- `klaviyo_cache` (with UNIQUE(metric_type))
- `content_blocks`
- `shipments` (with FK to orders)

Plus:
- `update_updated_at()` trigger function
- Triggers on products, orders, content_blocks, shipments
- `get_user_role()` helper function
- All RLS policies (admin/manager/staff) from spec section "RLS Policies"
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all tables

Full SQL is in the spec at lines 238-293.

- [ ] **Step 2: Run migration in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run the migration. Or use Supabase CLI:

```bash
npx supabase db push
```

- [ ] **Step 3: Generate TypeScript types**

```bash
npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
```

- [ ] **Step 4: Commit**

```bash
git add supabase/ lib/supabase/types.ts
git commit -m "feat: add database schema, RLS policies, and triggers"
```

---

### Task 3: Auth — Login page + proxy.ts middleware

**Files:**
- Create: `app/(public)/login/page.tsx`
- Create: `middleware.ts` (project root — Next.js middleware)
- Create: `app/api/auth/callback/route.ts`
- Create: `lib/supabase/auth.ts` (helper to get user + role)

- [ ] **Step 1: Create auth helper**

```ts
// lib/supabase/auth.ts
import { createServerSupabaseClient } from './server'

export async function getAuthUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single()

  return profile
}
```

- [ ] **Step 2: Create login page**

```tsx
// app/(public)/login/page.tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Грешен имейл или парола')
      setLoading(false)
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary tracking-widest">BOSY</h1>
          <p className="text-muted-foreground text-sm mt-2">Admin Panel</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Имейл</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Парола</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Влизане...' : 'Влез'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create middleware.ts (auth middleware)**

```ts
// middleware.ts (project root)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role for settings
    if (request.nextUrl.pathname.startsWith('/admin/settings')) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }
  }

  // Redirect logged-in users away from login
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
```

- [ ] **Step 4: Create auth callback route**

```ts
// app/api/auth/callback/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/admin/dashboard`)
}
```

- [ ] **Step 5: Install shadcn components needed**

```bash
npx shadcn@latest add button input label card
```

- [ ] **Step 6: Test login flow manually**

Create a test user in Supabase Dashboard → Authentication → Users. Also insert a matching row in the `users` table with role 'admin'. Verify login redirects to /admin/dashboard.

- [ ] **Step 7: Commit**

```bash
git add app/(public)/login/ middleware.ts app/api/auth/ lib/supabase/auth.ts
git commit -m "feat: add auth flow — login page, middleware, role checking"
```

---

### Task 4: Admin layout — Sidebar + dashboard shell

**Files:**
- Create: `app/(admin)/layout.tsx`
- Create: `components/admin/sidebar.tsx`
- Create: `components/admin/sidebar-nav.tsx`
- Create: `app/(admin)/dashboard/page.tsx` (placeholder)

- [ ] **Step 1: Install shadcn components**

```bash
npx shadcn@latest add separator badge tooltip avatar dropdown-menu sheet
```

- [ ] **Step 2: Create sidebar navigation component**

```tsx
// components/admin/sidebar-nav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  LayoutGrid, Tag, ShoppingBag, Users, BarChart3,
  Mail, Image, Truck, Settings
} from 'lucide-react'

const navSections = [
  {
    label: 'Главно',
    items: [
      { href: '/admin/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    ],
  },
  {
    label: 'Управление',
    items: [
      { href: '/admin/products', icon: Tag, label: 'Продукти' },
      { href: '/admin/orders', icon: ShoppingBag, label: 'Поръчки' },
      { href: '/admin/customers', icon: Users, label: 'Клиенти' },
    ],
  },
  {
    label: 'Маркетинг',
    items: [
      { href: '/admin/marketing', icon: BarChart3, label: 'Meta Ads' },
      { href: '/admin/marketing/klaviyo', icon: Mail, label: 'Klaviyo' },
    ],
  },
  {
    label: 'Съдържание',
    items: [
      { href: '/admin/content', icon: Image, label: 'Банери & Блог' },
    ],
  },
  {
    label: 'Доставки',
    items: [
      { href: '/admin/orders?filter=shipped', icon: Truck, label: 'Speedy' },
    ],
  },
]

// Roles that can see each section
const sectionAccess: Record<string, string[]> = {
  'Главно': ['admin', 'manager', 'staff'],
  'Управление': ['admin', 'manager', 'staff'],
  'Маркетинг': ['admin', 'manager'],
  'Съдържание': ['admin', 'manager'],
  'Доставки': ['admin', 'manager', 'staff'],
}

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {navSections
        .filter(section => sectionAccess[section.label]?.includes(role))
        .map(section => (
          <div key={section.label}>
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            {section.items.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
    </nav>
  )
}
```

- [ ] **Step 3: Create sidebar component**

```tsx
// components/admin/sidebar.tsx
import { SidebarNav } from './sidebar-nav'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface SidebarProps {
  user: { name: string; email: string; role: string }
}

export function Sidebar({ user }: SidebarProps) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-[260px] border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary tracking-[3px]">BOSY</h1>
        <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <SidebarNav role={user.role} />
      </div>

      <div className="border-t border-border p-4 flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Create admin layout**

```tsx
// app/(admin)/layout.tsx
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth'
import { Sidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} />
      <main className="ml-[260px] p-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Create dashboard placeholder**

```tsx
// app/(admin)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-1">Добре дошъл в BOSY Admin Panel</p>
    </div>
  )
}
```

- [ ] **Step 6: Verify admin layout renders with sidebar**

Run `npm run dev`, login, verify sidebar appears with correct navigation and user avatar.

- [ ] **Step 7: Commit**

```bash
git add app/(admin)/ components/admin/
git commit -m "feat: add admin layout with sidebar navigation and role-based visibility"
```

---

## Phase 2: Products CRUD

### Task 5: Products list page with search + filters

**Files:**
- Create: `app/(admin)/products/page.tsx`
- Create: `components/admin/products/product-table.tsx`
- Create: `components/admin/data-table.tsx` (reusable table)

- [ ] **Step 1: Install shadcn table + search components**

```bash
npx shadcn@latest add table select switch dialog tabs
```

- [ ] **Step 2: Create reusable data table component**

`components/admin/data-table.tsx` — server component that renders a `<Table>` with:
- Column headers with sort indicators
- Row rendering via render prop
- Empty state
- Used by products, orders, customers pages

- [ ] **Step 3: Create products list page**

`app/(admin)/products/page.tsx` — server component:
- Fetch products from Supabase with search/filter params from searchParams
- Display in table: image thumbnail, name, category, price, stock, active toggle
- Search bar filtering by name
- Category filter dropdown
- "Нов продукт" button linking to `/admin/products/new`

- [ ] **Step 4: Verify products page renders (empty state)**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add products list page with search and filters"
```

---

### Task 6: Product create + edit pages

**Files:**
- Create: `app/(admin)/products/new/page.tsx`
- Create: `app/(admin)/products/[id]/page.tsx`
- Create: `components/admin/products/product-form.tsx`
- Create: `app/(admin)/products/actions.ts` (server actions)

- [ ] **Step 1: Install shadcn form components**

```bash
npx shadcn@latest add textarea form
```

- [ ] **Step 2: Create server actions for product CRUD**

`app/(admin)/products/actions.ts`:
- `createProduct(formData)` — insert into products, redirect to list
- `updateProduct(id, formData)` — update product, redirect to list
- `deleteProduct(id)` — delete product, redirect to list
- `toggleProductActive(id, isActive)` — toggle is_active

All use `createServerSupabaseClient()` and `revalidatePath('/admin/products')`.

- [ ] **Step 3: Create product form component**

`components/admin/products/product-form.tsx`:
- Client component ('use client')
- Fields: name, slug (auto-generated from name), description, price, compare_price, category, stock_quantity, is_active
- Image upload to Supabase Storage
- Variants as JSON editor (simple key-value pairs)
- Submit calls server action

- [ ] **Step 4: Create new product page**

```tsx
// app/(admin)/products/new/page.tsx
import { ProductForm } from '@/components/admin/products/product-form'

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Нов продукт</h1>
      <ProductForm />
    </div>
  )
}
```

- [ ] **Step 5: Create edit product page**

```tsx
// app/(admin)/products/[id]/page.tsx
// Fetch product by id, pass to ProductForm as defaultValues
```

- [ ] **Step 6: Test create → edit → delete flow manually**

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: add product create/edit/delete with image upload"
```

---

## Phase 3: Orders + Speedy

### Task 7: Orders list + detail pages

**Files:**
- Create: `app/(admin)/orders/page.tsx`
- Create: `app/(admin)/orders/[id]/page.tsx`
- Create: `components/admin/orders/order-status-badge.tsx`
- Create: `app/(admin)/orders/actions.ts`

- [ ] **Step 1: Create order status badge component**

Colored badges for: pending (yellow), confirmed (blue), shipped (orange), delivered (green), cancelled (red). Matching the mockup design.

- [ ] **Step 2: Create orders list page**

Server component with:
- Filter tabs by status (all, pending, confirmed, shipped, delivered)
- Table: order_number, customer name, items count, total, status badge, speedy tracking, date
- Click row → navigate to detail page

- [ ] **Step 3: Create order detail page**

Server component showing:
- Order info (customer, items list with prices, totals)
- Status timeline
- Action buttons: "Потвърди", "Изпрати с Speedy", "Откажи"
- Speedy tracking info (if shipped)

- [ ] **Step 4: Create server actions**

- `confirmOrder(id)` — set status to 'confirmed'
- `cancelOrder(id)` — set status to 'cancelled'
- Actions revalidate `/admin/orders`

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add orders list and detail pages with status management"
```

---

### Task 8: Speedy API integration

**Files:**
- Create: `lib/speedy/client.ts` (Speedy API wrapper)
- Create: `lib/speedy/types.ts`
- Create: `app/api/speedy/create-parcel/route.ts`
- Create: `app/api/speedy/label/route.ts`
- Create: `app/api/speedy/track/route.ts`
- Create: `app/api/cron/sync-speedy/route.ts`

- [ ] **Step 1: Create Speedy API client**

`lib/speedy/client.ts`:
- `authenticate(username, password)` → session token
- `createParcel(senderAddress, recipientAddress, weight, description)` → parcel ID + tracking number
- `getParcelStatus(parcelId)` → status info
- `generateLabel(parcelId)` → PDF buffer

Reference: Speedy API docs (ask Божо for API documentation or check existing `bosy-bot-portable/bosy/speedy_export.py` for endpoints).

- [ ] **Step 2: Create parcel API route**

`app/api/speedy/create-parcel/route.ts`:
- Accepts order ID
- Fetches order + customer from Supabase
- Calls Speedy API to create parcel
- Inserts shipment record
- Updates order status to 'shipped' + sets tracking number
- Returns tracking number

- [ ] **Step 3: Create label API route**

`app/api/speedy/label/route.ts`:
- Accepts parcel ID
- Returns PDF label for printing

- [ ] **Step 3.5: Create tracking API route**

`app/api/speedy/track/route.ts`:
- Accepts parcel ID or tracking number
- Calls Speedy API for current status + status history
- Returns JSON with status timeline

- [ ] **Step 4: Create Speedy sync cron**

`app/api/cron/sync-speedy/route.ts`:
- Verify CRON_SECRET header
- Fetch all shipments with status != 'delivered'
- For each, call Speedy API for current status
- Update shipment status + status_history
- If delivered, update order status to 'delivered'

- [ ] **Step 5: Add "Изпрати с Speedy" button to order detail page**

Wire the button to call `/api/speedy/create-parcel` and show tracking number on success.

- [ ] **Step 6: Add "Принтирай етикет" link**

Links to `/api/speedy/label?parcelId=XXX`, opens PDF in new tab.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: add Speedy integration — create parcel, label generation, status sync"
```

---

## Phase 4: Customers

### Task 9: Customers list + profile pages

**Files:**
- Create: `app/(admin)/customers/page.tsx`
- Create: `app/(admin)/customers/[id]/page.tsx`

- [ ] **Step 1: Create customers list page**

Server component:
- Search by name, email, phone
- Table: name, email, phone, total_orders, total_spent, created_at
- Click → customer profile

- [ ] **Step 2: Create customer profile page**

Server component:
- Customer info card (name, email, phone, address)
- Order history table (all orders for this customer)
- Stats: total orders, total spent, average order value

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add customers list and profile pages"
```

---

## Phase 5: Marketing Dashboard

### Task 10: Meta Ads cron sync + dashboard

**Files:**
- Create: `lib/meta-ads/client.ts`
- Create: `app/api/cron/sync-meta/route.ts`
- Create: `app/(admin)/marketing/page.tsx`
- Create: `app/(admin)/marketing/meta-ads/page.tsx`

- [ ] **Step 1: Create Meta Ads API client**

`lib/meta-ads/client.ts`:
- `getCampaigns(accountId, accessToken)` — fetch active campaigns with insights
- `getCampaignInsights(campaignId, dateRange)` — impressions, clicks, spend, conversions

Reference: existing code in `/Users/Sim/Downloads/Telegram Desktop/bosy-bot-portable/bosy/meta_ads.py` for API patterns. Account ID: `act_1111578709979183`.

- [ ] **Step 2: Create Meta Ads sync cron**

`app/api/cron/sync-meta/route.ts`:
- Verify CRON_SECRET
- Fetch campaigns from Meta Graph API v25.0
- Upsert into `meta_ads_cache` using `ON CONFLICT (campaign_id, date) DO UPDATE`
- Log sync timestamp

- [ ] **Step 3: Create marketing overview page**

`app/(admin)/marketing/page.tsx`:
- 4 mini-cards: total ad spend (7d), impressions (7d), Klaviyo open rate, email subscribers
- Last synced timestamp with green dot
- Links to detailed Meta Ads and Klaviyo pages

- [ ] **Step 4: Create Meta Ads detail page**

`app/(admin)/marketing/meta-ads/page.tsx`:
- Campaign table: name, status, impressions, clicks, CTR, spend, conversions, ROAS
- Date range filter (7d, 30d, 90d)
- Spend chart (bar chart using the same style as mockup)

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add Meta Ads sync cron and marketing dashboard"
```

---

### Task 11: Klaviyo cron sync + dashboard

**Files:**
- Create: `lib/klaviyo/client.ts`
- Create: `app/api/cron/sync-klaviyo/route.ts`
- Create: `app/(admin)/marketing/klaviyo/page.tsx`

- [ ] **Step 1: Create Klaviyo API client**

`lib/klaviyo/client.ts`:
- `getProfiles(apiKey)` → total count
- `getCampaigns(apiKey)` → recent campaigns with open/click rates
- `getFlows(apiKey)` → active flows
- `getMetrics(apiKey)` → aggregate stats

Reference: existing code in `/Users/Sim/Downloads/Telegram Desktop/bosy-bot-portable/bosy/klaviyo.py`.

- [ ] **Step 2: Create Klaviyo sync cron**

`app/api/cron/sync-klaviyo/route.ts`:
- Verify CRON_SECRET
- Fetch profiles count, campaign stats, flow stats
- Upsert into `klaviyo_cache` by metric_type

- [ ] **Step 3: Create Klaviyo dashboard page**

`app/(admin)/marketing/klaviyo/page.tsx`:
- Total subscribers count
- Recent campaigns table: name, sent count, open rate, click rate, date
- Active flows list

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add Klaviyo sync cron and email marketing dashboard"
```

---

## Phase 6: Content Management

### Task 12: Content CRUD (banners, blog, reviews)

**Files:**
- Create: `app/(admin)/content/page.tsx`
- Create: `app/(admin)/content/new/page.tsx`
- Create: `app/(admin)/content/[id]/page.tsx`
- Create: `components/admin/content/content-form.tsx`
- Create: `app/(admin)/content/actions.ts`

- [ ] **Step 1: Create content server actions**

- `createContent(formData)` — insert content_block
- `updateContent(id, formData)` — update content_block
- `deleteContent(id)` — delete content_block
- `togglePublished(id, isPublished)` — toggle is_published
- Image upload to Supabase Storage for banner/blog images

- [ ] **Step 2: Create content form component**

Client component with:
- Type selector (banner / blog / review)
- Title, body (textarea), image upload
- Published toggle
- Position number (for ordering banners)

- [ ] **Step 3: Create content list page**

Tabs for banner / blog / review. Table showing title, type, published status, position, date. Drag-to-reorder for banners (position field).

- [ ] **Step 4: Create content new + edit pages**

Standard form pages using ContentForm component.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add content management — banners, blog posts, reviews CRUD"
```

---

## Phase 7: Dashboard with Real Data

### Task 13: Wire dashboard to real Supabase data

**Files:**
- Modify: `app/(admin)/dashboard/page.tsx`
- Create: `components/admin/dashboard/stat-card.tsx`
- Create: `components/admin/dashboard/revenue-chart.tsx`
- Create: `components/admin/dashboard/top-products.tsx`
- Create: `components/admin/dashboard/recent-orders.tsx`
- Create: `components/admin/dashboard/marketing-overview.tsx`

- [ ] **Step 1: Create stat card component**

Reusable card showing label, value (mono font), change percentage with up/down arrow. Match the mockup style.

- [ ] **Step 2: Create dashboard page with real queries**

Server component that fetches:
- Today's revenue: `SUM(total) FROM orders WHERE created_at >= today AND status != 'cancelled'`
- New orders today: `COUNT(*) FROM orders WHERE created_at >= today`
- Active customers: `COUNT(*) FROM customers`
- Meta Ads ROAS: from `meta_ads_cache` (latest 7-day aggregate)
- Revenue chart: daily totals for last 14 days
- Top 5 products by sales
- Last 5 orders
- Marketing overview from cache tables

- [ ] **Step 3: Create chart component**

Simple bar chart using CSS (like the mockup) — no chart library needed. Bars with orange gradient, hover tooltips.

- [ ] **Step 4: Create top products component**

List with product emoji/image, name, sales count, revenue amount.

- [ ] **Step 5: Create recent orders component**

Table with order_id (orange mono), customer, items, total, status badge, speedy tracking, date.

- [ ] **Step 6: Verify dashboard renders with data**

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: wire dashboard to real Supabase data with stats, charts, and tables"
```

---

## Phase 8: Vercel Config + Deploy

### Task 14: Vercel configuration + production deploy

**Files:**
- Create: `vercel.json` (cron config)
- Modify: `.env` on Vercel dashboard

- [ ] **Step 1: Create vercel.json with cron jobs**

```json
{
  "crons": [
    { "path": "/api/cron/sync-meta", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/sync-klaviyo", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/sync-speedy", "schedule": "*/5 * * * *" }
  ]
}
```

- [ ] **Step 2: Set environment variables in Vercel**

Add all env vars from `.env.local.example` to Vercel project settings.

- [ ] **Step 3: Connect GitHub repo to Vercel**

Link the repo for automatic deployments.

- [ ] **Step 4: Deploy to production**

```bash
vercel --prod
```

- [ ] **Step 5: Create initial admin user**

In Supabase Dashboard:
1. Create auth user (email + password) for Божо
2. Insert matching row in `users` table with role 'admin'
3. Test login on production URL

- [ ] **Step 6: Verify all cron jobs fire**

Check Vercel dashboard → Cron Jobs tab. Verify sync runs and data appears in marketing dashboard.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: add Vercel cron config and production deployment"
```

---

## Phase 9: Settings + User Management

### Task 15: Admin settings page (user management)

**Files:**
- Create: `app/(admin)/settings/page.tsx`
- Create: `app/(admin)/settings/actions.ts`
- Create: `components/admin/settings/user-form.tsx`

- [ ] **Step 1: Create user management server actions**

`app/(admin)/settings/actions.ts`:
- `createUser(formData)` — create Supabase auth user + insert `users` row with role
- `updateUserRole(userId, role)` — update role in `users` table
- `deleteUser(userId)` — delete from `users` + Supabase auth (using service role key)
- All actions check that current user has 'admin' role before proceeding

- [ ] **Step 2: Create user form component**

`components/admin/settings/user-form.tsx`:
- Client component
- Fields: name, email, password (for new users), role (select: admin/manager/staff)
- Used in dialog for creating new users

- [ ] **Step 3: Create settings page**

`app/(admin)/settings/page.tsx`:
- Server component, verify role === 'admin' (redirect otherwise)
- Table of all users: name, email, role, created_at
- "Добави потребител" button opens dialog with user form
- Role dropdown per user row for quick role change
- Delete button with confirmation dialog

- [ ] **Step 4: Add Settings nav item to sidebar**

Add to `sidebar-nav.tsx` navSections under a new "Настройки" section with Settings icon. Only visible to admin role (already handled by sectionAccess).

- [ ] **Step 5: Commit**

```bash
git add app/(admin)/settings/ components/admin/settings/ components/admin/sidebar-nav.tsx
git commit -m "feat: add settings page with user management (admin only)"
```

---

## Phase 10: Data Migration

### Task 16: WooCommerce data migration script

**Files:**
- Create: `scripts/migrate-woocommerce.ts`

- [ ] **Step 1: Create migration script**

`scripts/migrate-woocommerce.ts`:
- Connect to WooCommerce REST API using credentials from bosy-bot-portable
- Fetch all products → transform to Supabase `products` schema → insert
- Fetch all orders → extract unique customers → insert into `customers`
- Insert orders with FK to customers
- Download product images → upload to Supabase Storage → update image URLs
- Log progress and errors

```bash
# Run with:
npx tsx scripts/migrate-woocommerce.ts
```

- [ ] **Step 2: Add WooCommerce env vars to .env.local.example**

```
WOOCOMMERCE_URL=https://bosy.bg
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
```

- [ ] **Step 3: Run migration on staging**

Run the script, verify data in Supabase dashboard:
- Check product count matches WooCommerce
- Check images load from Supabase Storage
- Check customer deduplication
- Check order totals match

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-woocommerce.ts .env.local.example
git commit -m "feat: add WooCommerce data migration script"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1. Foundation | 1-4 | Working app with auth, login, admin sidebar |
| 2. Products | 5-6 | Full product CRUD with images |
| 3. Orders + Speedy | 7-8 | Order management + courier integration |
| 4. Customers | 9 | Customer database + profiles |
| 5. Marketing | 10-11 | Meta Ads + Klaviyo dashboards with auto-sync |
| 6. Content | 12 | Banner, blog, review management |
| 7. Dashboard | 13 | Real data on dashboard |
| 8. Deploy | 14 | Production deployment with cron jobs |
| 9. Settings | 15 | User management (admin only) |
| 10. Migration | 16 | WooCommerce data import |
