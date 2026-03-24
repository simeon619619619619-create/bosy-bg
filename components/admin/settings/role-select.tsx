'use client'

import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserRole } from '@/app/(admin)/settings/actions'

export function RoleSelect({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Select
      value={currentRole}
      onValueChange={(value) => {
        startTransition(async () => {
          await updateUserRole(userId, value as string)
        })
      }}
      disabled={isPending}
    >
      <SelectTrigger size="sm" className={isPending ? 'opacity-50' : ''}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="manager">Manager</SelectItem>
        <SelectItem value="staff">Staff</SelectItem>
      </SelectContent>
    </Select>
  )
}
