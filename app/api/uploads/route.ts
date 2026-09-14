import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { authGuard } from '@/lib/api-helpers'
import { one } from '@/lib/db'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/markdown',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
])

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
    'image/webp': '.webp', 'image/svg+xml': '.svg', 'application/pdf': '.pdf',
    'text/plain': '.txt', 'text/markdown': '.md',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/zip': '.zip',
  }
  return map[mime] || ''
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const ext = extFromMime(file.type)
  const filename = `${randomUUID()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  const filepath = join(uploadDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  const attachment = await one<{
    id: string
    filename: string
    original_name: string
    mime_type: string
    size: number
    created_at: string
  }>(
    `INSERT INTO attachments (user_id, filename, original_name, mime_type, size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, filename, original_name, mime_type, size, created_at`,
    [g.user.id, filename, file.name, file.type, file.size]
  )

  return NextResponse.json({ attachment })
}

export async function GET(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const { query } = await import('@/lib/db')
  const attachments = await query<{
    id: string
    filename: string
    original_name: string
    mime_type: string
    size: number
    created_at: string
  }>(
    `SELECT id, filename, original_name, mime_type, size, created_at
     FROM attachments WHERE user_id = $1 ORDER BY created_at DESC`,
    [g.user.id]
  )

  return NextResponse.json({ attachments })
}

export async function DELETE(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { unlink } = await import('node:fs/promises')
  const { join } = await import('node:path')

  const row = await one<{ filename: string }>(
    `DELETE FROM attachments WHERE id = $1 AND user_id = $2 RETURNING filename`,
    [id, g.user.id]
  )

  if (row) {
    const filepath = join(process.cwd(), 'public', 'uploads', row.filename)
    await unlink(filepath).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
