import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const prefs = await one<{
    id: string
    email_tasks: boolean
    email_habits: boolean
    email_events: boolean
    email_projects: boolean
    reminder_minutes_before: number
  }>(
    `SELECT id, email_tasks, email_habits, email_events, email_projects, reminder_minutes_before
     FROM notification_preferences WHERE user_id = $1`,
    [g.user.id]
  )

  if (!prefs) {
    const created = await one<{
      id: string
      email_tasks: boolean
      email_habits: boolean
      email_events: boolean
      email_projects: boolean
      reminder_minutes_before: number
    }>(
      `INSERT INTO notification_preferences (user_id)
       VALUES ($1)
       RETURNING id, email_tasks, email_habits, email_events, email_projects, reminder_minutes_before`,
      [g.user.id]
    )
    return NextResponse.json({ preferences: created })
  }

  return NextResponse.json({ preferences: prefs })
}

export async function PATCH(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  for (const key of ['email_tasks', 'email_habits', 'email_events', 'email_projects', 'reminder_minutes_before']) {
    if (key in body) {
      fields.push(`${key} = $${i}`)
      values.push(body[key])
      i++
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  fields.push(`updated_at = now()`)
  values.push(g.user.id)

  await query(
    `UPDATE notification_preferences SET ${fields.join(', ')} WHERE user_id = $${i}`,
    values
  )

  return NextResponse.json({ ok: true })
}
