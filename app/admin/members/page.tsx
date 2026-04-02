import { toEur } from '@/lib/currency'
import { StatCard } from '@/components/admin/dashboard/stat-card'
import { Users } from 'lucide-react'
import { getRegisteredUsers } from './actions'
import { MembersTable } from './members-table'

export default async function MembersPage() {
  const users = await getRegisteredUsers()

  // ── Stats ──────────────────────────────────────────────────
  const totalUsers = users.length
  const verifiedCount = users.filter((u) => u.email_verified).length
  const unverifiedCount = totalUsers - verifiedCount

  const totalCashback = users.reduce((sum, u) => sum + u.cashback_balance, 0)

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000)
  const activeThisMonth = users.filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= thirtyDaysAgo
  ).length

  return (
    <div>
      {/* Header */}
      <h1 className="text-3xl font-bold">Регистрирани клиенти</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Всички потребители с акаунт в магазина.
      </p>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Общо регистрирани"
          value={String(totalUsers)}
          valueColor="text-primary"
        />
        <StatCard
          label="Потвърдени / Непотвърдени"
          value={`${verifiedCount} / ${unverifiedCount}`}
          changeText={`${verifiedCount > 0 ? ((verifiedCount / totalUsers) * 100).toFixed(0) : 0}% потвърдени`}
          direction="neutral"
        />
        <StatCard
          label="Общо кешбак раздаден"
          value={`${toEur(totalCashback).toFixed(2)} \u20AC`}
          valueColor="text-green-500"
        />
        <StatCard
          label="Активни този месец"
          value={String(activeThisMonth)}
          changeText={`от ${totalUsers} общо`}
          direction="neutral"
        />
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Няма регистрирани потребители</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Все още няма потребители с акаунт.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <MembersTable users={users} />
        </div>
      )}
    </div>
  )
}
