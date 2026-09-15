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

  const app = await one<{ id: string }>(
    `SELECT id FROM generated_apps WHERE id = $1 AND user_id = $2`,
    [ctx.params.id, g.user.id]
  )
  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 })

  const tests = await query(
    `SELECT * FROM app_tests WHERE app_id = $1 ORDER BY created_at DESC`,
    [ctx.params.id]
  )
  return NextResponse.json({ tests })
}

export async function POST(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const app = await one<{ id: string }>(
    `SELECT id FROM generated_apps WHERE id = $1 AND user_id = $2`,
    [ctx.params.id, g.user.id]
  )
  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 })

  const body = await req.json()
  const { name, test_type } = body as { name?: string; test_type?: string }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const validTypes = ['unit', 'integration', 'e2e', 'security']
  const type = validTypes.includes(test_type || '') ? test_type : 'unit'

  const test = await one(
    `INSERT INTO app_tests (app_id, name, test_type)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [ctx.params.id, name.trim(), type]
  )

  return NextResponse.json({ test })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const body = await req.json()
  const { id, status, results, duration } = body as {
    id?: string
    status?: string
    results?: Record<string, unknown>
    duration?: number
  }

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const test = await one<{ id: string }>(
    `SELECT id FROM app_tests WHERE id = $1 AND app_id = $2`,
    [id, ctx.params.id]
  )
  if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })

  const sets: string[] = []
  const params: unknown[] = []

  const validStatuses = ['pending', 'running', 'passed', 'failed']
  if (status && validStatuses.includes(status)) {
    params.push(status)
    sets.push(`status = $${params.length}`)
    if (status === 'passed' || status === 'failed') {
      sets.push('ran_at = now()')
    }
  }
  if (results !== undefined) {
    params.push(JSON.stringify(results))
    sets.push(`results = $${params.length}`)
  }
  if (typeof duration === 'number') {
    params.push(duration)
    sets.push(`duration = $${params.length}`)
  }

  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  params.push(id)

  const updated = await one(
    `UPDATE app_tests SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  )

  return NextResponse.json({ test: updated })
}
