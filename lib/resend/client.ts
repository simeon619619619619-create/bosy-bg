import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
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
        <p>Обща сума: <strong>${total.toFixed(2)} лв.</strong></p>
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
