import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const APPS_DIR = join(process.cwd(), 'generated-apps')

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  const htmlPath = join(APPS_DIR, slug, 'index.html')

  if (!existsSync(htmlPath)) {
    return new NextResponse('<h1>App not found</h1>', {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const html = readFileSync(htmlPath, 'utf-8')

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
