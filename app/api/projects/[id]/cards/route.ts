import { NextResponse } from 'next/server'
import { one, query } from '@/lib/db'
import { authGuard, canWrite, getProjectRole, logActivity } from '@/lib/api-helpers'
import type { Card } from '@/lib/types'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

async function cardWithColumnCheck(projectId: string, columnId: string) {
  return one<{ id: string }>(
    `SELECT id FROM board_columns WHERE id = $1 AND project_id = $2`,
    [columnId, projectId]
  )
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const role = await getProjectRole(ctx.params.id, g.user.id)
  if (!role) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const cards = await query<Card>(
    `SELECT * FROM cards WHERE project_id = $1 ORDER BY position ASC`,
    [ctx.params.id]
  )
  return NextResponse.json({ cards })
}

export async function POST(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const projectId = ctx.params.id
  const role = await getProjectRole(projectId, g.user.id)
  if (!canWrite(role)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

  const body = await req.json()
  if (!body.title || !String(body.title).trim() || !body.column_id) {
    return NextResponse.json({ error: 'title and column_id are required' }, { status: 400 })
  }
  const col = await cardWithColumnCheck(projectId, body.column_id)
  if (!col) return NextResponse.json({ error: 'Invalid column' }, { status: 400 })

  const maxRow = await one<{ pos: number | null }>(
    `SELECT MAX(position) AS pos FROM cards WHERE column_id = $1`,
    [body.column_id]
  )
  const position = (maxRow?.pos ?? -1) + 1

  await query(
    `INSERT INTO cards (project_id, column_id, title, position) VALUES ($1, $2, $3, $4)`,
    [projectId, body.column_id, String(body.title).trim(), position]
  )
  await logActivity(projectId, g.user.id, `created card "${String(body.title).trim()}"`)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const projectId = ctx.params.id
  const role = await getProjectRole(projectId, g.user.id)
  if (!canWrite(role)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const existing = await one<{ title: string; column_id: string }>(
    `SELECT title, column_id FROM cards WHERE id = $1 AND project_id = $2`,
    [body.id, projectId]
  )
  if (!existing) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const sets: string[] = []
  const params: unknown[] = []

  if ('column_id' in body && body.column_id !== existing.column_id) {
    const col = await cardWithColumnCheck(projectId, body.column_id)
    if (!col) return NextResponse.json({ error: 'Invalid column' }, { status: 400 })
    params.push(body.column_id)
    sets.push(`column_id = $${params.length}`)
  }
  if (typeof body.position === 'number') {
    params.push(body.position)
    sets.push(`position = $${params.length}`)
  }
  if (typeof body.title === 'string' && body.title.trim()) {
    params.push(body.title.trim())
    sets.push(`title = $${params.length}`)
  }
  if (typeof body.description === 'string') {
    params.push(body.description)
    sets.push(`description = $${params.length}`)
  }
  if ('assignee_id' in body) {
    params.push(body.assignee_id || null)
    sets.push(`assignee_id = $${params.length}`)
  }
  if ('due_date' in body) {
    params.push(body.due_date || null)
    sets.push(`due_date = $${params.length}`)
  }

  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  sets.push('updated_at = now()')
  params.push(body.id)

  await query(
    `UPDATE cards SET ${sets.join(', ')} WHERE id = $${params.length}`,
    params
  )

  const newTitle =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim() : existing.title
  if ('column_id' in body && body.column_id !== existing.column_id) {
    const colName = await one<{ name: string }>(
      `SELECT name FROM board_columns WHERE id = $1`,
      [body.column_id]
    )
    await logActivity(
      projectId,
      g.user.id,
      `moved "${newTitle}" to ${colName?.name ?? 'a column'}`
    )
  } else {
    await logActivity(projectId, g.user.id, `updated "${newTitle}"`)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const projectId = ctx.params.id
  const role = await getProjectRole(projectId, g.user.id)
  if (!canWrite(role)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })

  const existing = await one<{ title: string }>(
    `SELECT title FROM cards WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  )
  if (!existing) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  await query(`DELETE FROM cards WHERE id = $1`, [id])
  await logActivity(projectId, g.user.id, `deleted "${existing.title}"`)
  return NextResponse.json({ ok: true })
}
