import { NextResponse } from 'next/server'
import { one, query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'
import type { Expense, ExpenseGroup, GroupMember, Settlement } from '@/lib/types'

export const runtime = 'nodejs'

interface Ctx {
  params: { id: string }
}

async function requireMember(groupId: string, userId: string) {
  const role = await one<{ role: null }>(
    `SELECT NULL FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  )
  return role !== null
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  if (!(await requireMember(ctx.params.id, g.user.id))) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  const group = await one<ExpenseGroup>(`SELECT * FROM expense_groups WHERE id = $1`, [
    ctx.params.id,
  ])
  const memberRows = await query<GroupMember & { profile_full_name: string; profile_email: string }>(
    `SELECT gm.*, u.full_name AS profile_full_name, u.email AS profile_email
     FROM group_members gm JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1 ORDER BY gm.created_at ASC`,
    [ctx.params.id]
  )
  const expenses = await query<Expense>(
    `SELECT * FROM expenses WHERE group_id = $1
     ORDER BY expense_date DESC, created_at DESC`,
    [ctx.params.id]
  )
  const settlements = await query<Settlement>(
    `SELECT * FROM settlements WHERE group_id = $1 ORDER BY created_at DESC`,
    [ctx.params.id]
  )

  const members = memberRows.map((m) => ({
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
  }))
  return NextResponse.json({ group, members, expenses, settlements })
}

export async function POST(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const groupId = ctx.params.id
  if (!(await requireMember(groupId, g.user.id))) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  const body = await req.json()
  const kind = body.kind

  if (kind === 'expense') {
    if (!body.description || !String(body.description).trim() || !Number(body.amount)) {
      return NextResponse.json(
        { error: 'description and amount are required' },
        { status: 400 }
      )
    }
    const paidBy = body.paid_by || g.user.id
    const payerIsMember = await one(
      `SELECT NULL FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, paidBy]
    )
    if (!payerIsMember) {
      return NextResponse.json({ error: 'Payer is not a group member' }, { status: 400 })
    }
    await query(
      `INSERT INTO expenses (group_id, paid_by, description, amount, split_with, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        groupId,
        paidBy,
        String(body.description).trim(),
        Number(body.amount),
        Array.isArray(body.split_with) && body.split_with.length ? body.split_with : [],
        body.expense_date || new Date().toISOString().slice(0, 10),
      ]
    )
    return NextResponse.json({ ok: true })
  }

  if (kind === 'settlement') {
    if (!body.from_user || !body.to_user || !Number(body.amount)) {
      return NextResponse.json(
        { error: 'from_user, to_user and amount are required' },
        { status: 400 }
      )
    }
    for (const uid of [body.from_user, body.to_user]) {
      const ok = await one(`SELECT NULL FROM group_members WHERE group_id = $1 AND user_id = $2`, [
        groupId,
        uid,
      ])
      if (!ok) return NextResponse.json({ error: 'User not in this group' }, { status: 400 })
    }
    await query(
      `INSERT INTO settlements (group_id, from_user, to_user, amount) VALUES ($1, $2, $3, $4)`,
      [groupId, body.from_user, body.to_user, Number(body.amount)]
    )
    return NextResponse.json({ ok: true })
  }

  if (kind === 'member') {
    const creator = await one<{ created_by: string }>(
      `SELECT created_by FROM expense_groups WHERE id = $1`,
      [groupId]
    )
    if (creator?.created_by !== g.user.id) {
      return NextResponse.json(
        { error: 'Only the group creator can add members' },
        { status: 403 }
      )
    }
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
    const dup = await one(`SELECT NULL FROM group_members WHERE group_id = $1 AND user_id = $2`, [
      groupId,
      target.id,
    ])
    if (dup) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 })
    }
    await query(`INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`, [
      groupId,
      target.id,
    ])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await authGuard()
  if (g.res) return g.res
  const groupId = ctx.params.id
  if (!(await requireMember(groupId, g.user.id))) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  const params = new URL(req.url).searchParams
  const expenseId = params.get('expenseId')
  const settlementId = params.get('settlementId')
  const userId = params.get('userId')

  if (expenseId) {
    await query(`DELETE FROM expenses WHERE id = $1 AND group_id = $2`, [expenseId, groupId])
    return NextResponse.json({ ok: true })
  }
  if (settlementId) {
    await query(`DELETE FROM settlements WHERE id = $1 AND group_id = $2`, [
      settlementId,
      groupId,
    ])
    return NextResponse.json({ ok: true })
  }
  if (userId) {
    const creator = await one<{ created_by: string }>(
      `SELECT created_by FROM expense_groups WHERE id = $1`,
      [groupId]
    )
    if (userId !== g.user.id && creator?.created_by !== g.user.id) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }
    await query(`DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`, [
      groupId,
      userId,
    ])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json(
    { error: 'expenseId, settlementId or userId query param required' },
    { status: 400 }
  )
}
