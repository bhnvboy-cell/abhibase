import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''

const SYSTEM_PROMPT = `You are an expert app architect. When a user describes an app, you generate a complete app structure as JSON.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation, no code blocks.

The JSON must have this exact structure:
{
  "name": "AppName",
  "description": "Brief description of what the app does",
  "icon": "📦",
  "models": [
    {
      "name": "ModelName",
      "description": "What this model represents",
      "fields": [
        {
          "name": "field_name",
          "type": "text|number|boolean|date|json|uuid|array",
          "required": true|false,
          "description": "What this field stores"
        }
      ]
    }
  ],
  "apiRoutes": [
    {
      "path": "/api/resource",
      "method": "GET|POST|PATCH|DELETE",
      "description": "What this endpoint does",
      "model": "ModelName"
    }
  ],
  "uiComponents": [
    {
      "name": "ComponentName",
      "type": "list|form|detail|dashboard|settings",
      "model": "ModelName",
      "description": "What this component shows",
      "fields": ["field1", "field2"]
    }
  ],
  "pages": [
    {
      "name": "PageName",
      "path": "/page-path",
      "description": "What this page is for",
      "components": ["ComponentName1", "ComponentName2"]
    }
  ]
}

RULES:
- Use UUID for all primary keys
- Add created_at (TIMESTAMPTZ) and updated_at (TIMESTAMPTZ) to every model
- Add user_id (UUID) to models that belong to a user
- Create proper API routes: GET (list), POST (create), PATCH (update), DELETE (delete)
- Create at least: list view, form, and detail view for each main model
- Make models relate to each other with foreign keys
- Include realistic field names and types
- Generate 3-8 models depending on complexity
- Generate 10-30 API routes
- Generate 6-15 UI components
- Generate 4-10 pages

EXAMPLE - If user says "Build a blog":
- Models: Post, Category, Comment, Author
- API Routes: /api/posts (GET, POST), /api/posts/:id (GET, PATCH, DELETE), /api/categories, /api/comments
- UI: PostList, PostForm, PostDetail, CommentSection, CategorySidebar
- Pages: Home, Post Detail, Admin Dashboard, Write Post`

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('Gemini API key not configured')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          { role: 'model', parts: [{ text: 'Understood. I will return only valid JSON for app generation.' }] },
          { role: 'user', parts: [{ text: prompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} - ${err}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return text
}

function extractJSON(text: string): Record<string, unknown> {
  // Try to extract JSON from the response (might be wrapped in markdown)
  let cleaned = text.trim()

  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()

  // Try parsing
  try {
    return JSON.parse(cleaned)
  } catch {
    // Try to find JSON in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('Could not parse AI response as JSON')
  }
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  let body: { prompt?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    return NextResponse.json({ error: 'Please describe the app you want to build' }, { status: 400 })
  }

  try {
    const rawResponse = await callGemini(prompt)
    const appStructure = extractJSON(rawResponse)

    // Validate structure
    if (!appStructure.name || !appStructure.models || !appStructure.apiRoutes) {
      throw new Error('AI response missing required fields')
    }

    return NextResponse.json({
      success: true,
      structure: appStructure,
      rawPrompt: prompt,
    })
  } catch (error: any) {
    console.error('AI App Generation error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate app structure' },
      { status: 500 }
    )
  }
}
