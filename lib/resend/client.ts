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
  items: Array<{ name: string; quantity: number; price: number }>,
  paymentMethod: 'cod' | 'card' = 'cod'
) {
  const resend = getResendClient()
  if (!resend) return null

  const payTag = paymentMethod === 'card' ? '💳 КАРТА (платена)' : '📦 НАЛОЖЕН ПЛАТЕЖ'

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

  // Send to admin (simpler) — payment method goes in the subject so opening
  // the email is enough to know if money has actually been collected.
  await resend.emails.send({
    from: 'BOSY <orders@bosy.bg>',
    to: 'marketing@bosy.bg',
    subject: `[${payTag}] Нова поръчка №${orderNumber} — ${customerName} — ${toEur(total).toFixed(2)} EUR`,
    text: `${payTag}\n\nНова поръчка №${orderNumber}\n\nКлиент: ${customerName} (${customerEmail})\n\n${itemsText}\n\nОбща сума: ${toEur(total).toFixed(2)} EUR`,
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

  const plainText = `Здравейте, ${customerName},

Благодарим Ви, че избрахте BOSY за Вашата покупка. За нас е важно всеки клиент да си тръгне доволен.

Като малък знак на признателност, прикачихме личен код към Вашия акаунт, който да използвате при следваща Ви визита при нас:

${promoCode}

Кодът е валиден до 30 април 2026 г. и ще се появи автоматично при следващо пазаруване на bosy.bg.

Ако нещо не е наред с поръчката Ви или имате въпрос - просто отговорете на този имейл, ще получите личен отговор.

Топли поздрави,
Саня и Бояна
BOSY`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#222;background:#fff;">
  <table style="max-width:560px;margin:0 auto;" cellpadding="0" cellspacing="0">
    <tr><td>
      <p style="margin:0 0 16px;font-size:15px;">Здравейте, ${customerName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Благодарим Ви, че избрахте BOSY за Вашата покупка. За нас е важно всеки клиент да си тръгне доволен.</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Като малък знак на признателност, прикачихме личен код към Вашия акаунт, който да използвате при следваща Ви визита при нас:</p>

      <p style="margin:20px 0;font-size:15px;line-height:1.6;">
        Код: <span style="font-family:'Courier New',monospace;font-weight:bold;">${promoCode}</span>
      </p>

      <p style="margin:16px 0;font-size:15px;line-height:1.6;">Кодът е валиден до 30 април 2026 г. и ще се появи автоматично при следващо пазаруване на <a href="https://bosy.bg" style="color:#222;">bosy.bg</a>.</p>
      <p style="margin:16px 0;font-size:15px;line-height:1.6;">Ако нещо не е наред с поръчката Ви или имате въпрос - просто отговорете на този имейл, ще получите личен отговор.</p>
      <p style="margin:24px 0 4px;font-size:15px;">Топли поздрави,</p>
      <p style="margin:0;font-size:15px;">Саня и Бояна</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">BOSY</p>
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: 'Саня и Бояна от BOSY <orders@bosy.bg>',
    replyTo: 'marketing@bosy.bg',
    to,
    subject: `Лично от нас, ${customerName}`,
    text: plainText,
    html,
    headers: {
      'X-Entity-Ref-ID': `thank-you-${Date.now()}`,
      'X-Priority': '1',
    },
  })
}

export async function sendEasterPromoReminder(
  to: string,
  customerName: string,
  promoCode: string = 'VELIKDEN20'
) {
  const resend = getResendClient()
  if (!resend) return null

  const plainText = `Здравейте, ${customerName},

Преди няколко дни Ви изпратихме личен код към акаунта Ви, но виждаме, че още не сте го използвали. Може да сме го пропуснали в спам папката Ви - случва се с нови имейли.

Кодът Ви е: ${promoCode}

Валиден до 30 април 2026 г. Прикрепен е автоматично към акаунта Ви - просто пазарувайте на bosy.bg, ще се появи сам.

Ако имате въпрос или нещо не работи, отговорете на този имейл - ще получите личен отговор.

Топли поздрави,
Саня и Бояна
BOSY`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#222;background:#fff;">
  <table style="max-width:560px;margin:0 auto;" cellpadding="0" cellspacing="0">
    <tr><td>
      <p style="margin:0 0 16px;font-size:15px;">Здравейте, ${customerName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Преди няколко дни Ви изпратихме личен код към акаунта Ви, но виждаме, че още не сте го използвали. Може да сме го пропуснали в спам папката Ви - случва се с нови имейли.</p>

      <p style="margin:20px 0;font-size:15px;line-height:1.6;">
        Кодът Ви е: <span style="font-family:'Courier New',monospace;font-weight:bold;">${promoCode}</span>
      </p>

      <p style="margin:16px 0;font-size:15px;line-height:1.6;">Валиден до 30 април 2026 г. Прикрепен е автоматично към акаунта Ви - просто пазарувайте на <a href="https://bosy.bg" style="color:#222;">bosy.bg</a>, ще се появи сам.</p>
      <p style="margin:16px 0;font-size:15px;line-height:1.6;">Ако имате въпрос или нещо не работи, отговорете на този имейл - ще получите личен отговор.</p>
      <p style="margin:24px 0 4px;font-size:15px;">Топли поздрави,</p>
      <p style="margin:0;font-size:15px;">Саня и Бояна</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">BOSY</p>
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: 'Саня и Бояна от BOSY <orders@bosy.bg>',
    replyTo: 'marketing@bosy.bg',
    to,
    subject: `Напомняне за Вас, ${customerName}`,
    text: plainText,
    html,
    headers: {
      'X-Entity-Ref-ID': `reminder-${Date.now()}`,
      'X-Priority': '1',
    },
  })
}

export async function sendAbandonedCartReminder(
  to: string,
  customerName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number
) {
  const resend = getResendClient()
  if (!resend) return null

  const itemsHtml = items
    .map(i => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${i.name}</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;">${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;">${toEur(i.price * i.quantity).toFixed(2)} EUR</td></tr>`)
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#222;background:#fff;">
  <table style="max-width:560px;margin:0 auto;" cellpadding="0" cellspacing="0">
    <tr><td>
      <p style="margin:0 0 16px;font-size:15px;">Здравейте, ${customerName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Забелязахме, че не довършихте поръчката си. Вашите продукти все още Ви чакат:</p>

      <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:14px;" cellpadding="0" cellspacing="0">
        <tr>
          <th style="text-align:left;padding:8px 0;border-bottom:2px solid #222;">Продукт</th>
          <th style="text-align:center;padding:8px 0;border-bottom:2px solid #222;">Бр.</th>
          <th style="text-align:right;padding:8px 0;border-bottom:2px solid #222;">Сума</th>
        </tr>
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding:12px 0;font-weight:bold;">Обща сума</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;">${toEur(total).toFixed(2)} EUR</td>
        </tr>
      </table>

      <p style="margin:16px 0;font-size:15px;line-height:1.6;">Използвайте код <span style="font-family:'Courier New',monospace;font-weight:bold;color:#c0392b;">VELIKDEN20</span> за 20% отстъпка!</p>

      <p style="margin:24px 0;text-align:center;">
        <a href="https://bosy.bg/shop" style="display:inline-block;background:linear-gradient(135deg,#c77dba 0%,#f472b6 50%,#60a5fa 100%);color:#fff;padding:14px 40px;border-radius:30px;font-family:Montserrat,sans-serif;font-weight:700;font-size:15px;text-decoration:none;">ДОВЪРШИ ПОРЪЧКАТА</a>
      </p>

      <p style="margin:16px 0;font-size:15px;line-height:1.6;">Ако имате въпрос, просто отговорете на този имейл.</p>
      <p style="margin:24px 0 4px;font-size:15px;">Поздрави,</p>
      <p style="margin:0;font-size:15px;">Екипът на BOSY</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">bosy.bg</p>
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: 'BOSY <orders@bosy.bg>',
    replyTo: 'marketing@bosy.bg',
    to,
    subject: `${customerName}, забравихте нещо в кошницата`,
    text: `Здравейте, ${customerName}, забелязахме, че не довършихте поръчката си. Използвайте код VELIKDEN20 за 20% отстъпка! Довършете поръчката на bosy.bg/shop`,
    html,
    headers: {
      'X-Entity-Ref-ID': `abandoned-${Date.now()}`,
    },
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
