/**
 * Минимален Telegram helper за server-side admin alerts.
 *
 * Използва TELEGRAM_BOT_TOKEN (вече set на production за clawbot webhook-a).
 * Праща в DM на админа (chat_id 1755421488 = Симеон).
 */

const ADMIN_CHAT_ID = 1755421488

export async function notifyAdmin(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('[notify] TELEGRAM_BOT_TOKEN missing — admin alert dropped')
    return
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      },
    )

    if (!res.ok) {
      const body = await res.text()
      console.error(`[notify] Telegram failed (${res.status}):`, body)
    }
  } catch (e) {
    console.error('[notify] Telegram exception:', e)
  }
}
