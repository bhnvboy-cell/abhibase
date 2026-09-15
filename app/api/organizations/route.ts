import { NextResponse } from 'next/server'
import { pool, one, query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export const runtime = 'nodejs'

interface OrgRow {
  id: string
  name: string
  slug: string
  owner_id: string
  settings: Record<string, unknown>
  plan: string
  created_at: string
  updated_at: string
}

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const memberships = await query<{ organization_id: string; role: string }>(
    `SELECT organization_id, role FROM organization_members WHERE user_id = $1`,
    [g.user.id]
  )
  const ids = memberships.map((m) => m.organization_id)
  if (!ids.length) return NextResponse.json({ organizations: [] })

  const orgs = await query<OrgRow>(
    `SELECT id, name, slug, owner_id, settings, plan, created_at, updated_at
     FROM organizations WHERE id = ANY($1::uuid[]) ORDER BY created_at DESC`,
    [ids]
  )

  const result = orgs.map((o) => {
    const membership = memberships.find((m) => m.organization_id === o.id)
    return { ...o, my_role: membership?.role ?? null }
  })

  return NextResponse.json({ organizations: result })
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

  if (!body.name || !String(body.name).trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const name = String(body.name).trim()
  const slug = String(body.slug || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const existing = await one<{ id: string }>(
      `SELECT id FROM organizations WHERE slug = $1`,
      [slug]
    )
    if (existing) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }

    const org = await one<{ id: string }>(
      `INSERT INTO organizations (name, slug, owner_id, settings, plan)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        name,
        slug,
        g.user.id,
        JSON.stringify(body.settings ?? {}),
        typeof body.plan === 'string' ? body.plan : 'free',
      ]
    )
    if (!org) throw new Error('Insert failed')

    await client.query(
      `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [org.id, g.user.id]
    )

    await client.query(
      `INSERT INTO roles (organization_id, name, permissions, is_system)
       VALUES ($1, 'Admin', $2, true), ($1, 'Member', $3, true), ($1, 'Viewer', $4, true)`,
      [
        org.id,
        JSON.stringify(['*']),
        JSON.stringify(['read', 'write']),
        JSON.stringify(['read']),
      ]
    )

    await client.query('COMMIT')
    return NextResponse.json({ id: org.id, slug })
  } catch (err) {
    await client.query('ROLLBACK')
    const message = err instanceof Error ? err.message : 'Failed to create organization'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    client.release()
  }
}
