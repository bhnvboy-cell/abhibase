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

  const scans = await query(
    `SELECT * FROM security_scans WHERE app_id = $1 ORDER BY created_at DESC`,
    [ctx.params.id]
  )
  return NextResponse.json({ scans })
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
  const { scan_type } = body as { scan_type?: string }

  const validTypes = ['full', 'quick', 'dependency']
  const type = validTypes.includes(scan_type || '') ? scan_type : 'quick'

  const scan = await one(
    `INSERT INTO security_scans (app_id, scan_type)
     VALUES ($1, $2)
     RETURNING *`,
    [ctx.params.id, type]
  )

  return NextResponse.json({ scan })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const body = await req.json()
  const { id, status, findings, score } = body as {
    id?: string
    status?: string
    findings?: unknown[]
    score?: number
  }

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const scan = await one<{ id: string }>(
    `SELECT id FROM security_scans WHERE id = $1 AND app_id = $2`,
    [id, ctx.params.id]
  )
  if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })

  const sets: string[] = []
  const params: unknown[] = []

  const validStatuses = ['pending', 'running', 'completed', 'failed']
  if (status && validStatuses.includes(status)) {
    params.push(status)
    sets.push(`status = $${params.length}`)
    if (status === 'completed' || status === 'failed') {
      sets.push('scanned_at = now()')
    }
  }
  if (findings !== undefined) {
    params.push(JSON.stringify(findings))
    sets.push(`findings = $${params.length}`)
  }
  if (typeof score === 'number') {
    params.push(score)
    sets.push(`score = $${params.length}`)
  }

  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  params.push(id)

  const updated = await one(
    `UPDATE security_scans SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  )

  return NextResponse.json({ scan: updated })
}
