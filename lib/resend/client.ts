import { Resend } from 'resend'
import { toEur } from '@/lib/currency'

let resendClient: Resend | null = null

export function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export async function sendNewOrderNotification(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  total: number,
  items: Array<{ name: string; quantity: number; price: number }>
) {
  const resend = getResendClient()
  if (!resend) return null

  const itemsText = items
    .map(i => `  - ${i.name} × ${i.quantity} — ${toEur(i.price * i.quantity).toFixed(2)} EUR`)
    .join('\n')

  const itemsHtml = items
    .map(i => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-family:Georgia,serif;">${i.name}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;font-family:Georgia,serif;">${i.quantity}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-family:Georgia,serif;">${toEur(i.price * i.quantity).toFixed(2)} EUR</td></tr>`)
    .join('')

  const plainText = `Здравейте, ${customerName},

Получихме Вашата поръчка №${orderNumber}.

Детайли на поръчката:
${itemsText}

Обща сума: ${toEur(total).toFixed(2)} EUR

Ще Ви уведомим, когато пратката бъде изпратена.

Ако имате въпроси, моля отговорете на този имейл.

Поздрави,
Екипът на BOSY
bosy.bg`

  const customerHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#222;background:#fff;">
  <table style="max-width:560px;margin:0 auto;" cellpadding="0" cellspacing="0">
    <tr><td>
      <p style="margin:0 0 16px;font-size:15px;">Здравейте, ${customerName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">Получихме Вашата поръчка №${orderNumber}.</p>
      <p style="margin:0 0 8px;font-size:15px;">Детайли на поръчката:</p>
      <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:14px;" cellpadding="0" cellspacing="0">
        <tr>
          <th style="text-align:left;padding:8px 0;border-bottom:2px solid #222;">Продукт</th>
          <th style="text-align:center;padding:8px 0;border-bottom:2px solid #222;">Бр.</th>
          <th style="text-align:right;padding:8px 0;border-bottom:2px solid #222;">Сума</th>
        </tr>
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding:12px 0;font-weight:bold;font-size:15px;">Обща сума</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;font-size:15px;">${toEur(total).toFixed(2)} EUR</td>
        </tr>
      </table>
      <p style="margin:16px 0;font-size:15px;line-height:1.5;">Ще Ви уведомим, когато пратката бъде изпратена.</p>
      <p style="margin:16px 0;font-size:15px;line-height:1.5;">Ако имате въпроси, моля отговорете на този имейл.</p>
      <p style="margin:24px 0 4px;font-size:15px;">Поздрави,</p>
      <p style="margin:0;font-size:15px;">Екипът на BOSY</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">bosy.bg</p>
    </td></tr>
  </table>
</body>
</html>`

  // Send to customer — transactional style
  await resend.emails.send({
    from: 'BOSY <orders@bosy.bg>',
    replyTo: 'marketing@bosy.bg',
    to: customerEmail,
    subject: `Потвърждение за поръчка №${orderNumber}`,
    text: plainText,
    html: customerHtml,
    headers: {
      'X-Entity-Ref-ID': `order-${orderNumber}`,
      'X-Priority': '1',
    },
  }).catch(() => {})

  // Send to admin (simpler)
  await resend.emails.send({
    from: 'BOSY <orders@bosy.bg>',
    to: 'marketing@bosy.bg',
    subject: `Нова поръчка №${orderNumber} — ${customerName} — ${toEur(total).toFixed(2)} EUR`,
    text: `Нова поръчка №${orderNumber}\n\nКлиент: ${customerName} (${customerEmail})\n\n${itemsText}\n\nОбща сума: ${toEur(total).toFixed(2)} EUR`,
  }).catch(() => {})

  return true
}

export async function sendOrderConfirmation(to: string, orderNumber: number, total: number) {
  const resend = getResendClient()
  if (!resend) return null

  return resend.emails.send({
    from: 'BOSY <noreply@bosy.bg>',
    to,
    subject: `Поръчка #${orderNumber} — Потвърдена`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF7820;">BOSY</h1>
        <p>Здравейте,</p>
        <p>Вашата поръчка <strong>#${orderNumber}</strong> е потвърдена.</p>
        <p>Обща сума: <strong>${toEur(total).toFixed(2)} &euro;</strong></p>
        <p>Ще ви уведомим когато пратката бъде изпратена.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">BOSY — Healthy Kitchen</p>
      </div>
    `,
  })
}

export async function sendShippingNotification(to: string, orderNumber: number, trackingNumber: string) {
  const resend = getResendClient()
  if (!resend) return null

  return resend.emails.send({
    from: 'BOSY <noreply@bosy.bg>',
    to,
    subject: `Поръчка #${orderNumber} — Изпратена`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF7820;">BOSY</h1>
        <p>Здравейте,</p>
        <p>Вашата поръчка <strong>#${orderNumber}</strong> е изпратена с куриер Speedy.</p>
        <p>Tracking номер: <strong>${trackingNumber}</strong></p>
        <p>Можете да проследите пратката на <a href="https://www.speedy.bg/bg/track-shipment?shipmentNumber=${trackingNumber}">speedy.bg</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">BOSY — Healthy Kitchen</p>
      </div>
    `,
  })
}

export async function sendEasterPromoEmail(
  to: string,
  customerName: string,
  promoCode: string = 'VELIKDEN20'
) {
  const resend = getResendClient()
  if (!resend) return null

  return resend.emails.send({
    from: 'BOSY <marketing@bosy.bg>',
    replyTo: 'marketing@bosy.bg',
    to,
    subject: `${customerName}, имаме нещо специално за теб от BOSY`,
    headers: {
      'List-Unsubscribe': '<mailto:marketing@bosy.bg?subject=unsubscribe>',
    },
    text: `Весел Великден, ${customerName}!\n\nБлагодарим ти за поръчката! По случай Великден имаме специален подарък за теб.\n\nТвоят промо код: ${promoCode}\n20% отстъпка за следващата поръчка\n\nИзползвай кода при следващата си поръчка на https://bosy.bg/shop\n\nКодът е валиден до 30 април 2026 г.\n\nBOSY — Healthy Kitchen | bosy.bg`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#a78bfa,#7c3aed);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:3px;">BOSY</h1>
          <p style="color:#e8daff;margin:8px 0 0;font-size:14px;">Healthy Kitchen</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#333;margin:0 0 16px;font-size:22px;">Весел Великден, ${customerName}!</h2>
          <p style="color:#555;line-height:1.6;">Благодарим ти за поръчката! По случай Великден имаме специален подарък за теб:</p>
          <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px dashed #a78bfa;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="color:#7c3aed;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Твоят промо код</p>
            <p style="color:#7c3aed;font-size:32px;font-weight:bold;margin:0;letter-spacing:4px;">${promoCode}</p>
            <p style="color:#6d28d9;font-size:18px;margin:8px 0 0;font-weight:600;">20% за следващата поръчка</p>
          </div>
          <p style="color:#555;line-height:1.6;">Използвай кода при следващата си поръчка на <a href="https://bosy.bg/shop" style="color:#7c3aed;font-weight:600;">bosy.bg</a> и се възползвай от великденското предложение.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="https://bosy.bg/shop" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;">Към магазина</a>
          </div>
          <p style="color:#999;font-size:13px;margin-top:24px;">Кодът е валиден до 30 април 2026 г.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#999;font-size:12px;text-align:center;">BOSY — Healthy Kitchen | bosy.bg</p>
          <p style="color:#ccc;font-size:11px;text-align:center;">Получаваш този имейл, защото направи поръчка на bosy.bg</p>
        </div>
      </div>
    `,
  })
}

export async function sendEasterPromoReminder(
  to: string,
  customerName: string,
  promoCode: string = 'VELIKDEN20'
) {
  const resend = getResendClient()
  if (!resend) return null

  return resend.emails.send({
    from: 'BOSY <marketing@bosy.bg>',
    replyTo: 'marketing@bosy.bg',
    to,
    subject: `${customerName}, твоят код от BOSY все още те чака`,
    headers: {
      'List-Unsubscribe': '<mailto:marketing@bosy.bg?subject=unsubscribe>',
    },
    text: `Здравей, ${customerName}!\n\nПреди няколко дни ти изпратихме промо код с 20% за следващата ти поръчка, но забелязахме, че все още не си го използвал/а.\n\nТвоят промо код: ${promoCode}\n20% за следващата поръчка\n\nПазарувай на https://bosy.bg/shop\n\nКодът е валиден до 30 април 2026 г.\n\nBOSY — Healthy Kitchen | bosy.bg`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#a78bfa,#7c3aed);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:3px;">BOSY</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#333;margin:0 0 16px;font-size:22px;">Твоят код все още те чака</h2>
          <p style="color:#555;line-height:1.6;">Здравей, ${customerName}! Преди няколко дни ти изпратихме промо код с <strong>20%</strong> за следващата ти поръчка, но забелязахме, че все още не си го използвал/а.</p>
          <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px dashed #a78bfa;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="color:#7c3aed;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Твоят промо код</p>
            <p style="color:#7c3aed;font-size:32px;font-weight:bold;margin:0;letter-spacing:4px;">${promoCode}</p>
            <p style="color:#6d28d9;font-size:18px;margin:8px 0 0;font-weight:600;">20% за следващата поръчка</p>
          </div>
          <div style="text-align:center;margin:28px 0;">
            <a href="https://bosy.bg/shop" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;">Към магазина</a>
          </div>
          <p style="color:#999;font-size:13px;">Кодът е валиден до 30 април 2026 г.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#999;font-size:12px;text-align:center;">BOSY — Healthy Kitchen | bosy.bg</p>
          <p style="color:#ccc;font-size:11px;text-align:center;">Получаваш този имейл, защото направи поръчка на bosy.bg</p>
        </div>
      </div>
    `,
  })
}

export async function sendDeliveryConfirmation(to: string, orderNumber: number) {
  const resend = getResendClient()
  if (!resend) return null

  return resend.emails.send({
    from: 'BOSY <noreply@bosy.bg>',
    to,
    subject: `Поръчка #${orderNumber} — Доставена`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF7820;">BOSY</h1>
        <p>Здравейте,</p>
        <p>Вашата поръчка <strong>#${orderNumber}</strong> е доставена успешно.</p>
        <p>Благодарим ви, че пазарувате от BOSY!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">BOSY — Healthy Kitchen</p>
      </div>
    `,
  })
}
