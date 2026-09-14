import { NextResponse } from 'next/server'
import { pool, one, query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'
import type { ExpenseGroup, GroupMember } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const memberships = await query<{ group_id: string }>(
    `SELECT group_id FROM group_members WHERE user_id = $1`,
    [g.user.id]
  )
  const ids = memberships.map((m) => m.group_id)
  if (!ids.length) return NextResponse.json({ groups: [] })

  const groups = await query<ExpenseGroup>(
    `SELECT * FROM expense_groups WHERE id = ANY($1::uuid[]) ORDER BY created_at DESC`,
    [ids]
  )
  const members = await query<GroupMember & { profile_full_name: string; profile_email: string }>(
    `SELECT gm.*, u.full_name AS profile_full_name, u.email AS profile_email
     FROM group_members gm JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ANY($1::uuid[])`,
    [ids]
  )

  const result = groups.map((grp) => ({
    ...grp,
    group_members: members
      .filter((m) => m.group_id === grp.id)
      .map((m) => ({
        id: m.id,
        group_id: m.group_id,
        user_id: m.user_id,
        profiles: {
          id: m.user_id,
          email: m.profile_email,
          full_name: m.profile_full_name,
          avatar_url: null as string | null,
          created_at: '',
        },
      })),
  }))
  return NextResponse.json({ groups: result })
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
    const group = await one<{ id: string }>(
      `INSERT INTO expense_groups (name, emoji, created_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [
        String(body.name).trim(),
        typeof body.emoji === 'string' && body.emoji ? body.emoji.slice(0, 2) : '🏠',
        g.user.id,
      ]
    )
    if (!group) throw new Error('Insert failed')
    await client.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
      [group.id, g.user.id]
    )
    await client.query('COMMIT')
    return NextResponse.json({ id: group.id })
  } catch (err) {
    await client.query('ROLLBACK')
    const message = err instanceof Error ? err.message : 'Failed to create group'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    client.release()
  }
}
