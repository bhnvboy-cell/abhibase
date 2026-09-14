import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { authGuard, getProjectRole } from '@/lib/api-helpers'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const role = await getProjectRole(ctx.params.id, g.user.id)
  if (!role) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const activities = await query(
    `SELECT a.id, a.project_id, a.user_id, a.action, a.created_at,
            u.full_name AS profile_full_name, u.email AS profile_email
     FROM activities a JOIN users u ON u.id = a.user_id
     WHERE a.project_id = $1
     ORDER BY a.created_at DESC
     LIMIT 30`,
    [ctx.params.id]
  )

  return NextResponse.json({ activities })
}
