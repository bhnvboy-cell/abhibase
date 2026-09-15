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
     FROM integrations WHERE user_id = $1 AND provider = 'slack'`,
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
  const { webhook_url, bot_token, channel, notify_events } = body as {
    webhook_url?: string
    bot_token?: string
    channel?: string
    notify_events?: string[]
  }

  const config: Record<string, unknown> = {}
  if (webhook_url) config.webhook_url = webhook_url
  if (bot_token) config.bot_token = bot_token
  if (channel) config.channel = channel
  if (notify_events) config.notify_events = notify_events

  if (!webhook_url && !bot_token) {
    return NextResponse.json({ error: 'webhook_url or bot_token is required' }, { status: 400 })
  }

  await query(
    `INSERT INTO integrations (user_id, provider, config)
     VALUES ($1, 'slack', $2)
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
     WHERE user_id = $2 AND provider = 'slack'`,
    [enabled, g.user.id]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  await query(
    `DELETE FROM integrations WHERE user_id = $1 AND provider = 'slack'`,
    [g.user.id]
  )
  return NextResponse.json({ ok: true })
}
