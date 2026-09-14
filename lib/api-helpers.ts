import { NextResponse } from 'next/server'
import { getSessionUser, type SessionUser } from '@/lib/auth-server'
import { one, query } from '@/lib/db'

type Guard = { user: SessionUser; res?: undefined } | { user?: undefined; res: NextResponse }

export async function authGuard(): Promise<Guard> {
  const user = await getSessionUser()
  if (!user) {
    return { res: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) }
  }
  return { user }
}

export async function getProjectRole(projectId: string, userId: string) {
  const row = await one<{ role: string }>(
    `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  )
  return row?.role ?? null
}

export function canWrite(role: string | null) {
  return role === 'owner' || role === 'editor'
}

export async function logActivity(projectId: string, userId: string, action: string) {
  await query(`INSERT INTO activities (project_id, user_id, action) VALUES ($1, $2, $3)`, [
    projectId,
    userId,
    action,
  ])
}

export const ACCENTS = ['violet', 'blue', 'emerald', 'amber', 'rose'] as const

export function safeAccent(value: unknown, fallback = 'violet') {
  return ACCENTS.includes(value as (typeof ACCENTS)[number]) ? value : fallback
}
