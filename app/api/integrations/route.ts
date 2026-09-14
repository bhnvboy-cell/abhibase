import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const integrations = await query<{
    id: string
    provider: string
    config: Record<string, unknown>
    enabled: boolean
    created_at: string
  }>(
    `SELECT id, provider, config, enabled, created_at
     FROM integrations WHERE user_id = $1 ORDER BY created_at DESC`,
    [g.user.id]
  )

  return NextResponse.json({ integrations })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { provider, webhook_url, channel } = body as {
    provider: string
    webhook_url?: string
    channel?: string
  }

  if (!provider) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
  }

  const config: Record<string, unknown> = {}
  if (webhook_url) config.webhook_url = webhook_url
  if (channel) config.channel = channel

  await query(
    `INSERT INTO integrations (user_id, provider, config)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, provider) DO UPDATE SET config = $3, enabled = true`,
    [g.user.id, provider, JSON.stringify(config)]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await query(`DELETE FROM integrations WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
