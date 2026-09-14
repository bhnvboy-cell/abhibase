import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get('unread') === 'true'

  if (unreadOnly) {
    const row = await one<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND read = false`,
      [g.user.id]
    )
    return NextResponse.json({ count: row?.count ?? 0 })
  }

  const notifications = await query<{
    id: string
    type: string
    title: string
    body: string
    link: string | null
    read: boolean
    created_at: string
  }>(
    `SELECT id, type, title, body, link, read, created_at
     FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 50`,
    [g.user.id]
  )

  return NextResponse.json({ notifications })
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

  if (body.all === true) {
    await query(
      `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
      [g.user.id]
    )
    return NextResponse.json({ ok: true })
  }

  if (typeof body.id === 'string') {
    await query(
      `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
      [body.id, g.user.id]
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Missing id or all flag' }, { status: 400 })
}
