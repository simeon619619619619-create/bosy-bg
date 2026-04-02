'use client'

import { useState, useTransition } from 'react'
import { toEur } from '@/lib/currency'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MoreHorizontal,
  KeyRound,
  ShieldCheck,
  Coins,
  Ban,
  ShieldOff,
  Trash2,
} from 'lucide-react'

import type { RegisteredUser } from './actions'
import {
  resetUserPassword,
  verifyUserEmail,
  addCashback,
  banUser,
  unbanUser,
  deleteAuthUser,
} from './actions'

// ── Cashback Dialog ──────────────────────────────────────────
function CashbackDialog({ user }: { user: RegisteredUser }) {
  const [amount, setAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleSubmit() {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) return
    startTransition(async () => {
      try {
        await addCashback(user.email, numAmount)
        setAmount('')
        setOpen(false)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground">
            <Coins className="size-4" />
            Добави кешбак
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добави кешбак</DialogTitle>
          <DialogDescription>
            Добавяне на бонус кешбак за {user.name ?? user.email}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Label>Сума (BGN)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="напр. 10.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Текущ баланс: {toEur(user.cashback_balance).toFixed(2)} &euro;
          </p>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Отказ
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending || !amount}>
            {isPending ? 'Добавяне...' : 'Добави'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Confirmation Dialog ───────────────────────────────
function DeleteDialog({ user }: { user: RegisteredUser }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteAuthUser(user.id)
        setOpen(false)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-destructive outline-hidden select-none hover:bg-destructive/10">
            <Trash2 className="size-4" />
            Изтрий
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изтриване на потребител</DialogTitle>
          <DialogDescription>
            Сигурни ли сте, че искате да изтриете {user.name ?? user.email}?
            Това действие е необратимо.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Отказ
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Изтриване...' : 'Изтрий'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Action Button (for simple actions) ───────────────────────
function ActionButton({
  user,
  action,
  label,
  pendingLabel,
  icon: Icon,
  variant,
}: {
  user: RegisteredUser
  action: () => Promise<unknown>
  label: string
  pendingLabel: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'destructive'
}) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        await action()
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <button
      className={`flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground ${
        variant === 'destructive' ? 'text-destructive hover:bg-destructive/10' : ''
      }`}
      onClick={handleClick}
      disabled={isPending}
    >
      <Icon className="size-4" />
      {isPending ? pendingLabel : label}
    </button>
  )
}

// ── User Actions Dropdown ────────────────────────────────────
function UserActions({ user }: { user: RegisteredUser }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [delPending, startDelTransition] = useTransition()

  function handleDelete() {
    startDelTransition(async () => {
      try {
        await deleteAuthUser(user.id)
        setDeleteOpen(false)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            render={<div />}
          >
            <ActionButton
              user={user}
              action={() => resetUserPassword(user.id, user.email)}
              label="Нулиране на парола"
              pendingLabel="Изпращане..."
              icon={KeyRound}
            />
          </DropdownMenuItem>

          {!user.email_verified && (
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              render={<div />}
            >
              <ActionButton
                user={user}
                action={() => verifyUserEmail(user.id)}
                label="Потвърди имейл"
                pendingLabel="Потвърждаване..."
                icon={ShieldCheck}
              />
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            render={<div />}
          >
            <CashbackDialog user={user} />
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            render={<div />}
          >
            {user.banned ? (
              <ActionButton
                user={user}
                action={() => unbanUser(user.id)}
                label="Разблокирай"
                pendingLabel="Разблокиране..."
                icon={ShieldOff}
              />
            ) : (
              <ActionButton
                user={user}
                action={() => banUser(user.id)}
                label="Блокирай"
                pendingLabel="Блокиране..."
                icon={Ban}
                variant="destructive"
              />
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="size-4 text-destructive" />
            <span className="text-destructive">Изтрий</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изтриване на потребител</DialogTitle>
            <DialogDescription>
              Сигурни ли сте, че искате да изтриете {user.name ?? user.email}?
              Това действие е необратимо.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Отказ
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={delPending}>
              {delPending ? 'Изтриване...' : 'Изтрий'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Main Table Component ─────────────────────────────────────
export function MembersTable({ users }: { users: RegisteredUser[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Име</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Телефон</TableHead>
          <TableHead>Кешбак</TableHead>
          <TableHead>Поръчки</TableHead>
          <TableHead>Общо</TableHead>
          <TableHead>Имейл</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Регистрация</TableHead>
          <TableHead>Последен вход</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              {user.name ?? '---'}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.phone ?? '---'}</TableCell>
            <TableCell
              className="font-mono"
              style={{
                color: user.cashback_balance > 0 ? '#a78bfa' : undefined,
              }}
            >
              {toEur(user.cashback_balance).toFixed(2)} &euro;
            </TableCell>
            <TableCell>{user.total_orders}</TableCell>
            <TableCell className="font-mono">
              {toEur(user.total_spent).toFixed(2)} &euro;
            </TableCell>
            <TableCell>
              {user.email_verified ? (
                <Badge className="bg-green-500/15 text-green-500">
                  Потвърден
                </Badge>
              ) : (
                <Badge variant="destructive">Непотвърден</Badge>
              )}
            </TableCell>
            <TableCell>
              {user.banned ? (
                <Badge variant="destructive">Блокиран</Badge>
              ) : (
                <Badge className="bg-green-500/15 text-green-500">
                  Активен
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString('bg-BG')}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString('bg-BG')
                : '---'}
            </TableCell>
            <TableCell>
              <UserActions user={user} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
