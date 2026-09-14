import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const logs = await query(`
      SELECT * FROM audit_logs 
      WHERE user_id = $1 
      ORDER BY created_at DESC
      LIMIT 100
    `, [g.user.id])

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const body = await request.json()
    const { action, resource_type, resource_id, details, ip_address, user_agent } = body

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [g.user.id, action, resource_type, resource_id, details || {}, ip_address, user_agent])

    return NextResponse.json({ log: result[0] })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
