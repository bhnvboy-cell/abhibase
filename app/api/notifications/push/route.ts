import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  device_type: string
  device_name: string | null
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const subscriptions = await query<PushSubscriptionRow>(
    `SELECT id, endpoint, p256dh, auth, device_type, device_name, is_active, created_at, last_used_at
     FROM push_subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
    [g.user.id]
  )

  return NextResponse.json({ subscriptions })
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

  const { endpoint, p256dh, auth: subAuth, device_type, device_name } = body

  if (!endpoint || !p256dh || !subAuth) {
    return NextResponse.json({ error: 'endpoint, p256dh, and auth are required' }, { status: 400 })
  }

  const validDevices = ['web', 'ios', 'android']
  const device = validDevices.includes(device_type as string) ? device_type : 'web'

  const existing = await one<{ id: string }>(
    `SELECT id FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
    [g.user.id, endpoint]
  )

  if (existing) {
    await one(
      `UPDATE push_subscriptions
       SET p256dh = $1, auth = $2, device_type = $3, device_name = $4, is_active = true, last_used_at = NOW()
       WHERE id = $5`,
      [p256dh, subAuth, device, typeof device_name === 'string' ? device_name : null, existing.id]
    )
    return NextResponse.json({ ok: true, id: existing.id })
  }

  const row = await one<{ id: string }>(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, device_type, device_name)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [g.user.id, endpoint, p256dh, subAuth, device, typeof device_name === 'string' ? device_name : null]
  )

  return NextResponse.json({ ok: true, id: row?.id })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const endpoint = url.searchParams.get('endpoint')

  if (id) {
    await query(`DELETE FROM push_subscriptions WHERE id = $1 AND user_id = $2`, [id, g.user.id])
    return NextResponse.json({ ok: true })
  }

  if (endpoint) {
    await query(`DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2`, [
      endpoint,
      g.user.id,
    ])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Missing id or endpoint' }, { status: 400 })
}
