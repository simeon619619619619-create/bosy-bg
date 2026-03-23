# BOSY.BG Admin Panel — Design Spec

## Overview

Пълна миграция на bosy.bg от WooCommerce/статичен HTML към Next.js 16 + Supabase. Монолитен проект с публичен сайт и защитен админ панел. Тъмна тема с BOSY брандинг (оранжево #FF7820).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (Postgres + Auth + Storage)
- **UI:** shadcn/ui + Tailwind CSS
- **Fonts:** Geist Sans / Geist Mono
- **Deploy:** Vercel
- **Cron:** Vercel Cron (5-минутен sync)
- **External APIs:** Meta Graph API, Klaviyo API, Speedy API

## Architecture

Монолитен Next.js app с route groups:

```
bosy-bg/
├── app/
│   ├── (public)/              # Публичен сайт
│   │   ├── page.tsx           # Начална страница
│   │   ├── shop/              # Магазин с филтри
│   │   ├── product/[slug]/    # Продуктова страница
│   │   ├── cart/              # Количка
│   │   ├── checkout/          # Checkout
│   │   ├── blog/              # Блог
│   │   ├── about/             # За нас
│   │   ├── bosy-club/         # Клуб/лоялност
│   │   └── contacts/          # Контакти
│   ├── (admin)/               # Админ панел (auth protected)
│   │   ├── layout.tsx         # Sidebar + dark theme layout
│   │   ├── dashboard/         # Overview dashboard
│   │   ├── products/          # CRUD продукти
│   │   │   ├── page.tsx       # Списък + търсене + филтри
│   │   │   ├── new/page.tsx   # Нов продукт
│   │   │   └── [id]/page.tsx  # Редакция
│   │   ├── orders/            # Поръчки + Speedy
│   │   │   ├── page.tsx       # Списък с филтри по статус
│   │   │   └── [id]/page.tsx  # Детайли + Speedy actions
│   │   ├── customers/         # Клиентска база
│   │   │   ├── page.tsx       # Списък + търсене
│   │   │   └── [id]/page.tsx  # Профил + история
│   │   ├── marketing/         # Meta Ads + Klaviyo dashboard
│   │   │   ├── page.tsx       # Overview
│   │   │   ├── meta-ads/      # Детайлни Meta Ads данни
│   │   │   └── klaviyo/       # Klaviyo кампании/flows
│   │   ├── content/           # Банери, блог, ревюта
│   │   │   ├── page.tsx       # Списък по тип
│   │   │   ├── new/page.tsx   # Ново съдържание
│   │   │   └── [id]/page.tsx  # Редакция
│   │   └── settings/          # User management (admin only)
│   ├── api/
│   │   ├── cron/
│   │   │   ├── sync-meta/route.ts      # Meta Ads sync (5 мин)
│   │   │   ├── sync-klaviyo/route.ts   # Klaviyo sync (5 мин)
│   │   │   └── sync-speedy/route.ts    # Speedy статуси (5 мин)
│   │   ├── speedy/
│   │   │   ├── create-parcel/route.ts  # Създай пратка
│   │   │   ├── label/route.ts          # Генерирай етикет
│   │   │   └── track/route.ts          # Проследяване
│   │   └── auth/
│   │       └── callback/route.ts       # Supabase auth callback
│   └── proxy.ts               # Auth middleware
├── components/
│   ├── admin/                 # Admin UI (sidebar, stat cards, tables)
│   └── public/                # Public site компоненти
├── lib/
│   ├── supabase/              # Client + server + types
│   ├── speedy/                # Speedy API wrapper
│   ├── meta-ads/              # Meta Graph API fetcher
│   └── klaviyo/               # Klaviyo API fetcher
└── supabase/
    └── migrations/            # DB schema migrations
```

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | gen_random_uuid() |
| email | TEXT UNIQUE | NOT NULL |
| name | TEXT | NOT NULL |
| role | TEXT | 'admin' / 'manager' / 'staff' |
| created_at | TIMESTAMPTZ | now() |

### products
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | NOT NULL |
| slug | TEXT UNIQUE | URL-friendly |
| description | TEXT | |
| price | NUMERIC(10,2) | |
| compare_price | NUMERIC(10,2) | Стара цена |
| category | TEXT | |
| images | JSONB | Array от URL-ове |
| variants | JSONB | Размери, вкусове |
| stock_quantity | INTEGER | |
| is_active | BOOLEAN | |
| created_at / updated_at | TIMESTAMPTZ | |

### customers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | |
| email | TEXT UNIQUE | |
| phone | TEXT | |
| address | JSONB | Адрес за доставка |
| total_orders | INTEGER | Агрегирано |
| total_spent | NUMERIC(10,2) | Агрегирано |
| created_at | TIMESTAMPTZ | |

### orders
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_number | SERIAL | Пореден номер |
| customer_id | UUID FK → customers | |
| status | TEXT | pending/confirmed/shipped/delivered/cancelled |
| items | JSONB | Продукти в поръчката |
| subtotal | NUMERIC(10,2) | |
| shipping_cost | NUMERIC(10,2) | |
| total | NUMERIC(10,2) | |
| speedy_tracking_number | TEXT | |
| speedy_parcel_id | TEXT | |
| notes | TEXT | |
| created_at / updated_at | TIMESTAMPTZ | |

### meta_ads_cache
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| campaign_id | TEXT | |
| campaign_name | TEXT | |
| status | TEXT | |
| impressions | INTEGER | |
| clicks | INTEGER | |
| spend | NUMERIC(10,2) | |
| conversions | INTEGER | |
| date | DATE | |
| synced_at | TIMESTAMPTZ | Кога е синхронизирано |

### klaviyo_cache
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| metric_type | TEXT | campaigns/flows/profiles/stats |
| data | JSONB | Кеширани данни |
| synced_at | TIMESTAMPTZ | |

### content_blocks
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| type | TEXT | banner/blog/review |
| title | TEXT | |
| body | TEXT | |
| image_url | TEXT | Supabase Storage |
| is_published | BOOLEAN | |
| position | INTEGER | Подредба |
| created_at / updated_at | TIMESTAMPTZ | |

### shipments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_id | UUID FK → orders | |
| parcel_id | TEXT | Speedy parcel ID |
| tracking_number | TEXT | |
| status | TEXT | |
| status_history | JSONB | Timeline на статуси |
| label_url | TEXT | PDF етикет |
| created_at / updated_at | TIMESTAMPTZ | |

### RLS политики
- **staff:** SELECT на orders, customers, shipments
- **manager:** ALL на всичко БЕЗ users таблицата
- **admin:** ALL на всичко

## Cron Sync (на всеки 5 минути)

Три Vercel cron job-а в `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/sync-meta", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/sync-klaviyo", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/sync-speedy", "schedule": "*/5 * * * *" }
  ]
}
```

- **sync-meta:** Тегли campaign данни от Meta Graph API v25.0 → записва в `meta_ads_cache`
- **sync-klaviyo:** Тегли profiles count, campaign stats, flow stats → записва в `klaviyo_cache`
- **sync-speedy:** Проверява статуси на активни пратки → обновява `shipments` и `orders`

Всеки cron endpoint верифицира `CRON_SECRET` header.

## Speedy Integration

Пълен flow:
1. **Нова поръчка** → статус `pending`
2. **Потвърждаване** → admin натиска "Потвърди" → статус `confirmed`
3. **Създай пратка** → admin натиска "Изпрати с Speedy" → API call към Speedy → създава shipment record → статус `shipped`
4. **Етикет** → генерира PDF етикет за принтиране
5. **Проследяване** → cron обновява статуса автоматично
6. **Доставена** → cron засича delivery → статус `delivered`, нотификация

## Auth Flow

1. Supabase Auth с email/password (magic link опционално)
2. `proxy.ts` проверява сесията на всеки `(admin)/*` route
3. Ако няма сесия → redirect към `/login`
4. Роля се чете от `users` таблицата, not от Supabase auth metadata
5. RLS политики enforce permissions на DB ниво

## UI Design

- **Тема:** Тъмен фон (#0F0B14) + оранжево (#FF7820) акценти
- **Компоненти:** shadcn/ui customized с BOSY цветове
- **Шрифтове:** Geist Sans за UI, Geist Mono за числа/кодове
- **Sidebar:** Фиксиран, 260px, с навигация групирана по секции
- **Dashboard:** 4 stat карти + графика приходи + топ продукти + маркетинг overview + последни поръчки
- **Таблици:** Сортиране, филтри, търсене, пагинация
- **Responsive:** Sidebar скрит на mobile, hamburger menu

## Data Migration

Еднократна миграция от WooCommerce:
1. Export продукти от WooCommerce REST API → import в Supabase `products`
2. Export поръчки → import в `orders` + `customers`
3. Снимки → upload в Supabase Storage
4. Верификация на данните

## Environment Variables

```
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
