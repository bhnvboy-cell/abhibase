import { Pool } from 'pg'

declare global {
  var __pgPool: Pool | undefined
}

export const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__pgPool = pool
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await pool.query(text, (params ?? []) as never[])
  return rows as T[]
}

export async function one<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
