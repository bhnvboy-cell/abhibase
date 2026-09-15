import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const components = await query<{
    id: string
    name: string
    type: string
    props: Record<string, unknown>
    styles: Record<string, unknown>
    category: string
    created_at: string
    updated_at: string
  }>(
    `SELECT id, name, type, props, styles, category, created_at, updated_at
     FROM design_components WHERE user_id = $1
     ORDER BY category, name`,
    [g.user.id]
  )

  return NextResponse.json({ components })
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

  const { name, type, props, styles, category } = body as {
    name: string
    type: string
    props: Record<string, unknown>
    styles: Record<string, unknown>
    category: string
  }

  if (!name || !type) {
    return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
  }

  const component = await one<{
    id: string
    name: string
    type: string
    props: Record<string, unknown>
    styles: Record<string, unknown>
    category: string
    created_at: string
    updated_at: string
  }>(
    `INSERT INTO design_components (user_id, name, type, props, styles, category)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, type, props, styles, category, created_at, updated_at`,
    [
      g.user.id,
      name,
      type,
      JSON.stringify(props || {}),
      JSON.stringify(styles || {}),
      category || 'general',
    ]
  )

  return NextResponse.json({ component })
}

export async function PATCH(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, ...patch } = body as { id: string; [key: string]: unknown }
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  for (const key of ['name', 'type', 'props', 'styles', 'category']) {
    if (key in patch) {
      const val = ['props', 'styles'].includes(key) ? JSON.stringify(patch[key]) : patch[key]
      fields.push(`${key} = $${i}`)
      values.push(val)
      i++
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  fields.push(`updated_at = NOW()`)
  values.push(id, g.user.id)
  await query(`UPDATE design_components SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i + 1}`, values)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await query(`DELETE FROM design_components WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
