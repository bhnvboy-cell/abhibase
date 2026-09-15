import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const event_type = url.searchParams.get('event_type')
  const since = url.searchParams.get('since')
  const limit = parseInt(url.searchParams.get('limit') || '100', 10)

  let sql = `SELECT id, event_type, properties, created_at FROM analytics_events WHERE user_id = $1`
  const params: unknown[] = [g.user.id]

  if (event_type) {
    params.push(event_type)
    sql += ` AND event_type = $${params.length}`
  }
  if (since) {
    params.push(since)
    sql += ` AND created_at >= $${params.length}`
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
  params.push(limit)

  const events = await query<{ id: string; event_type: string; properties: Record<string, unknown>; created_at: string }>(sql, params)

  return NextResponse.json({ events })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const body = await req.json()
  if (!body.event_type || !String(body.event_type).trim()) {
    return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
  }

  const event = await one(
    `INSERT INTO analytics_events (user_id, event_type, properties)
     VALUES ($1, $2, $3)
     RETURNING id, event_type, properties, created_at`,
    [g.user.id, String(body.event_type).trim(), JSON.stringify(body.properties || {})]
  )

  return NextResponse.json({ event })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const since = url.searchParams.get('since')
  if (!since) {
    return NextResponse.json({ error: 'since query param required' }, { status: 400 })
  }

  await query(`DELETE FROM analytics_events WHERE user_id = $1 AND created_at < $2`, [g.user.id, since])
  return NextResponse.json({ ok: true })
}
