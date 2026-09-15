import { NextResponse } from 'next/server'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const APPS_DIR = join(process.cwd(), 'generated-apps')

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  const appDir = join(APPS_DIR, slug)

  if (!existsSync(appDir)) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 })
  }

  // List files in the generated app
  const files: string[] = []
  function walk(dir: string, prefix = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), rel)
      } else {
        files.push(rel)
      }
    }
  }
  walk(appDir)

  // Read the main page file to get the component source
  const pagePath = join(appDir, 'app', 'page.tsx')
  const pageSource = existsSync(pagePath) ? readFileSync(pagePath, 'utf-8') : null

  // Read all component files
  const components: Record<string, string> = {}
  const compDir = join(appDir, 'components')
  if (existsSync(compDir)) {
    for (const f of readdirSync(compDir)) {
      if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        components[f] = readFileSync(join(compDir, f), 'utf-8')
      }
    }
  }

  // Read API route files
  const apiRoutes: Record<string, string> = {}
  const apiDir = join(appDir, 'app', 'api')
  if (existsSync(apiDir)) {
    function walkApi(dir: string, prefix = '') {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
          walkApi(join(dir, entry.name), rel)
        } else if (entry.name === 'route.ts') {
          apiRoutes[prefix] = readFileSync(join(dir, entry.name), 'utf-8')
        }
      }
    }
    walkApi(apiDir)
  }

  return NextResponse.json({
    slug,
    files,
    pageSource,
    components,
    apiRoutes,
  })
}
