import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

export async function GET(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const agent = await one<{ id: string }>(
    `SELECT id FROM ai_agents WHERE id = $1 AND user_id = $2`,
    [ctx.params.id, g.user.id]
  )
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
  const level = url.searchParams.get('level')

  let sql = `SELECT * FROM ai_agent_logs WHERE agent_id = $1`
  const params: unknown[] = [ctx.params.id]

  if (level && ['info', 'warning', 'error'].includes(level)) {
    params.push(level)
    sql += ` AND level = $${params.length}`
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
  params.push(limit)

  const logs = await query(sql, params)
  return NextResponse.json({ logs })
}
