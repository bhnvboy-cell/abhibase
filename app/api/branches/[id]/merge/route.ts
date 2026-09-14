import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const g = await authGuard()
  if (g.res) return g.res

  const branch = await one<{ id: string; name: string; merged: boolean }>(
    `SELECT id, name, merged FROM branches WHERE id = $1 AND user_id = $2`,
    [params.id, g.user.id]
  )

  if (!branch) {
    return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
  }

  if (branch.merged) {
    return NextResponse.json({ error: 'Branch already merged' }, { status: 400 })
  }

  await query(`UPDATE branches SET merged = true WHERE id = $1`, [params.id])

  return NextResponse.json({ ok: true, message: `Branch "${branch.name}" merged to main` })
}
