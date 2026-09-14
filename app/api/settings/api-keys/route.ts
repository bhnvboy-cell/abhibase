import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query, one } from '@/lib/db'

interface ApiKeyRow {
  id: string
  provider: string
  api_key: string
  created_at: string
  updated_at: string
}

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res

  const keys = await query<ApiKeyRow>(
    `SELECT id, provider, api_key, created_at, updated_at
     FROM user_api_keys WHERE user_id = $1 ORDER BY provider`,
    [g.user.id]
  )

  // Mask the keys for display
  const masked = keys.map((k) => ({
    id: k.id,
    provider: k.provider,
    api_key_masked: k.api_key.substring(0, 8) + '...' + k.api_key.substring(k.api_key.length - 4),
    has_key: true,
    created_at: k.created_at,
    updated_at: k.updated_at,
  }))

  return NextResponse.json({ keys: masked })
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: { provider?: string; api_key?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { provider, api_key } = body

  if (!provider || !api_key) {
    return NextResponse.json({ error: 'Provider and API key are required' }, { status: 400 })
  }

  const validProviders = ['gemini', 'groq', 'mistral', 'openai', 'openrouter']
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  await one(
    `INSERT INTO user_api_keys (user_id, provider, api_key)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, provider)
     DO UPDATE SET api_key = $3, updated_at = now()`,
    [g.user.id, provider, api_key]
  )

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

  await query(`DELETE FROM user_api_keys WHERE id = $1 AND user_id = $2`, [id, g.user.id])
  return NextResponse.json({ ok: true })
}
