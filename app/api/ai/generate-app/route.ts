import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

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

  // Try multiple models in order of preference
  const models = ['gemini-3.6-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']
  
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
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
        console.log(`Model ${model} failed: ${res.status}`)
        continue // Try next model
      }

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (text) return text
    } catch (e) {
      console.log(`Model ${model} error:`, e)
      continue
    }
  }

  throw new Error('All Gemini models are currently unavailable. Please try again later.')
}

function getLocalFallback(prompt: string): Record<string, unknown> {
  // Generate a basic app structure locally when Gemini is unavailable
  const lower = prompt.toLowerCase()
  let name = 'My App'
  let models: any[] = []
  let routes: any[] = []
  let components: any[] = []
  let pages: any[] = []

  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('delivery') || lower.includes('menu') || lower.includes('order')) {
    name = 'Food Delivery App'
    models = [
      { name: 'Restaurant', description: 'Restaurants that serve food', fields: [
        { name: 'name', type: 'text', required: true, description: 'Restaurant name' },
        { name: 'cuisine', type: 'text', required: false, description: 'Type of cuisine' },
        { name: 'rating', type: 'number', required: false, description: 'Average rating' },
        { name: 'delivery_time', type: 'text', required: false, description: 'Estimated delivery time' },
        { name: 'image_url', type: 'text', required: false, description: 'Restaurant photo' },
        { name: 'address', type: 'text', required: true, description: 'Restaurant address' },
      ]},
      { name: 'MenuItem', description: 'Food items on the menu', fields: [
        { name: 'name', type: 'text', required: true, description: 'Item name' },
        { name: 'description', type: 'text', required: false, description: 'Item description' },
        { name: 'price', type: 'number', required: true, description: 'Item price' },
        { name: 'category', type: 'text', required: false, description: 'Menu category' },
        { name: 'image_url', type: 'text', required: false, description: 'Item photo' },
        { name: 'restaurant_id', type: 'uuid', required: true, description: 'Link to restaurant' },
      ]},
      { name: 'Order', description: 'Customer orders', fields: [
        { name: 'status', type: 'text', required: true, description: 'Order status' },
        { name: 'total', type: 'number', required: true, description: 'Order total' },
        { name: 'delivery_address', type: 'text', required: true, description: 'Delivery address' },
        { name: 'user_id', type: 'uuid', required: true, description: 'Customer user' },
        { name: 'restaurant_id', type: 'uuid', required: true, description: 'Restaurant' },
      ]},
      { name: 'OrderItem', description: 'Individual items in an order', fields: [
        { name: 'order_id', type: 'uuid', required: true, description: 'Link to order' },
        { name: 'menu_item_id', type: 'uuid', required: true, description: 'Link to menu item' },
        { name: 'quantity', type: 'number', required: true, description: 'Quantity ordered' },
        { name: 'price', type: 'number', required: true, description: 'Price at time of order' },
      ]},
      { name: 'Delivery', description: 'Delivery tracking', fields: [
        { name: 'order_id', type: 'uuid', required: true, description: 'Link to order' },
        { name: 'driver_name', type: 'text', required: false, description: 'Driver name' },
        { name: 'status', type: 'text', required: true, description: 'Delivery status' },
        { name: 'estimated_arrival', type: 'text', required: false, description: 'ETA' },
      ]},
    ]
    routes = [
      { path: '/api/restaurants', method: 'GET', description: 'List all restaurants', model: 'Restaurant' },
      { path: '/api/restaurants', method: 'POST', description: 'Create restaurant', model: 'Restaurant' },
      { path: '/api/restaurants/:id', method: 'GET', description: 'Get restaurant details', model: 'Restaurant' },
      { path: '/api/menu-items', method: 'GET', description: 'List menu items', model: 'MenuItem' },
      { path: '/api/menu-items', method: 'POST', description: 'Create menu item', model: 'MenuItem' },
      { path: '/api/orders', method: 'GET', description: 'List orders', model: 'Order' },
      { path: '/api/orders', method: 'POST', description: 'Place order', model: 'Order' },
      { path: '/api/orders/:id', method: 'GET', description: 'Get order details', model: 'Order' },
      { path: '/api/orders/:id', method: 'PATCH', description: 'Update order status', model: 'Order' },
      { path: '/api/deliveries', method: 'GET', description: 'Track deliveries', model: 'Delivery' },
    ]
    components = [
      { name: 'RestaurantList', type: 'list', model: 'Restaurant', description: 'Browse all restaurants', fields: ['name', 'cuisine', 'rating', 'delivery_time'] },
      { name: 'RestaurantDetail', type: 'detail', model: 'Restaurant', description: 'Restaurant info and menu', fields: ['name', 'cuisine', 'rating', 'address'] },
      { name: 'MenuItemList', type: 'list', model: 'MenuItem', description: 'Browse menu items', fields: ['name', 'description', 'price', 'category'] },
      { name: 'OrderForm', type: 'form', model: 'Order', description: 'Place a new order', fields: ['delivery_address', 'restaurant_id'] },
      { name: 'OrderList', type: 'list', model: 'Order', description: 'View your orders', fields: ['status', 'total', 'delivery_address'] },
      { name: 'OrderDetail', type: 'detail', model: 'Order', description: 'Order tracking and details', fields: ['status', 'total', 'delivery_address'] },
      { name: 'DeliveryTracker', type: 'dashboard', model: 'Delivery', description: 'Real-time delivery tracking', fields: ['status', 'driver_name', 'estimated_arrival'] },
      { name: 'CartSummary', type: 'dashboard', model: 'OrderItem', description: 'Shopping cart summary', fields: ['quantity', 'price'] },
    ]
    pages = [
      { name: 'Home', path: '/', description: 'Browse restaurants and featured items', components: ['RestaurantList'] },
      { name: 'Restaurant', path: '/restaurant/:id', description: 'View restaurant menu', components: ['RestaurantDetail', 'MenuItemList'] },
      { name: 'Cart', path: '/cart', description: 'Review and place order', components: ['CartSummary', 'OrderForm'] },
      { name: 'Orders', path: '/orders', description: 'View order history', components: ['OrderList'] },
      { name: 'Order Tracking', path: '/orders/:id', description: 'Track your order', components: ['OrderDetail', 'DeliveryTracker'] },
    ]
  } else if (lower.includes('course') || lower.includes('learn') || lower.includes('lesson') || lower.includes('quiz') || lower.includes('education')) {
    name = 'Online Course Platform'
    models = [
      { name: 'Course', description: 'Online courses', fields: [
        { name: 'title', type: 'text', required: true, description: 'Course title' },
        { name: 'description', type: 'text', required: false, description: 'Course description' },
        { name: 'price', type: 'number', required: false, description: 'Course price' },
        { name: 'instructor', type: 'text', required: true, description: 'Instructor name' },
        { name: 'thumbnail', type: 'text', required: false, description: 'Course thumbnail' },
      ]},
      { name: 'Lesson', description: 'Course lessons', fields: [
        { name: 'title', type: 'text', required: true, description: 'Lesson title' },
        { name: 'content', type: 'text', required: false, description: 'Lesson content' },
        { name: 'video_url', type: 'text', required: false, description: 'Video URL' },
        { name: 'duration', type: 'number', required: false, description: 'Duration in minutes' },
        { name: 'course_id', type: 'uuid', required: true, description: 'Link to course' },
        { name: 'order', type: 'number', required: true, description: 'Lesson order' },
      ]},
      { name: 'Quiz', description: 'Course quizzes', fields: [
        { name: 'title', type: 'text', required: true, description: 'Quiz title' },
        { name: 'questions', type: 'json', required: true, description: 'Quiz questions' },
        { name: 'course_id', type: 'uuid', required: true, description: 'Link to course' },
      ]},
      { name: 'Enrollment', description: 'Student enrollments', fields: [
        { name: 'user_id', type: 'uuid', required: true, description: 'Student user' },
        { name: 'course_id', type: 'uuid', required: true, description: 'Enrolled course' },
        { name: 'progress', type: 'number', required: false, description: 'Completion percentage' },
        { name: 'enrolled_at', type: 'date', required: true, description: 'Enrollment date' },
      ]},
    ]
    routes = [
      { path: '/api/courses', method: 'GET', description: 'List all courses', model: 'Course' },
      { path: '/api/courses', method: 'POST', description: 'Create course', model: 'Course' },
      { path: '/api/lessons', method: 'GET', description: 'List lessons', model: 'Lesson' },
      { path: '/api/quizzes', method: 'GET', description: 'List quizzes', model: 'Quiz' },
      { path: '/api/enrollments', method: 'GET', description: 'List enrollments', model: 'Enrollment' },
      { path: '/api/enrollments', method: 'POST', description: 'Enroll in course', model: 'Enrollment' },
    ]
    components = [
      { name: 'CourseList', type: 'list', model: 'Course', description: 'Browse all courses', fields: ['title', 'description', 'price', 'instructor'] },
      { name: 'CourseDetail', type: 'detail', model: 'Course', description: 'Course overview', fields: ['title', 'description', 'price', 'instructor'] },
      { name: 'LessonList', type: 'list', model: 'Lesson', description: 'Course lessons', fields: ['title', 'duration', 'order'] },
      { name: 'QuizPlayer', type: 'form', model: 'Quiz', description: 'Take a quiz', fields: ['title', 'questions'] },
      { name: 'ProgressDashboard', type: 'dashboard', model: 'Enrollment', description: 'Student progress', fields: ['progress', 'enrolled_at'] },
    ]
    pages = [
      { name: 'Courses', path: '/courses', description: 'Browse all courses', components: ['CourseList'] },
      { name: 'Course', path: '/courses/:id', description: 'Course details and lessons', components: ['CourseDetail', 'LessonList'] },
      { name: 'Learn', path: '/learn/:id', description: 'Learn a lesson', components: ['LessonList'] },
      { name: 'Dashboard', path: '/dashboard', description: 'Student dashboard', components: ['ProgressDashboard'] },
    ]
  } else {
    // Generic app
    name = prompt.split(' ').slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace(/[^a-zA-Z ]/g, '') || 'My App'
    models = [
      { name: 'Item', description: 'Main data items', fields: [
        { name: 'title', type: 'text', required: true, description: 'Item title' },
        { name: 'description', type: 'text', required: false, description: 'Item description' },
        { name: 'status', type: 'text', required: false, description: 'Item status' },
        { name: 'priority', type: 'text', required: false, description: 'Priority level' },
        { name: 'user_id', type: 'uuid', required: true, description: 'Owner user' },
      ]},
      { name: 'Category', description: 'Item categories', fields: [
        { name: 'name', type: 'text', required: true, description: 'Category name' },
        { name: 'color', type: 'text', required: false, description: 'Category color' },
      ]},
      { name: 'Comment', description: 'Item comments', fields: [
        { name: 'body', type: 'text', required: true, description: 'Comment text' },
        { name: 'item_id', type: 'uuid', required: true, description: 'Link to item' },
        { name: 'user_id', type: 'uuid', required: true, description: 'Author user' },
      ]},
    ]
    routes = [
      { path: '/api/items', method: 'GET', description: 'List items', model: 'Item' },
      { path: '/api/items', method: 'POST', description: 'Create item', model: 'Item' },
      { path: '/api/items/:id', method: 'GET', description: 'Get item', model: 'Item' },
      { path: '/api/items/:id', method: 'PATCH', description: 'Update item', model: 'Item' },
      { path: '/api/items/:id', method: 'DELETE', description: 'Delete item', model: 'Item' },
      { path: '/api/categories', method: 'GET', description: 'List categories', model: 'Category' },
      { path: '/api/comments', method: 'POST', description: 'Add comment', model: 'Comment' },
    ]
    components = [
      { name: 'ItemList', type: 'list', model: 'Item', description: 'Browse items', fields: ['title', 'description', 'status'] },
      { name: 'ItemForm', type: 'form', model: 'Item', description: 'Create/edit item', fields: ['title', 'description', 'status', 'priority'] },
      { name: 'ItemDetail', type: 'detail', model: 'Item', description: 'Item details', fields: ['title', 'description', 'status'] },
      { name: 'CommentSection', type: 'list', model: 'Comment', description: 'Item comments', fields: ['body'] },
      { name: 'Dashboard', type: 'dashboard', model: 'Item', description: 'Overview dashboard', fields: ['title', 'status'] },
    ]
    pages = [
      { name: 'Home', path: '/', description: 'Main page', components: ['ItemList'] },
      { name: 'Detail', path: '/item/:id', description: 'Item details', components: ['ItemDetail', 'CommentSection'] },
      { name: 'Create', path: '/new', description: 'Create new item', components: ['ItemForm'] },
      { name: 'Dashboard', path: '/dashboard', description: 'Overview', components: ['Dashboard'] },
    ]
  }

  return { name, description: prompt, icon: '📦', models, apiRoutes: routes, uiComponents: components, pages }
}

/* ──────── FILE GENERATION ──────── */
function generateTypesFile(structure: any): string {
  let code = `// Auto-generated by AbhiBase AI App Generator\n// ${structure.name}\n\n`
  structure.models.forEach((m: any) => {
    code += `export interface ${m.name} {\n`
    code += `  id: string\n`
    m.fields.forEach((f: any) => {
      const tsType = f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : f.type === 'json' ? 'Record<string, unknown>' : f.type === 'array' ? 'string[]' : 'string'
      code += `  ${f.name}${f.required ? '' : '?'}: ${tsType}\n`
    })
    code += `  created_at: string\n`
    code += `  updated_at: string\n`
    code += `}\n\n`
  })
  return code
}

function generateSchemaFile(structure: any): string {
  let sql = `-- Auto-generated by AbhiBase AI App Generator\n-- ${structure.name}\n\n`
  sql += `-- Enable UUID extension\nCREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`
  structure.models.forEach((m: any) => {
    sql += `-- ${m.description || m.name}\n`
    sql += `CREATE TABLE ${m.name.toLowerCase()}s (\n`
    sql += `  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n`
    m.fields.forEach((f: any) => {
      const pgType = f.type === 'uuid' ? 'UUID' : f.type === 'number' ? 'DECIMAL(12,2)' : f.type === 'boolean' ? 'BOOLEAN DEFAULT false' : f.type === 'date' ? 'DATE' : f.type === 'json' ? 'JSONB DEFAULT \'{}\'' : f.type === 'array' ? 'TEXT[]' : 'TEXT'
      const nullable = f.required ? ' NOT NULL' : ''
      const ref = f.type === 'uuid' && f.name.endsWith('_id') ? ` REFERENCES ${f.name.replace('_id', '')}s(id)` : ''
      sql += `  ${f.name} ${pgType}${nullable}${ref},\n`
    })
    sql += `  created_at TIMESTAMPTZ DEFAULT NOW(),\n`
    sql += `  updated_at TIMESTAMPTZ DEFAULT NOW()\n`
    sql += `);\n\n`
  })
  return sql
}

function generateComponentFile(comp: any, models: any[]): string {
  const model = models.find((m: any) => m.name === comp.model)
  let code = `'use client'\n\nimport { useState, useEffect } from 'react'\n\n`
  code += `interface ${comp.model} {\n`
  code += `  id: string\n`
  if (model) {
    model.fields.forEach((f: any) => {
      const tsType = f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'
      code += `  ${f.name}${f.required ? '' : '?'}: ${tsType}\n`
    })
  }
  code += `}\n\n`
  code += `export function ${comp.name}() {\n`
  code += `  const [data, setData] = useState<${comp.model}[]>([])\n`
  code += `  const [loading, setLoading] = useState(true)\n\n`
  code += `  useEffect(() => {\n`
  code += `    fetch('/api/${comp.model.toLowerCase()}s')\n`
  code += `      .then(r => r.json())\n`
  code += `      .then(setData)\n`
  code += `      .finally(() => setLoading(false))\n`
  code += `  }, [])\n\n`

  if (comp.type === 'list') {
    code += `  if (loading) return <div className="animate-pulse text-zinc-500">Loading...</div>\n\n`
    code += `  return (\n`
    code += `    <div className="space-y-3">\n`
    code += `      <h2 className="text-xl font-bold">${comp.name}</h2>\n`
    code += `      {data.length === 0 ? (\n`
    code += `        <p className="text-zinc-500">No items yet.</p>\n`
    code += `      ) : (\n`
    code += `        data.map(item => (\n`
    code += `          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">\n`
    code += `            <h3 className="font-medium">{item.${comp.fields[0] || 'id'}}}</h3>\n`
    comp.fields.slice(1, 3).forEach((f: string) => {
      code += `            <p className="text-sm text-zinc-400 mt-1">{item.${f}}</p>\n`
    })
    code += `          </div>\n`
    code += `        ))\n`
    code += `      )}\n`
    code += `    </div>\n`
    code += `  )\n`
  } else if (comp.type === 'form') {
    code += `  const [form, setForm] = useState<Record<string, string>>({})\n\n`
    code += `  const handleSubmit = async (e: React.FormEvent) => {\n`
    code += `    e.preventDefault()\n`
    code += `    await fetch('/api/${comp.model.toLowerCase()}s', {\n`
    code += `      method: 'POST',\n`
    code += `      headers: { 'Content-Type': 'application/json' },\n`
    code += `      body: JSON.stringify(form),\n`
    code += `    })\n`
    code += `    window.location.reload()\n`
    code += `  }\n\n`
    code += `  return (\n`
    code += `    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">\n`
    code += `      <h2 className="text-xl font-bold">Create ${comp.model}</h2>\n`
    comp.fields.forEach((f: string) => {
      code += `      <div>\n`
      code += `        <label className="block text-sm text-zinc-400 mb-1">${f}</label>\n`
      code += `        <input\n`
      code += `          value={form.${f} || ''}\n`
      code += `          onChange={e => setForm({ ...form, ${f}: e.target.value })}\n`
      code += `          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"\n`
      code += `        />\n`
      code += `      </div>\n`
    })
    code += `      <button type="submit" className="bg-violet-600 hover:bg-violet-700 px-6 py-2 rounded-lg font-medium">Save</button>\n`
    code += `    </form>\n`
    code += `  )\n`
  } else if (comp.type === 'dashboard') {
    code += `  return (\n`
    code += `    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">\n`
    code += `      <h2 className="text-xl font-bold mb-4">${comp.name}</h2>\n`
    code += `      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">\n`
    code += `        {data.slice(0, 4).map(item => (\n`
    code += `          <div key={item.id} className="bg-zinc-800 rounded-lg p-4">\n`
    code += `            <p className="text-2xl font-bold text-violet-400">{item.${comp.fields[0] || 'id'}}}</p>\n`
    code += `            <p className="text-xs text-zinc-500 mt-1">${comp.fields[0] || 'value'}</p>\n`
    code += `          </div>\n`
    code += `        ))}\n`
    code += `      </div>\n`
    code += `    </div>\n`
    code += `  )\n`
  } else {
    code += `  return (\n`
    code += `    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">\n`
    code += `      <h2 className="text-xl font-bold">${comp.name}</h2>\n`
    code += `      <p className="text-zinc-400 mt-2">${comp.description}</p>\n`
    code += `    </div>\n`
    code += `  )\n`
  }
  code += `}\n`
  return code
}

function generatePageFile(page: any): string {
  let code = `// ${page.name} Page\n// ${page.description}\n\n`
  page.components.forEach((c: string) => {
    code += `import { ${c} } from '@/components/${c}'\n`
  })
  code += `\nexport default function ${page.name.replace(/[^a-zA-Z0-9]/g, '')}Page() {\n`
  code += `  return (\n`
  code += `    <div className="min-h-screen bg-zinc-950 p-6">\n`
  code += `      <div className="max-w-6xl mx-auto space-y-6">\n`
  page.components.forEach((c: string) => {
    code += `        <${c} />\n`
  })
  code += `      </div>\n`
  code += `    </div>\n`
  code += `  )\n`
  code += `}\n`
  return code
}

function generateReadmeFile(structure: any): string {
  let md = `# ${structure.name}\n\n`
  md += `${structure.description}\n\n`
  md += `Generated by AbhiBase AI App Generator\n\n`
  md += `## Structure\n\n`
  md += `### Models (${structure.models.length})\n`
  structure.models.forEach((m: any) => {
    md += `- **${m.name}**: ${m.description} (${m.fields.length} fields)\n`
  })
  md += `\n### API Routes (${structure.apiRoutes.length})\n`
  structure.apiRoutes.forEach((r: any) => {
    md += `- \`${r.method} ${r.path}\` - ${r.description}\n`
  })
  md += `\n### Components (${structure.uiComponents.length})\n`
  structure.uiComponents.forEach((c: any) => {
    md += `- **${c.name}** (${c.type}) - ${c.description}\n`
  })
  md += `\n### Pages (${structure.pages.length})\n`
  structure.pages.forEach((p: any) => {
    md += `- **${p.name}** (\`${p.path}\`) - ${p.description}\n`
  })
  md += `\n## Setup\n\n`
  md += "1. Run the SQL schema in your database\n"
  md += "2. Copy components to your project\n"
  md += "3. Import and use the pages\n"
  return md
}

async function saveAppFiles(structure: any): Promise<{ folder: string; files: string[] }> {
  const slug = structure.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const baseDir = join(process.cwd(), 'generated-apps', slug)
  const files: string[] = []

  // Create directories
  await mkdir(join(baseDir, 'components'), { recursive: true })
  await mkdir(join(baseDir, 'pages'), { recursive: true })
  await mkdir(join(baseDir, 'types'), { recursive: true })
  await mkdir(join(baseDir, 'database'), { recursive: true })

  // Write types
  const typesPath = join(baseDir, 'types', 'index.ts')
  await writeFile(typesPath, generateTypesFile(structure))
  files.push('types/index.ts')

  // Write schema
  const schemaPath = join(baseDir, 'database', 'schema.sql')
  await writeFile(schemaPath, generateSchemaFile(structure))
  files.push('database/schema.sql')

  // Write components
  for (const comp of structure.uiComponents) {
    const compPath = join(baseDir, 'components', `${comp.name}.tsx`)
    await writeFile(compPath, generateComponentFile(comp, structure.models))
    files.push(`components/${comp.name}.tsx`)
  }

  // Write pages
  for (const page of structure.pages) {
    const pagePath = join(baseDir, 'pages', `${page.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.tsx`)
    await writeFile(pagePath, generatePageFile(page))
    files.push(`pages/${page.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.tsx`)
  }

  // Write README
  const readmePath = join(baseDir, 'README.md')
  await writeFile(readmePath, generateReadmeFile(structure))
  files.push('README.md')

  return { folder: `generated-apps/${slug}`, files }
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
    let appStructure: Record<string, unknown>

    try {
      const rawResponse = await callGemini(prompt)
      appStructure = extractJSON(rawResponse)
    } catch (aiError) {
      // Gemini unavailable, use local fallback
      console.log('Gemini unavailable, using local fallback for app generation')
      appStructure = getLocalFallback(prompt)
    }

    // Validate structure
    if (!appStructure.name || !appStructure.models || !appStructure.apiRoutes) {
      throw new Error('Failed to generate app structure')
    }

    // Save files to generated-apps folder
    const { folder, files } = await saveAppFiles(appStructure)

    return NextResponse.json({
      success: true,
      structure: appStructure,
      rawPrompt: prompt,
      folder,
      files,
    })
  } catch (error: any) {
    console.error('AI App Generation error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate app structure' },
      { status: 500 }
    )
  }
}
