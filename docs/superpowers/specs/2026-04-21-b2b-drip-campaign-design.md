# BOSY B2B Drip Campaign

## Overview

3-email drip sequence to 1529 convenience stores in Bulgaria. Auto-stop on reply — once a contact replies, they never receive another automated email.

## Contacts

- Source: `scripts/b2b_list_clean.jsonl` (1529 records)
- Fields per record: email, domain, name, city, phone
- Sender: `Саня от BOSY <sales@bosy.bg>`, replyTo: `sales@bosy.bg`

## Schedule

- **Rate:** 50 emails/hour
- **Hours:** 9:00-18:00 Bulgaria time (UTC+3) only
- **Interval:** Day 1 → Day 3 → Day 7
- **Total duration:** ~3.4 working days per wave

## Email Sequence

### Email 1 (Day 1) — Introduction + Catalogue

- Subject: "BOSY — протеинови продукти за Вашия обект"
- Content: Introduction of BOSY, product lines (bars, balls, Bubbles drinks, creams, detox), B2B pricing from 0.96 лв., no MOQ for first order on select products
- Attachment: PDF catalogue (`public/bosy-b2b-catalogue.pdf`)
- CTA: "Отговорете на този имейл за мостри"

### Email 2 (Day 3) — Reminder

- Subject: "Видяхте ли ценовата листа?"
- Content: Short (5 lines max), reference to Email 1, highlight no MOQ + nationwide delivery
- No attachment
- CTA: Reply for samples or call +359 879 89 89 88

### Email 3 (Day 7) — Last chance + 5% bonus

- Subject: "5% допълнителна отстъпка за 3 месеца"
- Content: Exclusive 5% discount on top of B2B prices for the first 3 months. "This is our last message unless you write to us."
- No attachment
- CTA: Reply to claim the offer

## Auto-Stop Rules

1. If a contact replies to ANY email → set `replied_at` timestamp
2. If `replied_at` is set → NEVER send another automated email to this contact
3. Check for replies BEFORE each send batch

## Technical Design

### Database: `b2b_campaigns` table (Supabase)

```sql
CREATE TABLE b2b_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  city TEXT,
  phone TEXT,
  sent_1 TIMESTAMPTZ,
  sent_2 TIMESTAMPTZ,
  sent_3 TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Cron: `/api/cron/b2b-drip`

- Runs every hour via Vercel cron
- Only executes between 09:00-18:00 BG time
- Each run:
  1. Check for replies (via sent email tracking or manual marking in admin)
  2. Find next 50 contacts to email (prioritize: needs email 1 > needs email 2 > needs email 3)
  3. Send via Resend with appropriate template
  4. Update sent_1/sent_2/sent_3 timestamps

### Reply Detection

- Resend webhook on reply (if available)
- Manual marking in admin panel
- Future: Gmail OAuth scan (already exists for EFI)

### Admin UI: `/admin/marketing/b2b`

- Table showing all 1529 contacts with status (not sent / email 1 / email 2 / email 3 / replied)
- Filter by status, city
- Manual "Mark as replied" button
- Pause/resume campaign toggle
- Stats: sent count, reply count, reply rate per email

## Signature

All emails signed:
```
Поздрави,
Саня Генова
Търговски екип · BOSY
+359 879 89 89 88 · sales@bosy.bg
bosy.bg
```
