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

  const { to, subject, body: emailBody, template_id, variables } = body as {
    to: string | string[]
    subject: string
    body: string
    template_id: string
    variables: Record<string, string>
  }

  if (!to || (!subject && !template_id)) {
    return NextResponse.json({ error: 'to and subject (or template_id) are required' }, { status: 400 })
  }

  let finalSubject = subject
  let finalBody = emailBody

  if (template_id) {
    const template = await one<{
      id: string
      subject: string
      body: string
      variables: string[]
    }>(
      `SELECT id, subject, body, variables FROM email_templates WHERE id = $1 AND user_id = $2`,
      [template_id, g.user.id]
    )
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    finalSubject = template.subject
    finalBody = template.body

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        finalSubject = finalSubject.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value)
        finalBody = finalBody.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value)
      }
    }
  }

  if (!finalSubject || !finalBody) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }

  const recipients = Array.isArray(to) ? to : [to]

  const log = await one<{
    id: string
    status: string
    created_at: string
  }>(
    `INSERT INTO email_logs (user_id, recipients, subject, body, template_id, status)
     VALUES ($1, $2, $3, $4, $5, 'queued')
     RETURNING id, status, created_at`,
    [g.user.id, JSON.stringify(recipients), finalSubject, finalBody, template_id || null]
  )

  return NextResponse.json({ ok: true, email: log })
}

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0', 10)

  const emails = await query<{
    id: string
    recipients: string[]
    subject: string
    status: string
    template_id: string | null
    sent_at: string | null
    created_at: string
  }>(
    `SELECT id, recipients, subject, status, template_id, sent_at, created_at
     FROM email_logs WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [g.user.id, limit, offset]
  )

  return NextResponse.json({ emails })
}
