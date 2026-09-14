import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

const ALLOWED_COLUMNS = ['name', 'slug', 'html', 'css', 'js', 'template', 'status', 'custom_domain']

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const websites = await query(`
      SELECT * FROM websites 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [g.user.id])

    return NextResponse.json({ websites })
  } catch (error) {
    console.error('Failed to fetch websites:', error)
    return NextResponse.json({ error: 'Failed to fetch websites' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const body = await request.json()
    const { name, slug, html, css, js, template, status } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO websites (user_id, name, slug, html, css, js, template, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [g.user.id, name, slug, html || '', css || '', js || '', template || 'custom', status || 'draft'])

    return NextResponse.json({ website: result[0] })
  } catch (error) {
    console.error('Failed to create website:', error)
    return NextResponse.json({ error: 'Failed to create website' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Whitelist allowed columns to prevent SQL injection
    const validKeys = Object.keys(updates).filter(key => ALLOWED_COLUMNS.includes(key))
    if (validKeys.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const setClauses = validKeys.map((key, i) => `${key} = $${i + 3}`)
    const values = [id, g.user.id, ...validKeys.map(key => updates[key])]

    const result = await query(`
      UPDATE websites 
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, values)

    return NextResponse.json({ website: result[0] })
  } catch (error) {
    console.error('Failed to update website:', error)
    return NextResponse.json({ error: 'Failed to update website' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await query('DELETE FROM websites WHERE id = $1 AND user_id = $2', [id, g.user.id])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete website:', error)
    return NextResponse.json({ error: 'Failed to delete website' }, { status: 500 })
  }
}
