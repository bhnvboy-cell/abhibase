import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

export async function POST() {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    // Generate 2FA secret
    const secret = generateSecret()

    // Store secret temporarily (not enabled yet)
    await query(`
      UPDATE users 
      SET two_factor_secret = $1, two_factor_enabled = false
      WHERE id = $2
    `, [secret, g.user.id])

    // Generate QR code URL (for authenticator apps)
    const issuer = 'AbhiBase'
    const otpauthUrl = `otpauth://totp/${issuer}:${g.user.email}?secret=${secret}&issuer=${issuer}`
    
    // Return simple QR data (client will use a library to render)
    return NextResponse.json({ 
      secret,
      otpauthUrl,
      message: 'Scan this URL with your authenticator app'
    })
  } catch (error) {
    console.error('Failed to setup 2FA:', error)
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}
