import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.txt': 'text/plain', '.md': 'text/markdown',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
}

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename
  if (!filename || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  const filepath = join(process.cwd(), 'public', 'uploads', filename)
  try {
    const buffer = await readFile(filepath)
    const ext = '.' + filename.split('.').pop()?.toLowerCase()
    const contentType = MIME_MAP[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
