'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { createUser } from '@/app/(admin)/settings/actions'

export function UserForm() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('staff')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Добави потребител
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Нов потребител</DialogTitle>
          <DialogDescription>
            Създай нов потребител с достъп до админ панела.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData: FormData) => {
            formData.set('role', role)
            await createUser(formData)
            setOpen(false)
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Име</Label>
            <Input id="name" name="name" required placeholder="Иван Иванов" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Имейл</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ivan@bosy.bg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Парола</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Минимум 6 символа"
            />
          </div>
          <div className="space-y-2">
            <Label>Роля</Label>
            <Select value={role} onValueChange={(value) => setRole(value ?? 'staff')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Отказ
            </DialogClose>
            <Button type="submit">Създай</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
