import { NextResponse } from 'next/server'
import { query, one } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res
  const notes = await query(
    `SELECT * FROM notes WHERE user_id = $1
     ORDER BY pinned DESC, updated_at DESC`,
    [g.user.id]
  )
  return NextResponse.json({ notes })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const body = await req.json()
  const note = await one(
    `INSERT INTO notes (user_id, title, content, tags)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      g.user.id,
      typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled',
      typeof body.content === 'string' ? body.content : '',
      Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).toLowerCase()) : [],
    ]
  )
  return NextResponse.json({ note })
}

export async function PATCH(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const sets: string[] = []
  const params: unknown[] = []
  if (typeof body.title === 'string') {
    params.push(body.title.trim() || 'Untitled')
    sets.push(`title = $${params.length}`)
  }
  if (typeof body.content === 'string') {
    params.push(body.content)
    sets.push(`content = $${params.length}`)
  }
  if (Array.isArray(body.tags)) {
    params.push(body.tags.map((t: unknown) => String(t).toLowerCase()))
    sets.push(`tags = $${params.length}`)
  }
  if (typeof body.summary === 'string' || body.summary === null) {
    params.push(body.summary)
    sets.push(`summary = $${params.length}`)
  }
  if (typeof body.pinned === 'boolean') {
    params.push(body.pinned)
    sets.push(`pinned = $${params.length}`)
  }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  sets.push('updated_at = now()')
  params.push(body.id, g.user.id)

  const note = await one(
    `UPDATE notes SET ${sets.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`,
    params
  )
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  return NextResponse.json({ note })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  await query(`DELETE FROM notes WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
