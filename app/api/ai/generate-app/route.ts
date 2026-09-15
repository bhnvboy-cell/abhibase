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
