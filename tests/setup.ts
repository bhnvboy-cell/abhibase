import { vi, beforeAll, afterAll } from 'vitest'
import pg from 'pg'

const { Pool } = pg

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://postgres:40589999@localhost:5432/abhibase'
process.env.AUTH_SECRET = 'test-secret-for-testing'
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true })

// Global test pool
let pool: pg.Pool | null = null

export function getTestPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    })
  }
  return pool
}

export async function cleanupTestDatabase() {
  const p = getTestPool()
  try {
    // Clean test data (only tables that exist)
    await p.query('DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')')
    await p.query('DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')')
    await p.query('DELETE FROM generated_apps WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')')
    await p.query('DELETE FROM websites WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')')
    await p.query('DELETE FROM social_posts WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')')
    await p.query('DELETE FROM meetings WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')')
    await p.query('DELETE FROM invoices WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')')
  } catch (error) {
    // Ignore errors for missing tables
  }
}

export async function closeTestDatabase() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Mock fetch for API tests
global.fetch = vi.fn()

// Helper to create mock request
export function createMockRequest(method: string, body?: any, url?: string) {
  return new Request(url || 'http://localhost:3000/api/test', {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
}

// Helper to create mock cookies
export function createMockCookies(userId: string) {
  return {
    get: (name: string) => {
      if (name === 'auth-token') {
        return { value: `mock-token-${userId}` }
      }
      return undefined
    }
  }
}

// Helper to create mock JWT
export function createMockJWT(userId: string) {
  return `mock-jwt-${userId}-${Date.now()}`
}
