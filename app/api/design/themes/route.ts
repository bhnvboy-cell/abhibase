import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const themes = await query<{
    id: string
    name: string
    colors: Record<string, string>
    fonts: Record<string, string>
    spacing: Record<string, unknown>
    is_default: boolean
    created_at: string
    updated_at: string
  }>(
    `SELECT id, name, colors, fonts, spacing, is_default, created_at, updated_at
     FROM design_themes WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [g.user.id]
  )

  return NextResponse.json({ themes })
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

  const { name, colors, fonts, spacing } = body as {
    name: string
    colors: Record<string, string>
    fonts: Record<string, string>
    spacing: Record<string, unknown>
  }

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const theme = await one<{
    id: string
    name: string
    colors: Record<string, string>
    fonts: Record<string, string>
    spacing: Record<string, unknown>
    is_default: boolean
    created_at: string
    updated_at: string
  }>(
    `INSERT INTO design_themes (user_id, name, colors, fonts, spacing)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, colors, fonts, spacing, is_default, created_at, updated_at`,
    [
      g.user.id,
      name,
      JSON.stringify(colors || {}),
      JSON.stringify(fonts || {}),
      JSON.stringify(spacing || {}),
    ]
  )

  return NextResponse.json({ theme })
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

  for (const key of ['name', 'colors', 'fonts', 'spacing', 'is_default']) {
    if (key in patch) {
      const val = ['colors', 'fonts', 'spacing'].includes(key) ? JSON.stringify(patch[key]) : patch[key]
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
  await query(`UPDATE design_themes SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i + 1}`, values)

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

  await query(`DELETE FROM design_themes WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
