import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { exec } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const PORT_FILE = join(process.cwd(), 'generated-apps', '.ports.json')

function getUsedPorts(): Record<string, number> {
  if (!existsSync(PORT_FILE)) return {}
  try { return JSON.parse(readFileSync(PORT_FILE, 'utf-8')) } catch { return {} }
}

function savePorts(ports: Record<string, number>) {
  writeFileSync(PORT_FILE, JSON.stringify(ports, null, 2))
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: { slug?: string; port?: number }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const port = body.port
  if (!port) {
    return NextResponse.json({ error: 'Missing port' }, { status: 400 })
  }

  try {
    // Kill process on the port (Windows)
    const cmd = `cmd.exe /c "for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %a"`
    exec(cmd)

    // Remove from ports file
    if (body.slug) {
      const used = getUsedPorts()
      delete used[body.slug]
      savePorts(used)
    }

    return NextResponse.json({ success: true, message: `Stopped app on port ${port}` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
