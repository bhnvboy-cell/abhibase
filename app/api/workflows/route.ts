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
}

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const workflows = await query<Workflow>(
    `SELECT id, name, description, trigger_type, trigger_config, actions, enabled, last_run, created_at
     FROM workflows WHERE user_id = $1 ORDER BY created_at DESC`,
    [g.user.id]
  )

  return NextResponse.json({ workflows })
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

  const { name, description, trigger_type, trigger_config, actions } = body as {
    name: string
    description?: string
    trigger_type: string
    trigger_config?: Record<string, unknown>
    actions?: Record<string, unknown>[]
  }

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  if (!trigger_type) {
    return NextResponse.json({ error: 'Trigger type is required' }, { status: 400 })
  }

  const VALID_TRIGGERS = ['manual', 'schedule', 'event', 'webhook']
  if (!VALID_TRIGGERS.includes(trigger_type)) {
    return NextResponse.json(
      { error: `Invalid trigger type. Must be one of: ${VALID_TRIGGERS.join(', ')}` },
      { status: 400 }
    )
  }

  const workflow = await one<Workflow>(
    `INSERT INTO workflows (user_id, name, description, trigger_type, trigger_config, actions)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, description, trigger_type, trigger_config, actions, enabled, last_run, created_at`,
    [
      g.user.id,
      name,
      description || null,
      trigger_type,
      JSON.stringify(trigger_config || {}),
      JSON.stringify(actions || []),
    ]
  )

  return NextResponse.json({ workflow })
}
