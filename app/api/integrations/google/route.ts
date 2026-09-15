import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const integration = await one<{
    id: string
    config: Record<string, unknown>
    enabled: boolean
    created_at: string
  }>(
    `SELECT id, config, enabled, created_at
     FROM integrations WHERE user_id = $1 AND provider = 'google'`,
    [g.user.id]
  )

  return NextResponse.json({
    connected: integration?.enabled ?? false,
    integration: integration ?? null,
  })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const body = await req.json()
  const { access_token, refresh_token, calendar_id, sync_gmail } = body as {
    access_token?: string
    refresh_token?: string
    calendar_id?: string
    sync_gmail?: boolean
  }

  const config: Record<string, unknown> = {}
  if (access_token) config.access_token = access_token
  if (refresh_token) config.refresh_token = refresh_token
  if (calendar_id) config.calendar_id = calendar_id
  if (typeof sync_gmail === 'boolean') config.sync_gmail = sync_gmail

  if (!access_token && !refresh_token) {
    return NextResponse.json({ error: 'At least one token is required' }, { status: 400 })
  }

  await query(
    `INSERT INTO integrations (user_id, provider, config)
     VALUES ($1, 'google', $2)
     ON CONFLICT (user_id, provider) DO UPDATE SET config = $2, enabled = true, updated_at = now()`,
    [g.user.id, JSON.stringify(config)]
  )

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const body = await req.json()
  const { enabled } = body as { enabled?: boolean }

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled boolean is required' }, { status: 400 })
  }

  await query(
    `UPDATE integrations SET enabled = $1, updated_at = now()
     WHERE user_id = $2 AND provider = 'google'`,
    [enabled, g.user.id]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  await query(
    `DELETE FROM integrations WHERE user_id = $1 AND provider = 'google'`,
    [g.user.id]
  )
  return NextResponse.json({ ok: true })
}
