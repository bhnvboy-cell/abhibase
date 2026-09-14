import { NextResponse } from 'next/server'
import { query, one } from '@/lib/db'
import { authGuard, safeAccent } from '@/lib/api-helpers'
import type { HabitLog, HabitWithLogs } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res
  const habits = await query<Omit<HabitWithLogs, 'habit_logs'>>(
    `SELECT * FROM habits WHERE user_id = $1 AND archived = false ORDER BY created_at ASC`,
    [g.user.id]
  )
  const logs = await query<HabitLog>(
    `SELECT * FROM habit_logs WHERE user_id = $1`,
    [g.user.id]
  )
  const result: HabitWithLogs[] = habits.map((h) => ({
    ...h,
    habit_logs: logs.filter((l) => l.habit_id === h.id),
  }))
  return NextResponse.json({ habits: result })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const body = await req.json()
  if (!body.name || !String(body.name).trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  const target = Math.min(7, Math.max(1, Number(body.target_per_week) || 7))
  const habit = await one(
    `INSERT INTO habits (user_id, name, icon, color, target_per_week)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      g.user.id,
      String(body.name).trim(),
      typeof body.icon === 'string' && body.icon ? body.icon.slice(0, 2) : '🔥',
      safeAccent(body.color, 'emerald'),
      target,
    ]
  )
  return NextResponse.json({ habit })
}

export async function PATCH(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const body = await req.json()
  if (!body.habitId || !body.date) {
    return NextResponse.json({ error: 'habitId and date are required' }, { status: 400 })
  }
  const habit = await one<{ id: string }>(
    `SELECT id FROM habits WHERE id = $1 AND user_id = $2`,
    [body.habitId, g.user.id]
  )
  if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 })

  const existing = await one<{ id: string }>(
    `SELECT id FROM habit_logs WHERE habit_id = $1 AND log_date = $2`,
    [body.habitId, body.date]
  )
  if (existing) {
    await query(`DELETE FROM habit_logs WHERE id = $1`, [existing.id])
    return NextResponse.json({ logged: false })
  }
  await query(
    `INSERT INTO habit_logs (habit_id, user_id, log_date) VALUES ($1, $2, $3)`,
    [body.habitId, g.user.id, body.date]
  )
  return NextResponse.json({ logged: true })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  await query(`DELETE FROM habits WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
