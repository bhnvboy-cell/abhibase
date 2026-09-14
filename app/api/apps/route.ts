import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, models } = body

    // Generate SQL from models
    const sqlStatements = models.map((model: any) => {
      const fields = model.fields.map((field: any) => {
        const sqlType = mapFieldType(field.type)
        const constraints = field.required ? 'NOT NULL' : ''
        return `  ${field.name} ${sqlType} ${constraints}`
      }).join(',\n')

      return `
CREATE TABLE IF NOT EXISTS ${model.name.toLowerCase()}s (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
${fields},
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
    }).join('\n')

    // Execute SQL
    for (const sql of sqlStatements.split('\n\n').filter((s: string) => s.trim())) {
      try {
        await query(sql)
      } catch (error) {
        console.error('Failed to execute SQL:', error)
      }
    }

    // Store app metadata
    const result = await query(`
      INSERT INTO generated_apps (user_id, name, description, models, api_routes, ui_components)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      getUser(),
      body.name,
      body.description,
      JSON.stringify(models),
      JSON.stringify(body.apiRoutes || []),
      JSON.stringify(body.uiComponents || [])
    ])

    return NextResponse.json({ app: result[0], sql: sqlStatements })
  } catch (error) {
    console.error('Failed to create app:', error)
    return NextResponse.json({ error: 'Failed to create app' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const apps = await query(`
      SELECT * FROM generated_apps 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [getUser()])

    return NextResponse.json({ apps })
  } catch (error) {
    console.error('Failed to fetch apps:', error)
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 })
  }
}

function mapFieldType(type: string): string {
  const typeMap: Record<string, string> = {
    text: 'TEXT',
    number: 'DECIMAL(12, 2)',
    boolean: 'BOOLEAN DEFAULT false',
    date: 'DATE',
    json: 'JSONB DEFAULT \'{}\'',
    uuid: 'UUID'
  }
  return typeMap[type] || 'TEXT'
}

function getUser() {
  return 'b58420a1-7578-49b8-ab59-8cb091b89917'
}
