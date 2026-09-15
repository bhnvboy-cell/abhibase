import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { existsSync } from 'fs'
import { join } from 'path'

const APPS_DIR = join(process.cwd(), 'generated-apps')

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: { folder?: string; slug?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const slug = body.slug || body.folder?.replace('generated-apps/', '')
  if (!slug) {
    return NextResponse.json({ error: 'Missing app slug or folder' }, { status: 400 })
  }

  const appDir = join(APPS_DIR, slug)
  if (!existsSync(appDir)) {
    return NextResponse.json({ error: `App folder not found: ${slug}` }, { status: 404 })
  }

  // The app is served from the main project — no separate server needed
  const url = `http://localhost:3000/generated/${slug}`

  return NextResponse.json({
    success: true,
    url,
    port: 3000,
    slug,
    message: `App "${slug}" is ready at ${url}`,
  })
}
