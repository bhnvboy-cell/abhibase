import { NextResponse } from 'next/server'
import { one, query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export const runtime = 'nodejs'

interface RoleRow {
  id: string
  organization_id: string
  name: string
  permissions: unknown
  is_system: boolean
  created_at: string
}

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const orgId = url.searchParams.get('org_id')

  if (!orgId) {
    const memberships = await query<{ organization_id: string }>(
      `SELECT organization_id FROM organization_members WHERE user_id = $1`,
      [g.user.id]
    )
    const orgIds = memberships.map((m) => m.organization_id)
    if (!orgIds.length) return NextResponse.json({ roles: [] })

    const roles = await query<RoleRow>(
      `SELECT id, organization_id, name, permissions, is_system, created_at
       FROM roles WHERE organization_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
      [orgIds]
    )
    return NextResponse.json({ roles })
  }

  const membership = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, g.user.id]
  )
  if (!membership) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const roles = await query<RoleRow>(
    `SELECT id, organization_id, name, permissions, is_system, created_at
     FROM roles WHERE organization_id = $1 ORDER BY created_at ASC`,
    [orgId]
  )

  return NextResponse.json({ roles })
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

  const orgId = typeof body.organization_id === 'string' ? body.organization_id : null
  if (!orgId) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
  }

  const membership = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, g.user.id]
  )
  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized to create roles' }, { status: 403 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
  }

  const dup = await one<{ id: string }>(
    `SELECT id FROM roles WHERE organization_id = $1 AND lower(name) = lower($2)`,
    [orgId, name]
  )
  if (dup) {
    return NextResponse.json({ error: 'A role with that name already exists' }, { status: 409 })
  }

  const permissions = Array.isArray(body.permissions) ? body.permissions : []

  const role = await one<{ id: string }>(
    `INSERT INTO roles (organization_id, name, permissions, is_system) VALUES ($1, $2, $3, false) RETURNING id`,
    [orgId, name, JSON.stringify(permissions)]
  )

  return NextResponse.json({ id: role?.id })
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

  const roleId = typeof body.id === 'string' ? body.id : null
  if (!roleId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const role = await one<RoleRow>(
    `SELECT id, organization_id, name, is_system FROM roles WHERE id = $1`,
    [roleId]
  )
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }
  if (role.is_system) {
    return NextResponse.json({ error: 'System roles cannot be modified' }, { status: 400 })
  }

  const membership = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [role.organization_id, g.user.id]
  )
  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (typeof body.name === 'string' && body.name.trim()) {
    fields.push(`name = $${i}`)
    values.push(body.name.trim())
    i++
  }

  if (Array.isArray(body.permissions)) {
    fields.push(`permissions = $${i}`)
    values.push(JSON.stringify(body.permissions))
    i++
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  values.push(roleId)
  await query(`UPDATE roles SET ${fields.join(', ')} WHERE id = $${i}`, values)

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

  const role = await one<RoleRow>(
    `SELECT id, organization_id, is_system FROM roles WHERE id = $1`,
    [id]
  )
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }
  if (role.is_system) {
    return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 400 })
  }

  const membership = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [role.organization_id, g.user.id]
  )
  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  await query(`DELETE FROM roles WHERE id = $1`, [id])
  return NextResponse.json({ ok: true })
}
