import { NextResponse } from 'next/server'
import { one, query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

async function getOrgRole(orgId: string, userId: string) {
  const row = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, userId]
  )
  return row?.role ?? null
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const role = await getOrgRole(ctx.params.id, g.user.id)
  if (!role) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const rows = await query<{
    id: string
    organization_id: string
    user_id: string
    role: string
    permissions: Record<string, unknown>
    joined_at: string
    profile_full_name: string
    profile_email: string
  }>(
    `SELECT om.*, u.full_name AS profile_full_name, u.email AS profile_email
     FROM organization_members om JOIN users u ON u.id = om.user_id
     WHERE om.organization_id = $1 ORDER BY om.joined_at ASC`,
    [ctx.params.id]
  )

  const members = rows.map((m) => ({
    id: m.id,
    organization_id: m.organization_id,
    user_id: m.user_id,
    role: m.role,
    permissions: m.permissions,
    joined_at: m.joined_at,
    profiles: {
      id: m.user_id,
      email: m.profile_email,
      full_name: m.profile_full_name,
      avatar_url: null as string | null,
    },
  }))

  return NextResponse.json({ members })
}

export async function POST(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const orgId = ctx.params.id
  const role = await getOrgRole(orgId, g.user.id)
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Only owners or admins can add members' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const target = await one<{ id: string }>(
    `SELECT id FROM users WHERE lower(email) = $1`,
    [email]
  )
  if (!target) {
    return NextResponse.json({ error: 'No AbhiBase user found with that email' }, { status: 404 })
  }

  const dup = await one<{ id: string }>(
    `SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, target.id]
  )
  if (dup) {
    return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
  }

  const validRoles = ['admin', 'member', 'viewer']
  const memberRole = validRoles.includes(body.role as string) ? body.role : 'member'

  await query(
    `INSERT INTO organization_members (organization_id, user_id, role, permissions) VALUES ($1, $2, $3, $4)`,
    [orgId, target.id, memberRole, JSON.stringify(body.permissions ?? {})]
  )

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const orgId = ctx.params.id
  const myRole = await getOrgRole(orgId, g.user.id)
  if (myRole !== 'owner' && myRole !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const userId = typeof body.user_id === 'string' ? body.user_id : null
  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  if (myRole !== 'owner' && body.role === 'owner') {
    return NextResponse.json({ error: 'Only the owner can transfer ownership' }, { status: 403 })
  }

  const target = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, userId]
  )
  if (!target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }
  if (target.role === 'owner' && body.role !== 'owner') {
    return NextResponse.json({ error: 'The owner role cannot be changed' }, { status: 400 })
  }

  const validRoles = ['admin', 'member', 'viewer']
  const newRole = validRoles.includes(body.role as string) ? body.role : null

  if (newRole) {
    await query(
      `UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3`,
      [newRole, orgId, userId]
    )
  }

  if (body.permissions !== undefined) {
    await query(
      `UPDATE organization_members SET permissions = $1 WHERE organization_id = $2 AND user_id = $3`,
      [JSON.stringify(body.permissions), orgId, userId]
    )
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res

  const orgId = ctx.params.id
  const myRole = await getOrgRole(orgId, g.user.id)

  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId query param required' }, { status: 400 })
  }

  if (myRole !== 'owner' && myRole !== 'admin' && userId !== g.user.id) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const target = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, userId]
  )
  if (!target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'The owner cannot be removed' }, { status: 400 })
  }

  await query(
    `DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, userId]
  )

  return NextResponse.json({ ok: true })
}
