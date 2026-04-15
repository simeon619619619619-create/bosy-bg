import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { CLAWBOT_SYSTEM_PROMPT } from '@/lib/clawbot/system-prompt'

export const maxDuration = 60

const ALLOWED_CHAT_IDS = new Set<number>([
  1755421488,
  -1003898873921,
])

const MODEL = 'anthropic/claude-sonnet-4.5'

type TelegramUpdate = {
  message?: {
    message_id: number
    chat: { id: number; type: string }
    from?: { id: number; first_name?: string; username?: string }
    text?: string
  }
}

async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyTo?: number,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing')
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_parameters: replyTo ? { message_id: replyTo } : undefined,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('Telegram sendMessage failed', res.status, body)
  }
}

async function sendChatAction(chatId: number, action: 'typing') {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action }),
  }).catch(() => {})
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const header = request.headers.get('x-telegram-bot-api-secret-token')
    if (header !== secret) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const msg = update.message
  if (!msg || !msg.text) return NextResponse.json({ ok: true })

  const chatId = msg.chat.id
  if (!ALLOWED_CHAT_IDS.has(chatId)) {
    console.warn('Clawbot: unauthorized chat', chatId, msg.from?.username)
    return NextResponse.json({ ok: true })
  }

  const userText = msg.text.trim()
  if (!userText) return NextResponse.json({ ok: true })

  if (userText === '/start' || userText === '/help') {
    await sendTelegramMessage(
      chatId,
      'BOSY COO онлайн. Питай за поръчки, маркетинг, сайта или анализ. Пиши като на колега.',
      msg.message_id,
    )
    return NextResponse.json({ ok: true })
  }

  if (userText === '/ping') {
    await sendTelegramMessage(chatId, 'pong', msg.message_id)
    return NextResponse.json({ ok: true })
  }

  try {
    await sendChatAction(chatId, 'typing')
    const { text } = await generateText({
      model: MODEL,
      system: CLAWBOT_SYSTEM_PROMPT,
      prompt: userText,
    })
    await sendTelegramMessage(chatId, text || '(празен отговор)', msg.message_id)
  } catch (err) {
    console.error('Clawbot generateText error', err)
    await sendTelegramMessage(
      chatId,
      `Грешка: ${err instanceof Error ? err.message : String(err)}`,
      msg.message_id,
    )
  }

  return NextResponse.json({ ok: true })
}
