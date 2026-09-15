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

  const branches = await query(
    `SELECT * FROM app_branches WHERE app_id = $1 ORDER BY created_at DESC`,
    [ctx.params.id]
  )
  return NextResponse.json({ branches })
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
  const { name, description, schema, parent_branch_id } = body as {
    name?: string
    description?: string
    schema?: Record<string, unknown>
    parent_branch_id?: string
  }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const branch = await one(
    `INSERT INTO app_branches (app_id, name, description, schema, parent_branch_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      ctx.params.id,
      name.trim(),
      description || '',
      JSON.stringify(schema || {}),
      parent_branch_id || null,
    ]
  )

  return NextResponse.json({ branch })
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })

  const branch = await one<{ id: string }>(
    `SELECT id FROM app_branches WHERE id = $1 AND app_id = $2`,
    [id, ctx.params.id]
  )
  if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 })

  await query(
    `UPDATE app_branches SET status = 'deleted', updated_at = now() WHERE id = $1`,
    [id]
  )
  return NextResponse.json({ ok: true })
}
