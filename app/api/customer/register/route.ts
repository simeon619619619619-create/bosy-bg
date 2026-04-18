import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResendClient } from '@/lib/resend/client'

export async function POST(request: Request) {
  try {
    const { name, email, phone, source } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Липсва имейл.' }, { status: 400 })
    }

    if (!name && source !== 'newsletter-popup') {
      return NextResponse.json({ error: 'Липсват задължителни полета.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Auto-confirm the auth user (skip ugly Supabase verification email)
    const cleanEmail = email.toLowerCase().trim()
    const { data: { users: matchedUsers } } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${cleanEmail}`,
      page: 1,
      perPage: 1,
    })
    const authUser = matchedUsers?.[0]
    if (authUser && !authUser.email_confirmed_at) {
      await supabase.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
      })
    }

    // Check if customer already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json({ ok: true })
    }

    // Create new customer record
    const { error: insertError } = await supabase.from('customers').insert({
      name: name || email.split('@')[0],
      email: email.toLowerCase().trim(),
      phone: phone || null,
      address: { cashback_balance: 0, source: source || 'register' },
      total_orders: 0,
      total_spent: 0,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Send welcome email with promo code
    const customerName = name || email.split('@')[0]
    const resend = getResendClient()
    if (resend) {
      await resend.emails.send({
        from: 'BOSY <orders@bosy.bg>',
        replyTo: 'marketing@bosy.bg',
        to: email.toLowerCase().trim(),
        subject: `Добре дошъл в BOSY, ${customerName}! Ето твоите 20%`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:Georgia,'Times New Roman',serif;color:#222;background:#fff;">
  <table style="max-width:560px;margin:0 auto;" cellpadding="0" cellspacing="0">
    <tr><td>
      <p style="margin:0 0 16px;font-size:15px;">Здравей, ${customerName}!</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Благодарим ти, че се регистрира в BOSY. Като наш нов член, получаваш <strong>20% отстъпка</strong> за всички продукти до края на април.</p>

      <div style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;background:#c77dba;color:#fff;font-family:'Courier New',monospace;font-weight:bold;font-size:22px;padding:14px 32px;border-radius:10px;letter-spacing:3px;">WELCOME20</span>
      </div>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Просто въведи кода при поръчка на <a href="https://bosy.bg/shop" style="color:#c77dba;font-weight:bold;">bosy.bg</a> и отстъпката ще се приложи автоматично.</p>

      <p style="margin:0 0 16px;font-size:14px;color:#888;">Валиден до: 30 април 2026 г.</p>

      <p style="margin:24px 0;text-align:center;">
        <a href="https://bosy.bg/shop" style="display:inline-block;background:#c77dba;color:#fff;padding:14px 40px;border-radius:30px;font-family:Montserrat,sans-serif;font-weight:700;font-size:15px;text-decoration:none;">Пазарувай сега</a>
      </p>

      <p style="margin:16px 0;font-size:15px;line-height:1.6;">Ако имаш въпроси, просто отговори на този имейл.</p>
      <p style="margin:24px 0 4px;font-size:15px;">Поздрави,</p>
      <p style="margin:0;font-size:15px;">Екипът на BOSY</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">bosy.bg</p>
    </td></tr>
  </table>
</body>
</html>`,
        text: `Здравей, ${customerName}!\n\nБлагодарим ти, че се регистрира в BOSY.\n\nКато наш нов член, получаваш 20% отстъпка за всички продукти до края на април.\n\nТвоят код: WELCOME20\n\nВъведи го при поръчка на bosy.bg.\n\nВалиден до: 30 април 2026 г.\n\nПоздрави,\nЕкипът на BOSY`,
        headers: {
          'X-Entity-Ref-ID': `welcome-${Date.now()}`,
        },
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
