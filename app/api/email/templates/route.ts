import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const templates = await query<{
    id: string
    name: string
    subject: string
    body: string
    category: string
    variables: string[]
    is_default: boolean
    created_at: string
    updated_at: string
  }>(
    `SELECT id, name, subject, body, category, variables, is_default, created_at, updated_at
     FROM email_templates WHERE user_id = $1
     ORDER BY created_at DESC`,
    [g.user.id]
  )

  return NextResponse.json({ templates })
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

  const { name, subject, body: emailBody, category, variables } = body as {
    name: string
    subject: string
    body: string
    category: string
    variables: string[]
  }

  if (!name || !subject || !emailBody) {
    return NextResponse.json({ error: 'name, subject, and body are required' }, { status: 400 })
  }

  const template = await one<{
    id: string
    name: string
    subject: string
    body: string
    category: string
    variables: string[]
    is_default: boolean
    created_at: string
    updated_at: string
  }>(
    `INSERT INTO email_templates (user_id, name, subject, body, category, variables)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, subject, body, category, variables, is_default, created_at, updated_at`,
    [g.user.id, name, subject, emailBody, category || 'general', JSON.stringify(variables || [])]
  )

  return NextResponse.json({ template })
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

  const { id, ...patch } = body as { id: string; [key: string]: unknown }
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  for (const key of ['name', 'subject', 'body', 'category', 'variables', 'is_default']) {
    if (key in patch) {
      const val = key === 'variables' ? JSON.stringify(patch[key]) : patch[key]
      fields.push(`${key} = $${i}`)
      values.push(val)
      i++
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  fields.push(`updated_at = NOW()`)
  values.push(id, g.user.id)
  await query(`UPDATE email_templates SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i + 1}`, values)

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

  await query(`DELETE FROM email_templates WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
