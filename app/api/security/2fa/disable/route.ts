import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export async function POST() {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    await query(`
      UPDATE users 
      SET two_factor_enabled = false, two_factor_secret = NULL
      WHERE id = $1
    `, [g.user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disable 2FA:', error)
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }
}
