import { Separator } from '@/components/ui/separator'
import { SidebarNav } from './sidebar-nav'

interface SidebarProps {
  user: {
    name: string
    email: string
    role: string
  }
}

function UserInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {initials}
    </div>
  )
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-dvh w-[260px] flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold tracking-[3px] text-primary">
          BOSY
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">Admin Panel</p>
      </div>

      <Separator />

      {/* Navigation */}
      <SidebarNav role={user.role} />

      {/* User info */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <UserInitials name={user.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">
              {user.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
