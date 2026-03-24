import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserForm } from '@/components/admin/settings/user-form'
import { DeleteUserButton } from '@/components/admin/settings/delete-user-button'
import { RoleSelect } from '@/components/admin/settings/role-select'
import { Users } from 'lucide-react'

export default async function SettingsPage() {
  const currentUser = await getAuthUser()

  if (!currentUser || currentUser.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createServerSupabaseClient()
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Настройки</h1>
          <p className="mt-1 text-muted-foreground">
            Управление на потребители
          </p>
        </div>
        <UserForm />
      </div>

      {/* Table */}
      {!users || users.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Няма потребители</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Добави първия потребител
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име</TableHead>
                <TableHead>Имейл</TableHead>
                <TableHead>Роля</TableHead>
                <TableHead>Създаден на</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.id === currentUser.id ? (
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                    ) : (
                      <RoleSelect userId={user.id} currentRole={user.role} />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('bg-BG')}
                  </TableCell>
                  <TableCell>
                    {user.id === currentUser.id ? (
                      <span className="text-xs text-muted-foreground">
                        Текущ
                      </span>
                    ) : (
                      <DeleteUserButton id={user.id} name={user.name} />
                    )}
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
