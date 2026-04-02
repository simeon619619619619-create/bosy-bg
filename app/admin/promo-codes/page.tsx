import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toEur } from '@/lib/currency'
import { PromoCodeToggle } from '@/components/admin/promo-codes/promo-toggle'
import { DeletePromoButton } from '@/components/admin/promo-codes/delete-promo-button'

export default async function PromoCodesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: codes } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Промо кодове</h1>
        <Button render={<Link href="/admin/promo-codes/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          Нов промо код
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Код</th>
              <th className="px-4 py-3 font-medium">Отстъпка</th>
              <th className="px-4 py-3 font-medium">Мин. поръчка</th>
              <th className="px-4 py-3 font-medium">Използвания</th>
              <th className="px-4 py-3 font-medium">Изтича</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(!codes || codes.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Няма промо кодове. Създайте първия!
                </td>
              </tr>
            )}
            {codes?.map((code) => (
              <tr key={code.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono font-bold">{code.code}</td>
                <td className="px-4 py-3">
                  {code.discount_type === 'percent'
                    ? `${code.discount_value}%`
                    : `${toEur(Number(code.discount_value)).toFixed(2)} €`}
                </td>
                <td className="px-4 py-3">
                  {Number(code.min_order_amount) > 0
                    ? `${toEur(Number(code.min_order_amount)).toFixed(2)} €`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {code.used_count}{code.max_uses ? ` / ${code.max_uses}` : ''}
                </td>
                <td className="px-4 py-3">
                  {code.expires_at
                    ? new Date(code.expires_at).toLocaleDateString('bg-BG')
                    : 'Без срок'}
                </td>
                <td className="px-4 py-3">
                  <PromoCodeToggle id={code.id} active={code.active} />
                </td>
                <td className="px-4 py-3">
                  <DeletePromoButton id={code.id} code={code.code} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
