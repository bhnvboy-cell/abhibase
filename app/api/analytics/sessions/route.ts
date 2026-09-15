import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)

  const sessions = await query<{
    id: string
    started_at: string
    ended_at: string | null
    duration_ms: number | null
    device: string
    browser: string
  }>(
    `SELECT id, started_at, ended_at, duration_ms, device, browser
     FROM analytics_sessions WHERE user_id = $1
     ORDER BY started_at DESC LIMIT $2`,
    [g.user.id, limit]
  )

  return NextResponse.json({ sessions })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const body = await req.json()

  const session = await one(
    `INSERT INTO analytics_sessions (user_id, device, browser, ip_address)
     VALUES ($1, $2, $3, $4)
     RETURNING id, started_at`,
    [
      g.user.id,
      body.device || 'unknown',
      body.browser || 'unknown',
      body.ip_address || null,
    ]
  )

  return NextResponse.json({ session })
}

export async function PATCH(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const body = await req.json()
  if (!body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const session = await one(
    `UPDATE analytics_sessions
     SET ended_at = now(), duration_ms = EXTRACT(EPOCH FROM (now() - started_at)) * 1000
     WHERE id = $1 AND user_id = $2 AND ended_at IS NULL
     RETURNING id, started_at, ended_at, duration_ms`,
    [body.id, g.user.id]
  )

  if (!session) {
    return NextResponse.json({ error: 'Session not found or already ended' }, { status: 404 })
  }

  return NextResponse.json({ session })
}
