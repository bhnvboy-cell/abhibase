import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export const runtime = 'nodejs'

interface Workflow {
  id: string
  name: string
  description: string | null
  trigger_type: string
  trigger_config: Record<string, unknown>
  actions: Record<string, unknown>[]
  enabled: boolean
  last_run: string | null
  created_at: string
  updated_at: string
}

interface Ctx {
  params: { id: string }
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const workflow = await one<Workflow>(
    `SELECT id, name, description, trigger_type, trigger_config, actions, enabled, last_run, created_at, updated_at
     FROM workflows WHERE id = $1 AND user_id = $2`,
    [ctx.params.id, g.user.id]
  )

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  return NextResponse.json({ workflow })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const VALID_TRIGGERS = ['manual', 'schedule', 'event', 'webhook']
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  for (const key of ['name', 'description', 'enabled', 'trigger_type', 'trigger_config', 'actions']) {
    if (key in body) {
      if (key === 'trigger_type' && !VALID_TRIGGERS.includes(body[key] as string)) {
        return NextResponse.json(
          { error: `Invalid trigger type. Must be one of: ${VALID_TRIGGERS.join(', ')}` },
          { status: 400 }
        )
      }

      const val = key.endsWith('_config') || key === 'actions'
        ? JSON.stringify(body[key])
        : body[key]
      fields.push(`${key} = $${i}`)
      values.push(val)
      i++
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  fields.push('updated_at = now()')
  values.push(ctx.params.id, g.user.id)

  const workflow = await one<Workflow>(
    `UPDATE workflows SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i + 1}
     RETURNING id, name, description, trigger_type, trigger_config, actions, enabled, last_run, created_at, updated_at`,
    values
  )

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  return NextResponse.json({ workflow })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  await query(`DELETE FROM workflows WHERE id = $1 AND user_id = $2`, [ctx.params.id, g.user.id])
  return NextResponse.json({ ok: true })
}
