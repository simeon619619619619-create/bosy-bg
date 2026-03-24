import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth'
import { Sidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-dvh">
      <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <main className="ml-[260px] p-8">{children}</main>
    </div>
  )
}
