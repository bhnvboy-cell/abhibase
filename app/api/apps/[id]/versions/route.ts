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

  const versions = await query(
    `SELECT * FROM app_versions WHERE app_id = $1 ORDER BY created_at DESC`,
    [ctx.params.id]
  )
  return NextResponse.json({ versions })
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
  const { version, schema, changelog } = body as {
    version?: string
    schema?: Record<string, unknown>
    changelog?: string
  }

  if (!version || typeof version !== 'string') {
    return NextResponse.json({ error: 'Version is required' }, { status: 400 })
  }

  const release = await one(
    `INSERT INTO app_versions (app_id, version, schema, changelog, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      ctx.params.id,
      version.trim(),
      JSON.stringify(schema || {}),
      changelog || '',
      g.user.id,
    ]
  )

  return NextResponse.json({ version: release })
}
