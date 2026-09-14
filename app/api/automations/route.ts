import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const automations = await query<{
    id: string
    name: string
    trigger_type: string
    trigger_config: Record<string, unknown>
    action_type: string
    action_config: Record<string, unknown>
    enabled: boolean
    last_run: string | null
    created_at: string
  }>(
    `SELECT id, name, trigger_type, trigger_config, action_type, action_config, enabled, last_run, created_at
     FROM automations WHERE user_id = $1 ORDER BY created_at DESC`,
    [g.user.id]
  )

  return NextResponse.json({ automations })
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

  const { name, trigger_type, trigger_config, action_type, action_config } = body as {
    name: string
    trigger_type: string
    trigger_config: Record<string, unknown>
    action_type: string
    action_config: Record<string, unknown>
  }

  if (!name || !trigger_type || !action_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const automation = await one<{
    id: string
    name: string
    trigger_type: string
    trigger_config: Record<string, unknown>
    action_type: string
    action_config: Record<string, unknown>
    enabled: boolean
    last_run: string | null
    created_at: string
  }>(
    `INSERT INTO automations (user_id, name, trigger_type, trigger_config, action_type, action_config)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, trigger_type, trigger_config, action_type, action_config, enabled, last_run, created_at`,
    [g.user.id, name, trigger_type, JSON.stringify(trigger_config || {}), action_type, JSON.stringify(action_config || {})]
  )

  return NextResponse.json({ automation })
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

  for (const key of ['name', 'enabled', 'trigger_type', 'trigger_config', 'action_type', 'action_config']) {
    if (key in patch) {
      const val = key.endsWith('_config') ? JSON.stringify(patch[key]) : patch[key]
      fields.push(`${key} = $${i}`)
      values.push(val)
      i++
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  values.push(id, g.user.id)
  await query(`UPDATE automations SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i + 1}`, values)

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

  await query(`DELETE FROM automations WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
