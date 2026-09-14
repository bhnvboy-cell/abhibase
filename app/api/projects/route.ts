import { NextResponse } from 'next/server'
import { pool, one, query } from '@/lib/db'
import { authGuard, safeAccent } from '@/lib/api-helpers'
import type { Project, ProjectMember } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const memberships = await query<{ project_id: string }>(
    `SELECT project_id FROM project_members WHERE user_id = $1`,
    [g.user.id]
  )
  const ids = memberships.map((m) => m.project_id)
  if (!ids.length) return NextResponse.json({ projects: [] })

  const projects = await query<Project>(
    `SELECT * FROM projects WHERE id = ANY($1::uuid[]) ORDER BY created_at DESC`,
    [ids]
  )
  const members = await query<ProjectMember & { profile_full_name: string; profile_email: string }>(
    `SELECT pm.*, u.full_name AS profile_full_name, u.email AS profile_email
     FROM project_members pm JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ANY($1::uuid[])`,
    [ids]
  )

  const result = projects.map((p) => ({
    ...p,
    project_members: members
      .filter((m) => m.project_id === p.id)
      .map((m) => ({
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
      })),
  }))
  return NextResponse.json({ projects: result })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  const body = await req.json()
  if (!body.name || !String(body.name).trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const project = await one<{ id: string; name: string }>(
      `INSERT INTO projects (name, description, color, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name`,
      [
        String(body.name).trim(),
        typeof body.description === 'string' ? body.description.trim() : '',
        safeAccent(body.color),
        g.user.id,
      ]
    )
    if (!project) throw new Error('Insert failed')
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [project.id, g.user.id]
    )
    await client.query(
      `INSERT INTO board_columns (project_id, name, position) VALUES
        ($1, 'Backlog', 0), ($1, 'In Progress', 1), ($1, 'Review', 2), ($1, 'Done', 3)`,
      [project.id]
    )
    await client.query('COMMIT')
    return NextResponse.json({ id: project.id })
  } catch (err) {
    await client.query('ROLLBACK')
    const message = err instanceof Error ? err.message : 'Failed to create project'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    client.release()
  }
}
