import { NextResponse } from 'next/server'
import { one } from '@/lib/db'
import {
  clearSessionCookie,
  getSessionUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth-server'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

interface Ctx {
  params: { action: string[] }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function safeUser(u: { id: string; email: string; full_name: string; avatar_url: string | null }) {
  return { id: u.id, email: u.email, full_name: u.full_name, avatar_url: u.avatar_url }
}

export async function GET(_req: Request, ctx: Ctx) {
  const action = ctx.params.action[0]
  if (action !== 'me') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const user = await getSessionUser()
  return NextResponse.json({ user })
}

export async function POST(req: Request, ctx: Ctx) {
  const action = ctx.params.action[0]

  if (action === 'signout') {
    clearSessionCookie()
    return NextResponse.json({ ok: true })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  // Rate limit auth attempts by IP
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const rateLimit = checkRateLimit(ip, 'auth')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    )
  }

  if (action === 'signup') {
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }
    const existing = await one(`SELECT id FROM users WHERE lower(email) = $1`, [email])
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }
    const passwordHash = await hashPassword(password)
    const user = await one<{
      id: string
      email: string
      full_name: string
      avatar_url: string | null
    }>(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, avatar_url`,
      [email, passwordHash, fullName]
    )
    if (!user) {
      return NextResponse.json({ error: 'Could not create account' }, { status: 500 })
    }
    await setSessionCookie(user.id)
    return NextResponse.json({ user: safeUser(user) })
  }

  if (action === 'signin') {
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    const row = await one<{ id: string; password_hash: string }>(
      `SELECT id, password_hash FROM users WHERE lower(email) = $1`,
      [email]
    )
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    await setSessionCookie(row.id)
    const user = await one<{
      id: string
      email: string
      full_name: string
      avatar_url: string | null
    }>(`SELECT id, email, full_name, avatar_url FROM users WHERE id = $1`, [row.id])
    return NextResponse.json({ user: user ? safeUser(user) : null })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
