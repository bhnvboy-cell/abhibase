import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { to, message } = body as {
    to: string | string[]
    message: string
  }

  if (!to || !message) {
    return NextResponse.json({ error: 'to and message are required' }, { status: 400 })
  }

  const recipients = Array.isArray(to) ? to : [to]

  const log = await one<{
    id: string
    status: string
    created_at: string
  }>(
    `INSERT INTO sms_logs (user_id, recipients, message, status)
     VALUES ($1, $2, $3, 'queued')
     RETURNING id, status, created_at`,
    [g.user.id, JSON.stringify(recipients), message]
  )

  return NextResponse.json({ ok: true, sms: log })
}

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0', 10)

  const smsMessages = await query<{
    id: string
    recipients: string[]
    message: string
    status: string
    sent_at: string | null
    created_at: string
  }>(
    `SELECT id, recipients, message, status, sent_at, created_at
     FROM sms_logs WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [g.user.id, limit, offset]
  )

  return NextResponse.json({ smsMessages })
}
