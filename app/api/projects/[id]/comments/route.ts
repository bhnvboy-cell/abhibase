import { NextResponse } from 'next/server'
import { one, query } from '@/lib/db'
import { authGuard, canWrite, getProjectRole, logActivity } from '@/lib/api-helpers'
import type { CardComment } from '@/lib/types'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

export async function GET(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const role = await getProjectRole(ctx.params.id, g.user.id)
  if (!role) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const cardId = new URL(req.url).searchParams.get('cardId')
  if (!cardId) return NextResponse.json({ error: 'cardId query param required' }, { status: 400 })
  const card = await one<{ id: string }>(
    `SELECT id FROM cards WHERE id = $1 AND project_id = $2`,
    [cardId, ctx.params.id]
  )
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const rows = await query<CardComment & { profile_full_name: string; profile_email: string }>(
    `SELECT c.*, u.full_name AS profile_full_name, u.email AS profile_email
     FROM card_comments c JOIN users u ON u.id = c.user_id
     WHERE c.card_id = $1 ORDER BY c.created_at ASC`,
    [cardId]
  )
  const comments = rows.map((c) => ({
    id: c.id,
    card_id: c.card_id,
    user_id: c.user_id,
    content: c.content,
    created_at: c.created_at,
    profiles: {
      id: c.user_id,
      email: c.profile_email,
      full_name: c.profile_full_name,
      avatar_url: null as string | null,
      created_at: '',
    },
  }))
  return NextResponse.json({ comments })
}

export async function POST(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const projectId = ctx.params.id
  const role = await getProjectRole(projectId, g.user.id)
  if (!canWrite(role)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

  const body = await req.json()
  if (!body.card_id || !body.content || !String(body.content).trim()) {
    return NextResponse.json({ error: 'card_id and content are required' }, { status: 400 })
  }
  const card = await one<{ id: string; title: string }>(
    `SELECT id, title FROM cards WHERE id = $1 AND project_id = $2`,
    [body.card_id, projectId]
  )
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  await query(`INSERT INTO card_comments (card_id, user_id, content) VALUES ($1, $2, $3)`, [
    card.id,
    g.user.id,
    String(body.content).trim(),
  ])
  await logActivity(projectId, g.user.id, `commented on "${card.title}"`)
  return NextResponse.json({ ok: true })
}
