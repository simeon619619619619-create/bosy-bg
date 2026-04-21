import 'dotenv/config'

const RESEND_KEY = (process.env.RESEND_API_KEY || '').replace(/^"|"$/g, '')
if (!RESEND_KEY) throw new Error('RESEND_API_KEY missing')

const TO = process.argv[2] || 'simeon619619619619@gmail.com'
const FROM = 'Саня Ганчева <sanya@bosy.bg>'
const REPLY_TO = 'sanya@bosy.bg'
const SUBJECT = 'BOSY в магазина Ви'

const text = `Здравейте,

Търсим партньори сред квартални и денонощни магазини за дистрибуция на протеинови барове BOSY — български продукт без захар, с добър margin за Вас.

Интересно ли Ви е да пратя каталог и мостри?

Саня Ганчева
BOSY Healthy Kitchen
0887 808 808
bosy.bg

„Боси Хелти" ООД, ЕИК 206532236. Не желаете писма? Отговорете „откажи".`

const html = `<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;">
<p>Здравейте,</p>
<p>Търсим партньори сред квартални и денонощни магазини за дистрибуция на протеинови барове BOSY — български продукт без захар, с добър margin за Вас.</p>
<p>Интересно ли Ви е да пратя каталог и мостри?</p>
<p>Саня Ганчева<br>BOSY Healthy Kitchen<br>0887 808 808<br>bosy.bg</p>
<p style="color:#999;font-size:11px;">„Боси Хелти" ООД, ЕИК 206532236. Не желаете писма? Отговорете „откажи".</p>
</div>`

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${RESEND_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: FROM,
    to: [TO],
    reply_to: REPLY_TO,
    subject: SUBJECT,
    html,
    text,
    headers: {
      'List-Unsubscribe': '<mailto:sanya@bosy.bg?subject=откажи>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    tags: [{ name: 'campaign', value: 'b2b_v3_primary_test' }],
  }),
})

const body = await res.json()
console.log(res.status, JSON.stringify(body, null, 2))
