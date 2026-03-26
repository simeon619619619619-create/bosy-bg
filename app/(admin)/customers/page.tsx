import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { toEur } from '@/lib/currency'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Users } from 'lucide-react'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { search } = await searchParams
  const searchQuery = typeof search === 'string' ? search : ''

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
    )
  }

  const { data: customers } = await query

  return (
    <div>
      {/* Header */}
      <h1 className="text-3xl font-bold">Клиенти</h1>

      {/* Search */}
      <form className="mt-6" action="/customers" method="GET">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Търси по име, email или телефон..."
            defaultValue={searchQuery}
            className="pl-9"
          />
        </div>
      </form>

      {/* Table */}
      {!customers || customers.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Няма клиенти</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? `Няма резултати за "${searchQuery}"`
              : 'Все още няма регистрирани клиенти'}
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Поръчки</TableHead>
                <TableHead>Общо похарчени</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="hover:underline"
                    >
                      {customer.name ?? '—'}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.email ?? '—'}</TableCell>
                  <TableCell>{customer.phone ?? '—'}</TableCell>
                  <TableCell>{customer.total_orders ?? 0}</TableCell>
                  <TableCell className="font-mono">
                    {toEur(Number(customer.total_spent ?? 0)).toFixed(2)} &euro;
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(customer.created_at).toLocaleDateString('bg-BG')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
