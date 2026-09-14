import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const branches = await query<{
    id: string
    name: string
    description: string
    parent_branch: string
    snapshot: Record<string, unknown>
    merged: boolean
    created_at: string
  }>(
    `SELECT id, name, description, parent_branch, snapshot, merged, created_at
     FROM branches WHERE user_id = $1 ORDER BY created_at DESC`,
    [g.user.id]
  )

  return NextResponse.json({ branches })
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

  const { name, description } = body as { name: string; description: string }

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const snapshot = await createSnapshot(g.user.id)

  const branch = await one<{
    id: string
    name: string
    description: string
    parent_branch: string
    snapshot: Record<string, unknown>
    merged: boolean
    created_at: string
  }>(
    `INSERT INTO branches (user_id, name, description, snapshot)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, parent_branch, snapshot, merged, created_at`,
    [g.user.id, name, description || '', JSON.stringify(snapshot)]
  )

  return NextResponse.json({ branch })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await query(`DELETE FROM branches WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}

async function createSnapshot(userId: string) {
  const notes = await query(`SELECT id, title, content, tags FROM notes WHERE user_id = $1`, [userId])
  const tasks = await query(`SELECT id, title, description, status, priority FROM tasks WHERE user_id = $1`, [userId])
  const habits = await query(`SELECT id, name, icon, color, target_per_week FROM habits WHERE user_id = $1`, [userId])

  return {
    notes: notes.length,
    tasks: tasks.length,
    habits: habits.length,
    notes_data: notes,
    tasks_data: tasks,
    habits_data: habits,
    created_at: new Date().toISOString(),
  }
}
