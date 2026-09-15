import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') || 'all'
  const unreadOnly = url.searchParams.get('unread') === 'true'

  if (unreadOnly) {
    const row = await one<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM messages WHERE recipient_id = $1 AND read = false`,
      [g.user.id]
    )
    return NextResponse.json({ count: row?.count ?? 0 })
  }

  let whereClause = 'WHERE recipient_id = $1'
  if (filter === 'unread') whereClause += ' AND read = false'
  if (filter === 'archived') whereClause += ' AND archived = true'

  const messages = await query<{
    id: string
    sender_id: string
    sender_name: string
    subject: string
    body: string
    read: boolean
    archived: boolean
    created_at: string
  }>(
    `SELECT m.id, m.sender_id, m.sender_name, m.subject, m.body, m.read, m.archived, m.created_at
     FROM messages m ${whereClause}
     ORDER BY m.created_at DESC LIMIT 50`,
    [g.user.id]
  )

  return NextResponse.json({ messages })
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

  const { recipient_id, subject, body: messageBody } = body as {
    recipient_id: string
    subject: string
    body: string
  }

  if (!recipient_id || !messageBody) {
    return NextResponse.json({ error: 'recipient_id and body are required' }, { status: 400 })
  }

  const sender = await one<{ name: string }>(
    `SELECT name FROM users WHERE id = $1`,
    [g.user.id]
  )

  const message = await one<{
    id: string
    subject: string
    body: string
    read: boolean
    archived: boolean
    created_at: string
  }>(
    `INSERT INTO messages (sender_id, sender_name, recipient_id, subject, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, subject, body, read, archived, created_at`,
    [g.user.id, sender?.name || 'Unknown', recipient_id, subject || '', messageBody]
  )

  return NextResponse.json({ message })
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

  const { id, read, archived } = body as {
    id: string
    read?: boolean
    archived?: boolean
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (typeof read === 'boolean') {
    fields.push(`read = $${i}`)
    values.push(read)
    i++
  }
  if (typeof archived === 'boolean') {
    fields.push(`archived = $${i}`)
    values.push(archived)
    i++
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  values.push(id, g.user.id)
  await query(`UPDATE messages SET ${fields.join(', ')} WHERE id = $${i} AND recipient_id = $${i + 1}`, values)

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

  await query(`DELETE FROM messages WHERE id = $1 AND recipient_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
