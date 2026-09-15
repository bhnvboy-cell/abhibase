import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const agents = await query(
    `SELECT * FROM ai_agents WHERE user_id = $1 ORDER BY created_at DESC`,
    [g.user.id]
  )
  return NextResponse.json({ agents })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const body = await req.json()
  const { name, description, agent_type, config, capabilities } = body as {
    name?: string
    description?: string
    agent_type?: string
    config?: Record<string, unknown>
    capabilities?: string[]
  }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const validTypes = ['assistant', 'scheduler', 'monitor', 'responder', 'custom']
  const type = validTypes.includes(agent_type || '') ? agent_type : 'assistant'

  const agent = await one(
    `INSERT INTO ai_agents (user_id, name, description, agent_type, config, capabilities)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      g.user.id,
      name.trim(),
      description || '',
      type,
      JSON.stringify(config || {}),
      JSON.stringify(capabilities || []),
    ]
  )

  return NextResponse.json({ agent })
}
