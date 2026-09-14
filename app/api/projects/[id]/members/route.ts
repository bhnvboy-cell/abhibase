import { NextResponse } from 'next/server'
import { one, query } from '@/lib/db'
import { authGuard, getProjectRole, logActivity } from '@/lib/api-helpers'
import type { ProjectMember } from '@/lib/types'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const role = await getProjectRole(ctx.params.id, g.user.id)
  if (!role) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const rows = await query<ProjectMember & { profile_full_name: string; profile_email: string }>(
    `SELECT pm.*, u.full_name AS profile_full_name, u.email AS profile_email
     FROM project_members pm JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1 ORDER BY pm.created_at ASC`,
    [ctx.params.id]
  )
  const members = rows.map((m) => ({
    id: m.id,
    project_id: m.project_id,
    user_id: m.user_id,
    role: m.role,
    profiles: {
      id: m.user_id,
      email: m.profile_email,
      full_name: m.profile_full_name,
      avatar_url: null as string | null,
      created_at: '',
    },
  }))
  return NextResponse.json({ members })
}

export async function POST(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const projectId = ctx.params.id
  const role = await getProjectRole(projectId, g.user.id)
  if (role !== 'owner') {
    return NextResponse.json({ error: 'Only the project owner can add members' }, { status: 403 })
  }

  const body = await req.json()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const target = await one<{ id: string; full_name: string }>(
    `SELECT id, full_name FROM users WHERE lower(email) = $1`,
    [email]
  )
  if (!target) {
    return NextResponse.json(
      { error: 'No AbhiBase user found with that email' },
      { status: 404 }
    )
  }
  const dup = await one(`SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`, [
    projectId,
    target.id,
  ])
  if (dup) {
    return NextResponse.json({ error: 'That person is already a member' }, { status: 409 })
  }

  await query(
    `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`,
    [projectId, target.id, typeof body.role === 'string' && ['editor', 'viewer'].includes(body.role) ? body.role : 'editor']
  )
  const name = target.full_name || email
  await logActivity(projectId, g.user.id, `added ${name} to the project`)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const projectId = ctx.params.id
  const role = await getProjectRole(projectId, g.user.id)

  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId query param required' }, { status: 400 })
  if (role !== 'owner' && userId !== g.user.id) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const target = await one<{ role: string }>(
    `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  )
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'The owner cannot be removed' }, { status: 400 })
  }

  await query(`DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, [
    projectId,
    userId,
  ])
  return NextResponse.json({ ok: true })
}
