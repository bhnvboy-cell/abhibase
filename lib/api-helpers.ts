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

export async function logActivity(
  projectId: string,
  userId: string,
  action: string,
  details?: Record<string, any>
) {
  await query(
    `INSERT INTO activities (project_id, user_id, action, metadata) VALUES ($1, $2, $3, $4)`,
    [projectId, userId, action, details ? JSON.stringify(details) : null]
  )
}

export async function logSecurityEvent(
  userId: string | null,
  event: string,
  ip: string | null,
  details?: Record<string, any>
) {
  await query(
    `INSERT INTO security_events (user_id, event, ip_address, metadata) VALUES ($1, $2, $3, $4)`,
    [userId, event, ip, details ? JSON.stringify(details) : null]
  )
}

export const ACCENTS = ['violet', 'blue', 'emerald', 'amber', 'rose'] as const

export function safeAccent(value: unknown, fallback = 'violet') {
  return ACCENTS.includes(value as (typeof ACCENTS)[number]) ? value : fallback
}
