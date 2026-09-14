import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const sessions = await query(`
      SELECT * FROM user_sessions 
      WHERE user_id = $1 
      ORDER BY last_active DESC
    `, [g.user.id])

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await query('DELETE FROM user_sessions WHERE id = $1 AND user_id = $2', [id, g.user.id])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to revoke session:', error)
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 })
  }
}
