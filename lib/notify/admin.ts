/**
 * Admin notification helper — праща email до собственика чрез Resend.
 *
 * History: преди ползвахме Telegram (lib/telegram/notify.ts), но токенът на
 * @bosy_bitchy_bot е revoked в Telegram и не работи на production. Email
 * е по-стабилен канал — Resend е вече конфигуриран и тестнат за BOSY.
 *
 * Получател: личният Gmail на Симеон (notification на телефона + търсимо).
 */

import { getResendClient } from '@/lib/resend/client'

const ADMIN_EMAIL = 'simeon619619619619@gmail.com'
const FROM = 'BOSY Alerts <orders@bosy.bg>'

interface NotifyOptions {
  subject: string
  body: string
  /** При true — изпраща се без значение от ENV check (за дебъг) */
  force?: boolean
}

export async function notifyAdmin({
  subject,
  body,
  force = false,
}: NotifyOptions): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[notify] Resend client missing — admin alert dropped')
    return
  }

  if (!force && process.env.NODE_ENV === 'test') {
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject,
      // Plain-text + малко HTML за readability в Gmail mobile
      text: body,
      html: `<pre style="font-family:ui-monospace,monospace;font-size:13px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(body)}</pre>`,
    })

    if (error) {
      console.error('[notify] Resend error:', error)
    }
  } catch (e) {
    console.error('[notify] Resend exception:', e)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
