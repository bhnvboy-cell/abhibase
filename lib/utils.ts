import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

export function startOfWeek(d: Date): Date {
  const result = new Date(d)
  const day = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - day)
  result.setHours(0, 0, 0, 0)
  return result
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b)
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return parseDayKey(iso.slice(0, 10)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function fmtTime(t: string | null): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export function formatCurrency(n: number): string {
  return inr.format(n)
}

export function initials(nameOrEmail: string): string {
  const source = nameOrEmail?.trim() || '?'
  const parts = source.split(/[\s@._]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function computeStreak(dates: string[]): number {
  const set = new Set(dates)
  let streak = 0
  const cursor = new Date()
  if (!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (set.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export interface Transfer {
  from: string
  to: string
  amount: number
}

export function computeBalances(
  memberIds: string[],
  expenses: { paid_by: string; amount: number; split_with: string[] }[],
  settlements: { from_user: string; to_user: string; amount: number }[]
) {
  const net = new Map<string, number>(memberIds.map((id) => [id, 0]))
  for (const e of expenses) {
    const sharers = e.split_with.filter((id) => memberIds.includes(id))
    if (!sharers.length || !memberIds.includes(e.paid_by)) continue
    net.set(e.paid_by, (net.get(e.paid_by) ?? 0) + e.amount)
    const share = e.amount / sharers.length
    for (const s of sharers) net.set(s, (net.get(s) ?? 0) - share)
  }
  for (const s of settlements) {
    net.set(s.from_user, (net.get(s.from_user) ?? 0) + s.amount)
    net.set(s.to_user, (net.get(s.to_user) ?? 0) - s.amount)
  }
  const creditors = [...net.entries()]
    .filter(([, v]) => v > 0.005)
    .sort((a, b) => b[1] - a[1])
    .map(([id, v]) => ({ id, v }))
  const debtors = [...net.entries()]
    .filter(([, v]) => v < -0.005)
    .sort((a, b) => a[1] - b[1])
    .map(([id, v]) => ({ id, v: -v }))
  const transfers: Transfer[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].v, creditors[j].v)
    if (amt > 0.005) {
      transfers.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: Math.round(amt * 100) / 100,
      })
    }
    debtors[i].v -= amt
    creditors[j].v -= amt
    if (debtors[i].v <= 0.005) i++
    if (creditors[j].v <= 0.005) j++
  }
  return {
    net: [...net.entries()].map(([userId, value]) => ({
      userId,
      value: Math.round(value * 100) / 100,
    })),
    transfers,
  }
}
