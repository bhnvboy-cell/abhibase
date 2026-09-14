import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { authGuard } from '@/lib/api-helpers'

const ALLOWED_FIELD_TYPES = ['text', 'number', 'boolean', 'date', 'json', 'uuid']

function sanitizeName(name: string): string {
  // Only allow alphanumeric and underscore
  return name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
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

export async function POST(request: Request) {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const body = await request.json()
    const { name, description, models, apiRoutes, uiComponents } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!Array.isArray(models) || models.length === 0) {
      return NextResponse.json({ error: 'At least one model is required' }, { status: 400 })
    }

    // Validate and sanitize each model
    const sanitizedModels = models.map((model: any) => {
      const modelName = sanitizeName(model.name || 'unnamed')
      const fields = Array.isArray(model.fields) ? model.fields.map((field: any) => ({
        name: sanitizeName(field.name || 'unnamed'),
        type: ALLOWED_FIELD_TYPES.includes(field.type) ? field.type : 'text',
        required: Boolean(field.required)
      })) : []
      
      return { name: modelName, fields }
    })

    // Generate SQL from sanitized models
    const sqlStatements = sanitizedModels.map((model: any) => {
      const fields = model.fields.map((field: any) => {
        const sqlType = mapFieldType(field.type)
        const constraints = field.required ? 'NOT NULL' : ''
        return `  ${field.name} ${sqlType} ${constraints}`
      }).join(',\n')

      return `
CREATE TABLE IF NOT EXISTS ${model.name}s (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
${fields},
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
    })

    // Execute SQL with error handling for each statement
    const results: { success: boolean; table: string; error?: string }[] = []
    
    for (const sql of sqlStatements) {
      try {
        await query(sql)
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown'
        results.push({ success: true, table: tableName })
      } catch (error: any) {
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown'
        results.push({ success: false, table: tableName, error: error.message })
        console.error(`Failed to create table ${tableName}:`, error)
      }
    }

    // Store app metadata
    const result = await query(`
      INSERT INTO generated_apps (user_id, name, description, models, api_routes, ui_components, installed)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      g.user.id,
      name,
      description || '',
      JSON.stringify(sanitizedModels),
      JSON.stringify(apiRoutes || []),
      JSON.stringify(uiComponents || []),
      results.every(r => r.success)
    ])

    return NextResponse.json({ 
      app: result[0], 
      results,
      sql: sqlStatements.join('\n')
    })
  } catch (error) {
    console.error('Failed to create app:', error)
    return NextResponse.json({ error: 'Failed to create app' }, { status: 500 })
  }
}

export async function GET() {
  const g = await authGuard()
  if (g.res) return g.res
  
  try {
    const apps = await query(`
      SELECT * FROM generated_apps 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [g.user.id])

    return NextResponse.json({ apps })
  } catch (error) {
    console.error('Failed to fetch apps:', error)
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 })
  }
}
