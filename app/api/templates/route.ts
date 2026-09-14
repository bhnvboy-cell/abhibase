import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const templates = await query<{
    id: string
    name: string
    description: string
    category: string
    data: Record<string, unknown>
    public: boolean
    use_count: number
    created_at: string
  }>(
    `SELECT id, name, description, category, data, public, use_count, created_at
     FROM templates WHERE user_id = $1 OR public = true
     ORDER BY use_count DESC, created_at DESC`,
    [g.user.id]
  )

  return NextResponse.json({ templates })
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

  if (body.apply && typeof body.id === 'string') {
    const template = await one<{ id: string; data: Record<string, unknown>; user_id: string }>(
      `SELECT id, data, user_id FROM templates WHERE id = $1`,
      [body.id]
    )
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await query(`UPDATE templates SET use_count = use_count + 1 WHERE id = $1`, [body.id])

    const data = template.data
    if (data.type === 'task' && typeof data.title === 'string') {
      await query(
        `INSERT INTO tasks (user_id, title, description, priority, due_date)
         VALUES ($1, $2, $3, $4, $5)`,
        [g.user.id, data.title, data.description || '', data.priority || 'medium', data.due_date || null]
      )
    } else if (data.type === 'note' && typeof data.title === 'string') {
      await query(
        `INSERT INTO notes (user_id, title, content, tags)
         VALUES ($1, $2, $3, $4)`,
        [g.user.id, data.title, data.content || '', data.tags || []]
      )
    } else if (data.type === 'project' && typeof data.name === 'string') {
      const project = await one<{ id: string }>(
        `INSERT INTO projects (name, description, color, created_by)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [data.name, data.description || '', data.color || 'violet', g.user.id]
      )
      if (project) {
        await query(
          `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`,
          [project.id, g.user.id]
        )
        const cols = ['Backlog', 'In Progress', 'Review', 'Done']
        for (let i = 0; i < cols.length; i++) {
          await query(
            `INSERT INTO board_columns (project_id, name, position) VALUES ($1, $2, $3)`,
            [project.id, cols[i], i]
          )
        }
      }
    }

    return NextResponse.json({ ok: true })
  }

  const { name, description, category, data } = body as {
    name: string
    description: string
    category: string
    data: Record<string, unknown>
  }

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const template = await one<{
    id: string
    name: string
    description: string
    category: string
    data: Record<string, unknown>
    public: boolean
    use_count: number
    created_at: string
  }>(
    `INSERT INTO templates (user_id, name, description, category, data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, description, category, data, public, use_count, created_at`,
    [g.user.id, name, description || '', category || 'general', JSON.stringify(data || {})]
  )

  return NextResponse.json({ template })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await query(`DELETE FROM templates WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
