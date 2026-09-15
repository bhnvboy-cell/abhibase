import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

export async function POST(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const agent = await one<{ id: string; status: string }>(
    `SELECT id, status FROM ai_agents WHERE id = $1 AND user_id = $2`,
    [ctx.params.id, g.user.id]
  )
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  if (agent.status === 'error') {
    return NextResponse.json({ error: 'Agent is in error state' }, { status: 400 })
  }

  const body = await req.json()
  const { task_type, input } = body as {
    task_type?: string
    input?: Record<string, unknown>
  }

  if (!task_type || typeof task_type !== 'string') {
    return NextResponse.json({ error: 'task_type is required' }, { status: 400 })
  }

  await query(
    `UPDATE ai_agents SET status = 'active', last_active_at = now(), updated_at = now() WHERE id = $1`,
    [ctx.params.id]
  )

  await query(
    `INSERT INTO ai_agent_logs (agent_id, action, details, level)
     VALUES ($1, $2, $3, 'info')`,
    [
      ctx.params.id,
      'task_started',
      JSON.stringify({ task_type, input: input || {} }),
    ]
  )

  const task = await one(
    `INSERT INTO ai_agent_tasks (agent_id, task_type, input, status, started_at)
     VALUES ($1, $2, $3, 'running', now())
     RETURNING *`,
    [ctx.params.id, task_type, JSON.stringify(input || {})]
  )

  return NextResponse.json({ task })
}
