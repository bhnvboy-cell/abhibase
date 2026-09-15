import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const agent = await one(
    `SELECT * FROM ai_agents WHERE id = $1 AND user_id = $2`,
    [ctx.params.id, g.user.id]
  )
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  return NextResponse.json({ agent })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const agent = await one<{ id: string }>(
    `SELECT id FROM ai_agents WHERE id = $1 AND user_id = $2`,
    [ctx.params.id, g.user.id]
  )
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, agent_type, status, config, capabilities } = body as {
    name?: string
    description?: string
    agent_type?: string
    status?: string
    config?: Record<string, unknown>
    capabilities?: string[]
  }

  const sets: string[] = []
  const params: unknown[] = []

  if (typeof name === 'string') {
    params.push(name.trim())
    sets.push(`name = $${params.length}`)
  }
  if (typeof description === 'string') {
    params.push(description)
    sets.push(`description = $${params.length}`)
  }
  const validTypes = ['assistant', 'scheduler', 'monitor', 'responder', 'custom']
  if (agent_type && validTypes.includes(agent_type)) {
    params.push(agent_type)
    sets.push(`agent_type = $${params.length}`)
  }
  const validStatuses = ['active', 'inactive', 'error']
  if (status && validStatuses.includes(status)) {
    params.push(status)
    sets.push(`status = $${params.length}`)
    if (status === 'active') {
      sets.push('last_active_at = now()')
    }
  }
  if (config !== undefined) {
    params.push(JSON.stringify(config))
    sets.push(`config = $${params.length}`)
  }
  if (capabilities !== undefined) {
    params.push(JSON.stringify(capabilities))
    sets.push(`capabilities = $${params.length}`)
  }

  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  sets.push('updated_at = now()')
  params.push(ctx.params.id)

  const updated = await one(
    `UPDATE ai_agents SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  )

  return NextResponse.json({ agent: updated })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const agent = await one<{ id: string }>(
    `SELECT id FROM ai_agents WHERE id = $1 AND user_id = $2`,
    [ctx.params.id, g.user.id]
  )
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  await query(`DELETE FROM ai_agents WHERE id = $1`, [ctx.params.id])
  return NextResponse.json({ ok: true })
}
