import { NextResponse } from 'next/server'
import { query, one } from '@/lib/db'
import { authGuard, safeAccent } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res
  const events = await query(
    `SELECT * FROM planner_events WHERE user_id = $1
     ORDER BY event_date ASC, start_time ASC NULLS LAST`,
    [g.user.id]
  )
  return NextResponse.json({ events })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const body = await req.json()
  if (!body.title || !String(body.title).trim() || !body.event_date) {
    return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
  }
  const event = await one(
    `INSERT INTO planner_events (user_id, title, event_date, start_time, end_time, color)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      g.user.id,
      String(body.title).trim(),
      body.event_date,
      body.start_time || null,
      body.end_time || null,
      safeAccent(body.color),
    ]
  )
  return NextResponse.json({ event })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  await query(`DELETE FROM planner_events WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
