import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { one } from '@/lib/db'

export const SESSION_COOKIE = 'abhi_session'
const SESSION_DAYS = 30

export interface SessionUser {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
}

function secretKey() {
  const secret = process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me'
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey())
}

export async function setSessionCookie(userId: string) {
  const token = await createToken(userId)
  const store = cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export function clearSessionCookie() {
  const store = cookies()
  store.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, secretKey())
    if (!payload.sub) return null
    const user = await one<SessionUser>(
      `SELECT id, email, full_name, avatar_url FROM users WHERE id = $1`,
      [payload.sub]
    )
    return user
  } catch {
    return null
  }
}
