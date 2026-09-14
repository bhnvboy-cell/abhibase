import { NextResponse } from 'next/server'
import { query, one } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export const runtime = 'nodejs'

const STATUSES = ['todo', 'in_progress', 'done']
const PRIORITIES = ['low', 'medium', 'high']

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res
  const tasks = await query(
    `SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC`,
    [g.user.id]
  )
  return NextResponse.json({ tasks })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const body = await req.json()
  if (!body.title || !String(body.title).trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  const priority = PRIORITIES.includes(body.priority) ? body.priority : 'medium'
  const task = await one(
    `INSERT INTO tasks (user_id, title, priority, due_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [g.user.id, String(body.title).trim(), priority, body.due_date || null]
  )
  return NextResponse.json({ task })
}

export async function PATCH(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const sets: string[] = []
  const params: unknown[] = []
  if (typeof body.title === 'string' && body.title.trim()) {
    params.push(body.title.trim())
    sets.push(`title = $${params.length}`)
  }
  if (STATUSES.includes(body.status)) {
    params.push(body.status)
    sets.push(`status = $${params.length}`)
    if (body.status === 'done') {
      sets.push('completed_at = now()')
    } else {
      sets.push('completed_at = NULL')
    }
  }
  if (PRIORITIES.includes(body.priority)) {
    params.push(body.priority)
    sets.push(`priority = $${params.length}`)
  }
  if ('due_date' in body) {
    params.push(body.due_date || null)
    sets.push(`due_date = $${params.length}`)
  }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  sets.push('updated_at = now()')
  params.push(body.id, g.user.id)

  const task = await one(
    `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`,
    params
  )
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  return NextResponse.json({ task })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  await query(`DELETE FROM tasks WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
