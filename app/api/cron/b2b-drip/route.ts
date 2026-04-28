import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

const BATCH_SIZE = 50
const BG_TZ_OFFSET = 3 // UTC+3

function isBGWorkingHours(): boolean {
  const now = new Date()
  const bgHour = (now.getUTCHours() + BG_TZ_OFFSET) % 24
  return bgHour >= 9 && bgHour < 18
}

function daysSince(date: string): number {
  return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
}

const SIGNATURE = `
      <p style="margin:24px 0 4px;font-size:15px;">Поздрави,</p>
      <p style="margin:0;font-size:15px;font-weight:bold;">Саня Генова</p>
      <p style="margin:2px 0;font-size:13px;color:#888;">Търговски екип · BOSY</p>
      <p style="margin:2px 0;font-size:13px;color:#888;">+359 87 989 89 88 · sales@bosy.bg</p>
      <p style="margin:2px 0;font-size:13px;color:#888;">bosy.bg</p>`

function email1Html(name: string): string {
  const greeting = name ? `Здравейте, ${name.split(/\s/)[0]}` : 'Здравейте'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#222;background:#fff;">
  <table style="max-width:560px;margin:0 auto;" cellpadding="0" cellspacing="0"><tr><td>
    <p style="margin:0 0 16px;font-size:15px;">${greeting},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Казвам се Саня Генова и съм от търговския екип на <strong>BOSY</strong> — българска марка за протеинови и функционални продукти без добавена захар.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Произвеждаме всичко в България:</p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.8;">
      <li>Протеинови барчета и топчета (6 вкуса)</li>
      <li>Газирани напитки BOSY Bubbles — с колаген, мака и витамини</li>
      <li>БИО протеинови кремове с макадамия</li>
      <li>Детокс серия — билкови капки и чай</li>
    </ul>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Прилагам продуктовия ни каталог. Можете да го разгледате и <a href="https://bosy.bg/bosy-b2b-catalogue.pdf" style="color:#c77dba;font-weight:bold;">онлайн тук</a>.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Бих искала да Ви предложа <strong>лична среща</strong> в обекта Ви, за да представя продуктите, да Ви оставя мостри и да обсъдим персонална оферта. Удобно ли е през следващите 1–2 седмици?</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Просто отговорете на този имейл с ден и час, или се обадете на <strong>+359 87 989 89 88</strong>.</p>
    ${SIGNATURE}
  </td></tr></table>
</body></html>`
}

function email2Html(name: string): string {
  const greeting = name ? `Здравейте, ${name.split(/\s/)[0]}` : 'Здравейте'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#222;background:#fff;">
  <table style="max-width:560px;margin:0 auto;" cellpadding="0" cellspacing="0"><tr><td>
    <p style="margin:0 0 16px;font-size:15px;">${greeting},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Пиша Ви отново за продуктите на BOSY. Видяхте ли каталога, който изпратих преди няколко дни?</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Все още държа на предложението — мога да дойда лично в обекта Ви, да представя продуктите и да оставя мостри. Срещата отнема 15–20 минути.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Кой ден и час Ви е удобен през следващата седмица? Или ми се обадете директно на <strong>+359 87 989 89 88</strong>.</p>
    ${SIGNATURE}
  </td></tr></table>
</body></html>`
}

function email3Html(name: string): string {
  const greeting = name ? `Здравейте, ${name.split(/\s/)[0]}` : 'Здравейте'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#222;background:#fff;">
  <table style="max-width:560px;margin:0 auto;" cellpadding="0" cellspacing="0"><tr><td>
    <p style="margin:0 0 16px;font-size:15px;">${greeting},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Това е последното ми писмо по тази тема.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Все още с удоволствие бих дошла на кратка среща в обекта Ви — носи мостри от всички серии и презентация на продуктите. Без ангажимент за поръчка.</p>
    <div style="margin:20px 0;padding:16px 20px;background:#f3e5f0;border-radius:10px;text-align:center;">
      <p style="margin:0;font-size:15px;color:#c77dba;font-weight:bold;">Свържете се за лична среща</p>
      <p style="margin:6px 0 0;font-size:14px;color:#444;">отговор на имейла или обаждане на <strong>+359 87 989 89 88</strong></p>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#888;">Няма да Ви пиша повече, освен ако не се свържете с нас.</p>
    ${SIGNATURE}
  </td></tr></table>
</body></html>`
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isBGWorkingHours()) {
    return NextResponse.json({ message: 'Outside BG working hours (9-18)', skipped: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const resend = new Resend(process.env.RESEND_API_KEY!)

  // Load PDF for email 1
  let pdfBuffer: Buffer | null = null
  try {
    pdfBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'bosy-b2b-catalogue.pdf'))
  } catch {
    console.error('Could not load B2B catalogue PDF')
  }

  // Find contacts that need emails (not replied, in order of priority)
  // Priority: needs email 1 > needs email 2 (3+ days after 1) > needs email 3 (7+ days after 1)

  let sent = 0
  const errors: string[] = []

  const debug: Record<string, unknown> = {}

  // Email 1: not sent yet
  if (sent < BATCH_SIZE) {
    const { data: batch1, error: e1 } = await supabase
      .from('b2b_campaigns')
      .select('*')
      .is('sent_1', null)
      .is('replied_at', null)
      .order('created_at')
      .limit(BATCH_SIZE - sent)

    debug.e1_query = { count: batch1?.length ?? 0, error: e1?.message }

    for (const contact of batch1 ?? []) {
      try {
        await resend.emails.send({
          from: 'Саня от BOSY <sales@bosy.bg>',
          replyTo: 'sales@bosy.bg',
          to: contact.email,
          subject: 'BOSY — протеинови продукти за Вашия обект',
          html: email1Html(contact.name),
          ...(pdfBuffer ? { attachments: [{ filename: 'BOSY-B2B-Каталог.pdf', content: pdfBuffer }] } : {}),
          headers: { 'X-Entity-Ref-ID': `b2b-1-${contact.id}` },
        })
        await supabase.from('b2b_campaigns').update({ sent_1: new Date().toISOString() }).eq('id', contact.id)
        sent++
      } catch (e) {
        errors.push(`${contact.email}: ${e instanceof Error ? e.message : 'unknown'}`)
      }
    }
  }

  // Email 2: sent_1 >= 3 days ago, sent_2 is null
  if (sent < BATCH_SIZE) {
    const { data: batch2 } = await supabase
      .from('b2b_campaigns')
      .select('*')
      .not('sent_1', 'is', null)
      .is('sent_2', null)
      .is('replied_at', null)
      .order('sent_1')
      .limit(BATCH_SIZE - sent)

    for (const contact of batch2 ?? []) {
      if (daysSince(contact.sent_1!) < 3) continue
      try {
        await resend.emails.send({
          from: 'Саня от BOSY <sales@bosy.bg>',
          replyTo: 'sales@bosy.bg',
          to: contact.email,
          subject: 'Кога Ви е удобно да дойда с мостри?',
          html: email2Html(contact.name),
          headers: { 'X-Entity-Ref-ID': `b2b-2-${contact.id}` },
        })
        await supabase.from('b2b_campaigns').update({ sent_2: new Date().toISOString() }).eq('id', contact.id)
        sent++
      } catch (e) {
        errors.push(`${contact.email}: ${e instanceof Error ? e.message : 'unknown'}`)
      }
    }
  }

  // Email 3: sent_1 >= 7 days ago, sent_3 is null
  if (sent < BATCH_SIZE) {
    const { data: batch3 } = await supabase
      .from('b2b_campaigns')
      .select('*')
      .not('sent_1', 'is', null)
      .is('sent_3', null)
      .is('replied_at', null)
      .order('sent_1')
      .limit(BATCH_SIZE - sent)

    for (const contact of batch3 ?? []) {
      if (daysSince(contact.sent_1!) < 7) continue
      try {
        await resend.emails.send({
          from: 'Саня от BOSY <sales@bosy.bg>',
          replyTo: 'sales@bosy.bg',
          to: contact.email,
          subject: 'Последно — среща с мостри без ангажимент',
          html: email3Html(contact.name),
          headers: { 'X-Entity-Ref-ID': `b2b-3-${contact.id}` },
        })
        await supabase.from('b2b_campaigns').update({ sent_3: new Date().toISOString() }).eq('id', contact.id)
        sent++
      } catch (e) {
        errors.push(`${contact.email}: ${e instanceof Error ? e.message : 'unknown'}`)
      }
    }
  }

  return NextResponse.json({
    sent,
    errors: errors.length,
    errorDetails: errors.slice(0, 5),
    timestamp: new Date().toISOString(),
    debug: { ...debug, pdf: pdfBuffer ? `${pdfBuffer.length} bytes` : 'missing' },
  })
}
