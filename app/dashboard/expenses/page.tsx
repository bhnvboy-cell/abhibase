'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Loader2,
  Plus,
  Receipt,
  Trash2,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { toast } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/empty-state'
import { cn, computeBalances, dayKey, fmtDate, formatCurrency } from '@/lib/utils'
import type { ExpenseGroup } from '@/lib/types'

export default function ExpensesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [groupDialog, setGroupDialog] = React.useState<{ name: string; emoji: string } | null>(null)
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [expenseForm, setExpenseForm] = React.useState({
    description: '',
    amount: '',
    paid_by: '',
    date: dayKey(new Date()),
  })
  const [splitWith, setSplitWith] = React.useState<string[]>([])

  const groups = useQuery({ queryKey: ['groups'], queryFn: api.expenses.groups })
  const groupList = groups.data ?? []
  const activeGroup: ExpenseGroup | null =
    groupList.find((g) => g.id === selectedId) ?? groupList[0] ?? null

  const members = activeGroup?.group_members ?? []
  const memberIds = members.map((m) => m.user_id)

  React.useEffect(() => {
    if (activeGroup && memberIds.length > 0 && splitWith.length === 0) {
      setSplitWith(memberIds)
      setExpenseForm((f) => ({ ...f, paid_by: user?.id ?? '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.id, memberIds.length])

  const expenses = useQuery({
    queryKey: ['expenses', activeGroup?.id],
    queryFn: () => api.expenses.expenses(activeGroup!.id),
    enabled: !!activeGroup,
  })
  const settlements = useQuery({
    queryKey: ['settlements', activeGroup?.id],
    queryFn: () => api.expenses.settlements(activeGroup!.id),
    enabled: !!activeGroup,
  })

  const invalidateGroupData = () => {
    if (!activeGroup) return
    qc.invalidateQueries({ queryKey: ['expenses', activeGroup.id] })
    qc.invalidateQueries({ queryKey: ['settlements', activeGroup.id] })
  }

  const createGroup = useMutation({
    mutationFn: (state: { name: string; emoji: string }) =>
      api.expenses.createGroup({
        name: state.name.trim(),
        emoji: state.emoji || '🏠',
      }),
    onSuccess: () => {
      toast('Group created')
      setGroupDialog(null)
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const inviteMember = useMutation({
    mutationFn: (email: string) => {
      if (!activeGroup) throw new Error('Select a group first')
      return api.expenses.inviteByEmail(activeGroup.id, email)
    },
    onSuccess: () => {
      toast('Member added')
      setInviteEmail('')
      setSplitWith([])
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const createExpense = useMutation({
    mutationFn: () => {
      if (!activeGroup) throw new Error('Select a group first')
      return api.expenses.createExpense(activeGroup.id, {
        paid_by: expenseForm.paid_by || user!.id,
        description: expenseForm.description.trim(),
        amount: Number(expenseForm.amount),
        split_with: splitWith.length ? splitWith : memberIds,
        expense_date: expenseForm.date,
      })
    },
    onSuccess: () => {
      toast('Expense added')
      setExpenseForm((f) => ({ ...f, description: '', amount: '' }))
      invalidateGroupData()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteExpense = useMutation({
    mutationFn: (id: string) => api.expenses.removeExpense(activeGroup!.id, id),
    onSuccess: () => {
      toast('Expense removed')
      invalidateGroupData()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const recordSettlement = useMutation({
    mutationFn: (t: { from: string; to: string; amount: number }) => {
      if (!activeGroup) throw new Error('Select a group first')
      return api.expenses.createSettlement(activeGroup.id, {
        from_user: t.from,
        to_user: t.to,
        amount: t.amount,
      })
    },
    onSuccess: () => {
      toast('Settlement recorded')
      invalidateGroupData()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const deleteSettlement = useMutation({
    mutationFn: (id: string) => api.expenses.removeSettlement(activeGroup!.id, id),
    onSuccess: () => {
      toast('Settlement removed')
      invalidateGroupData()
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  const nameOf = (userId: string) => {
    const m = members.find((mm) => mm.user_id === userId)
    return m?.profiles?.full_name || m?.profiles?.email || 'Member'
  }

  const balances =
    activeGroup
      ? computeBalances(
          memberIds,
          (expenses.data ?? []).map((e) => ({
            paid_by: e.paid_by,
            amount: Number(e.amount),
            split_with: e.split_with,
          })),
          (settlements.data ?? []).map((s) => ({
            from_user: s.from_user,
            to_user: s.to_user,
            amount: Number(s.amount),
          }))
        )
      : { net: [], transfers: [] }

  function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!expenseForm.description.trim() || !Number(expenseForm.amount)) return
    createExpense.mutate()
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <Button
          variant="secondary"
          className="w-full justify-start"
          onClick={() => setGroupDialog({ name: '', emoji: '🏠' })}
        >
          <Plus className="h-4 w-4" />
          New group
        </Button>
        <div className="space-y-1 rounded-xl border bg-card p-2">
          {groupList.length === 0 && (
            <p className="px-2 py-3 text-xs text-muted-foreground">No groups yet.</p>
          )}
          {groupList.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setSelectedId(g.id)
                setSplitWith([])
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                activeGroup?.id === g.id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{g.emoji}</span>
              <span className="min-w-0 flex-1 truncate">{g.name}</span>
              <span className="text-[10px]">{g.group_members?.length ?? 0}</span>
            </button>
          ))}
        </div>
      </aside>

      {!activeGroup ? (
        <EmptyState
          icon={Wallet}
          title="No expense groups"
          description="Create a group — trip, flat, team — and start splitting bills fairly."
          action={
            <Button onClick={() => setGroupDialog({ name: '', emoji: '🏠' })}>
              <Plus className="h-4 w-4" />
              Create a group
            </Button>
          }
        />
      ) : (
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              {activeGroup.emoji} {activeGroup.name}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (inviteEmail.trim()) inviteMember.mutate(inviteEmail.trim())
              }}
              className="ml-auto flex items-center gap-2"
            >
              <Input
                type="email"
                placeholder="friend@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-48"
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={!inviteEmail.trim() || inviteMember.isPending}
              >
                {inviteMember.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                Add
              </Button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card py-1 pl-1 pr-3 text-xs"
              >
                <Avatar
                  name={m.profiles?.full_name || m.profiles?.email || '?'}
                  className="h-5 w-5 text-[8px]"
                />
                {m.profiles?.full_name || m.profiles?.email}
              </span>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <form onSubmit={handleAddExpense} className="rounded-xl border bg-card p-4">
              <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
                <Receipt className="h-4 w-4 text-primary" />
                Add expense
              </h3>
              <div className="space-y-3">
                <Input
                  placeholder="What was it for?"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount ₹"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                  <Input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Paid by</Label>
                  <Select
                    value={expenseForm.paid_by}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paid_by: e.target.value })}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.user_id}>
                        {nameOf(m.user_id)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Split between</Label>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {members.map((m) => (
                      <label key={m.id} className="inline-flex cursor-pointer items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={splitWith.includes(m.user_id)}
                          onChange={(e) =>
                            setSplitWith((prev) =>
                              e.target.checked
                                ? [...prev, m.user_id]
                                : prev.filter((id) => id !== m.user_id)
                            )
                          }
                          className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                        />
                        {nameOf(m.user_id)}
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !expenseForm.description.trim() ||
                    !Number(expenseForm.amount) ||
                    createExpense.isPending
                  }
                >
                  {createExpense.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add expense
                </Button>
              </div>
            </form>

            <div className="rounded-xl border bg-card p-4">
              <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
                <HandCoins className="h-4 w-4 text-primary" />
                Balances
              </h3>
              <div className="space-y-2">
                {balances.net.map((b) => (
                  <div key={b.userId} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={nameOf(b.userId)} className="h-6 w-6 text-[9px]" />
                      {nameOf(b.userId)}
                    </span>
                    <span
                      className={cn(
                        'font-medium',
                        b.value > 0.005
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : b.value < -0.005
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-muted-foreground'
                      )}
                    >
                      {b.value > 0 ? '+' : ''}
                      {formatCurrency(b.value)}
                    </span>
                  </div>
                ))}
              </div>
              {balances.transfers.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Settle up
                  </p>
                  <div className="space-y-2">
                    {balances.transfers.map((t, i) => (
                      <motion.div
                        key={`${t.from}-${t.to}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          <strong>{nameOf(t.from)}</strong> → <strong>{nameOf(t.to)}</strong>{' '}
                          <span className="font-medium text-primary">
                            {formatCurrency(t.amount)}
                          </span>
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={recordSettlement.isPending}
                          onClick={() => recordSettlement.mutate(t)}
                        >
                          Record
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Transactions</h3>
            {(expenses.data ?? []).length === 0 && (settlements.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transactions yet.
              </p>
            ) : (
              <ul className="divide-y">
                {(expenses.data ?? []).map((e) => (
                  <li key={`e-${e.id}`} className="group flex items-center gap-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {nameOf(e.paid_by)} paid · {fmtDate(e.expense_date)} · split ×
                        {e.split_with.length}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(Number(e.amount))}</span>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteExpense.mutate(e.id)}
                      className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {(settlements.data ?? []).map((s) => (
                  <li key={`s-${s.id}`} className="group flex items-center gap-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">Settlement</p>
                      <p className="text-xs text-muted-foreground">
                        {nameOf(s.from_user)} → {nameOf(s.to_user)} · {fmtDate(s.created_at)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(Number(s.amount))}
                    </span>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteSettlement.mutate(s.id)}
                      className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={groupDialog !== null}
        onOpenChange={(open) => !open && setGroupDialog(null)}
        title="New expense group"
        description="Trips, roommates, teams — anything you share bills for."
      >
        {groupDialog && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!groupDialog.name.trim()) return
              createGroup.mutate(groupDialog)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="group-emoji">Emoji</Label>
                <Input
                  id="group-emoji"
                  value={groupDialog.emoji}
                  onChange={(e) => setGroupDialog({ ...groupDialog, emoji: e.target.value.slice(0, 2) })}
                  className="text-center text-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="group-name">Name</Label>
                <Input
                  id="group-name"
                  placeholder="Goa trip"
                  value={groupDialog.name}
                  onChange={(e) => setGroupDialog({ ...groupDialog, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setGroupDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!groupDialog.name.trim() || createGroup.isPending}>
                {createGroup.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create group
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
