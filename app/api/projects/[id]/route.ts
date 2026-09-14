import { NextResponse } from 'next/server'
import { one, query } from '@/lib/db'
import { authGuard, getProjectRole } from '@/lib/api-helpers'
import type { BoardColumn, Project, ProjectMember } from '@/lib/types'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const projectId = ctx.params.id

  const role = await getProjectRole(projectId, g.user.id)
  if (!role) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const project = await one<Project>(`SELECT * FROM projects WHERE id = $1`, [projectId])
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const memberRows = await query<
    ProjectMember & { profile_full_name: string; profile_email: string }
  >(
    `SELECT pm.*, u.full_name AS profile_full_name, u.email AS profile_email
     FROM project_members pm JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1 ORDER BY pm.created_at ASC`,
    [projectId]
  )
  const columns = await query<BoardColumn>(
    `SELECT * FROM board_columns WHERE project_id = $1 ORDER BY position ASC`,
    [projectId]
  )

  return NextResponse.json({
    project: {
      ...project,
      project_members: memberRows.map((m) => ({
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
    },
    columns,
  })
}
