import { NextResponse } from 'next/server'
import { one, query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export const runtime = 'nodejs'

interface SsoRow {
  id: string
  organization_id: string
  provider: string
  config: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const orgId = url.searchParams.get('org_id')

  if (!orgId) {
    const memberships = await query<{ organization_id: string }>(
      `SELECT organization_id FROM organization_members WHERE user_id = $1`,
      [g.user.id]
    )
    const orgIds = memberships.map((m) => m.organization_id)
    if (!orgIds.length) return NextResponse.json({ configurations: [] })

    const configs = await query<SsoRow>(
      `SELECT id, organization_id, provider, config, is_active, created_at, updated_at
       FROM sso_configurations WHERE organization_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
      [orgIds]
    )
    return NextResponse.json({ configurations: configs })
  }

  const membership = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, g.user.id]
  )
  if (!membership) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const configs = await query<SsoRow>(
    `SELECT id, organization_id, provider, config, is_active, created_at, updated_at
     FROM sso_configurations WHERE organization_id = $1 ORDER BY created_at ASC`,
    [orgId]
  )

  return NextResponse.json({ configurations: configs })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const orgId = typeof body.organization_id === 'string' ? body.organization_id : null
  if (!orgId) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
  }

  const membership = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, g.user.id]
  )
  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized to configure SSO' }, { status: 403 })
  }

  const validProviders = ['saml', 'oidc', 'google', 'microsoft']
  const provider = typeof body.provider === 'string' ? body.provider : ''
  if (!validProviders.includes(provider)) {
    return NextResponse.json(
      { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
      { status: 400 }
    )
  }

  const config = typeof body.config === 'object' && body.config !== null ? body.config : {}
  if (Object.keys(config).length === 0) {
    return NextResponse.json({ error: 'config is required' }, { status: 400 })
  }

  const existing = await one<{ id: string }>(
    `SELECT id FROM sso_configurations WHERE organization_id = $1 AND provider = $2`,
    [orgId, provider]
  )

  if (existing) {
    await one(
      `UPDATE sso_configurations SET config = $1, is_active = true, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(config), existing.id]
    )
    return NextResponse.json({ ok: true, id: existing.id })
  }

  const row = await one<{ id: string }>(
    `INSERT INTO sso_configurations (organization_id, provider, config) VALUES ($1, $2, $3) RETURNING id`,
    [orgId, provider, JSON.stringify(config)]
  )

  return NextResponse.json({ ok: true, id: row?.id })
}

export async function PATCH(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const id = typeof body.id === 'string' ? body.id : null
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const sso = await one<SsoRow>(
    `SELECT id, organization_id, provider FROM sso_configurations WHERE id = $1`,
    [id]
  )
  if (!sso) {
    return NextResponse.json({ error: 'SSO configuration not found' }, { status: 404 })
  }

  const membership = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [sso.organization_id, g.user.id]
  )
  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (typeof body.config === 'object' && body.config !== null) {
    fields.push(`config = $${i}`)
    values.push(JSON.stringify(body.config))
    i++
  }

  if (typeof body.is_active === 'boolean') {
    fields.push(`is_active = $${i}`)
    values.push(body.is_active)
    i++
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  fields.push('updated_at = now()')
  values.push(id)

  await query(`UPDATE sso_configurations SET ${fields.join(', ')} WHERE id = $${i}`, values)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const sso = await one<SsoRow>(
    `SELECT id, organization_id FROM sso_configurations WHERE id = $1`,
    [id]
  )
  if (!sso) {
    return NextResponse.json({ error: 'SSO configuration not found' }, { status: 404 })
  }

  const membership = await one<{ role: string }>(
    `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [sso.organization_id, g.user.id]
  )
  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  await query(`DELETE FROM sso_configurations WHERE id = $1`, [id])
  return NextResponse.json({ ok: true })
}
