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
          "type": "text|number|boolean|date",
          "required": true|false,
          "description": "What this field stores"
        }
      ]
    }
  ]
}

RULES:
- Each model should have 4-8 fields
- Use descriptive field names
- Include at least 2 models per app
- Make the app practical and realistic`

async function callGemini(prompt: string): Promise<string> {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']
  const key = GEMINI_KEY
  if (!key) throw new Error('No Gemini API key')

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\nUser wants: ' + prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      }
      console.log(`Model ${model} failed: ${res.status}`)
    } catch (e) {
      console.log(`Model ${model} error`)
    }
  }
  throw new Error('All Gemini models failed')
}

function getLocalFallback(prompt: string) {
  const lower = prompt.toLowerCase()
  let name = 'My App'
  let icon = '📦'
  let models: any[] = []

  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('delivery') || lower.includes('menu')) {
    name = 'Food Delivery App'
    icon = '🍔'
    models = [
      { name: 'Restaurant', description: 'Restaurants', fields: [
        { name: 'name', type: 'text', required: true, description: 'Restaurant name' },
        { name: 'cuisine', type: 'text', required: false, description: 'Cuisine type' },
        { name: 'rating', type: 'number', required: false, description: 'Rating 1-5' },
        { name: 'delivery_time', type: 'text', required: false, description: 'Delivery time' },
        { name: 'address', type: 'text', required: true, description: 'Address' },
      ]},
      { name: 'MenuItem', description: 'Menu items', fields: [
        { name: 'name', type: 'text', required: true, description: 'Item name' },
        { name: 'description', type: 'text', required: false, description: 'Description' },
        { name: 'price', type: 'number', required: true, description: 'Price' },
        { name: 'category', type: 'text', required: false, description: 'Category' },
        { name: 'restaurant_id', type: 'text', required: true, description: 'Restaurant' },
      ]},
      { name: 'Order', description: 'Customer orders', fields: [
        { name: 'customer_name', type: 'text', required: true, description: 'Customer' },
        { name: 'total', type: 'number', required: true, description: 'Total amount' },
        { name: 'status', type: 'text', required: true, description: 'Order status' },
        { name: 'address', type: 'text', required: true, description: 'Delivery address' },
      ]},
    ]
  } else if (lower.includes('course') || lower.includes('learn') || lower.includes('education') || lower.includes('quiz')) {
    name = 'Online Course Platform'
    icon = '📚'
    models = [
      { name: 'Course', description: 'Online courses', fields: [
        { name: 'title', type: 'text', required: true, description: 'Course title' },
        { name: 'description', type: 'text', required: false, description: 'Course description' },
        { name: 'price', type: 'number', required: false, description: 'Price' },
        { name: 'instructor', type: 'text', required: true, description: 'Instructor' },
        { name: 'category', type: 'text', required: false, description: 'Category' },
      ]},
      { name: 'Lesson', description: 'Course lessons', fields: [
        { name: 'title', type: 'text', required: true, description: 'Lesson title' },
        { name: 'content', type: 'text', required: false, description: 'Content' },
        { name: 'duration', type: 'number', required: false, description: 'Duration (min)' },
        { name: 'course_id', type: 'text', required: true, description: 'Course' },
      ]},
      { name: 'Student', description: 'Students', fields: [
        { name: 'name', type: 'text', required: true, description: 'Student name' },
        { name: 'email', type: 'text', required: true, description: 'Email' },
        { name: 'progress', type: 'number', required: false, description: 'Progress %' },
        { name: 'course_id', type: 'text', required: true, description: 'Enrolled course' },
      ]},
    ]
  } else if (lower.includes('fitness') || lower.includes('gym') || lower.includes('workout') || lower.includes('health')) {
    name = 'Fitness Tracker'
    icon = '🏋️'
    models = [
      { name: 'Workout', description: 'Workout sessions', fields: [
        { name: 'title', type: 'text', required: true, description: 'Workout name' },
        { name: 'type', type: 'text', required: true, description: 'Type (cardio, strength)' },
        { name: 'duration', type: 'number', required: true, description: 'Duration (min)' },
        { name: 'calories', type: 'number', required: false, description: 'Calories burned' },
      ]},
      { name: 'Goal', description: 'Fitness goals', fields: [
        { name: 'title', type: 'text', required: true, description: 'Goal title' },
        { name: 'target', type: 'number', required: true, description: 'Target value' },
        { name: 'current', type: 'number', required: false, description: 'Current progress' },
        { name: 'unit', type: 'text', required: true, description: 'Unit (kg, min)' },
      ]},
    ]
  } else if (lower.includes('property') || lower.includes('real estate') || lower.includes('house') || lower.includes('rent')) {
    name = 'Real Estate Platform'
    icon = '🏠'
    models = [
      { name: 'Property', description: 'Property listings', fields: [
        { name: 'title', type: 'text', required: true, description: 'Property title' },
        { name: 'type', type: 'text', required: true, description: 'Type (sale, rent)' },
        { name: 'price', type: 'number', required: true, description: 'Price' },
        { name: 'bedrooms', type: 'number', required: false, description: 'Bedrooms' },
        { name: 'area', type: 'number', required: false, description: 'Area (sqft)' },
        { name: 'address', type: 'text', required: true, description: 'Address' },
      ]},
      { name: 'Inquiry', description: 'Property inquiries', fields: [
        { name: 'name', type: 'text', required: true, description: 'Contact name' },
        { name: 'email', type: 'text', required: true, description: 'Email' },
        { name: 'message', type: 'text', required: false, description: 'Message' },
        { name: 'property_id', type: 'text', required: true, description: 'Property' },
      ]},
    ]
  } else if (lower.includes('music') || lower.includes('song') || lower.includes('playlist')) {
    name = 'Music Platform'
    icon = '🎵'
    models = [
      { name: 'Track', description: 'Music tracks', fields: [
        { name: 'title', type: 'text', required: true, description: 'Track title' },
        { name: 'artist', type: 'text', required: true, description: 'Artist' },
        { name: 'album', type: 'text', required: false, description: 'Album' },
        { name: 'duration', type: 'number', required: false, description: 'Duration (sec)' },
        { name: 'genre', type: 'text', required: false, description: 'Genre' },
      ]},
      { name: 'Playlist', description: 'Playlists', fields: [
        { name: 'name', type: 'text', required: true, description: 'Playlist name' },
        { name: 'description', type: 'text', required: false, description: 'Description' },
        { name: 'track_count', type: 'number', required: false, description: 'Track count' },
      ]},
    ]
  } else if (lower.includes('travel') || lower.includes('trip') || lower.includes('hotel') || lower.includes('booking')) {
    name = 'Travel Booking App'
    icon = '✈️'
    models = [
      { name: 'Destination', description: 'Travel destinations', fields: [
        { name: 'name', type: 'text', required: true, description: 'Destination name' },
        { name: 'country', type: 'text', required: true, description: 'Country' },
        { name: 'description', type: 'text', required: false, description: 'Description' },
        { name: 'price_from', type: 'number', required: false, description: 'Starting price' },
      ]},
      { name: 'Booking', description: 'Trip bookings', fields: [
        { name: 'destination', type: 'text', required: true, description: 'Destination' },
        { name: 'start_date', type: 'text', required: true, description: 'Start date' },
        { name: 'end_date', type: 'text', required: true, description: 'End date' },
        { name: 'guests', type: 'number', required: true, description: 'Guests' },
        { name: 'total', type: 'number', required: true, description: 'Total cost' },
      ]},
    ]
  } else if (lower.includes('task') || lower.includes('todo') || lower.includes('project') || lower.includes('manage')) {
    name = 'Task Manager'
    icon = '✅'
    models = [
      { name: 'Task', description: 'Tasks', fields: [
        { name: 'title', type: 'text', required: true, description: 'Task title' },
        { name: 'description', type: 'text', required: false, description: 'Description' },
        { name: 'status', type: 'text', required: true, description: 'Status' },
        { name: 'priority', type: 'text', required: false, description: 'Priority' },
        { name: 'due_date', type: 'text', required: false, description: 'Due date' },
      ]},
      { name: 'Project', description: 'Projects', fields: [
        { name: 'name', type: 'text', required: true, description: 'Project name' },
        { name: 'description', type: 'text', required: false, description: 'Description' },
        { name: 'status', type: 'text', required: true, description: 'Status' },
        { name: 'deadline', type: 'text', required: false, description: 'Deadline' },
      ]},
    ]
  } else {
    name = prompt.split(' ').slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'My App'
    icon = '📦'
    models = [
      { name: 'Item', description: 'Main items', fields: [
        { name: 'title', type: 'text', required: true, description: 'Title' },
        { name: 'description', type: 'text', required: false, description: 'Description' },
        { name: 'status', type: 'text', required: false, description: 'Status' },
        { name: 'priority', type: 'text', required: false, description: 'Priority' },
      ]},
      { name: 'Category', description: 'Categories', fields: [
        { name: 'name', type: 'text', required: true, description: 'Name' },
        { name: 'color', type: 'text', required: false, description: 'Color' },
      ]},
    ]
  }

  return { name, description: prompt, icon, models }
}

/* ──────── STANDALONE HTML GENERATION ──────── */
function generateHTML(structure: any): string {
  const { name, description, icon, models } = structure

  // Generate seed data for each model
  function generateSeedData(model: any): any[] {
    const seeds: any[] = []
    const count = 5
    for (let i = 0; i < count; i++) {
      const item: any = { id: crypto.randomUUID() }
      for (const f of model.fields) {
        if (f.type === 'number') {
          item[f.name] = f.name.includes('price') || f.name.includes('cost') || f.name.includes('amount')
            ? Math.round((Math.random() * 100 + 10) * 100) / 100
            : Math.floor(Math.random() * 100) + 1
        } else if (f.type === 'boolean') {
          item[f.name] = Math.random() > 0.5
        } else {
          item[f.name] = generateSampleValue(f.name, i)
        }
      }
      item.created_at = new Date().toISOString()
      seeds.push(item)
    }
    return seeds
  }

  function generateSampleValue(field: string, index: number): string {
    const lf = field.toLowerCase()
    const sampleData: Record<string, string[]> = {
      name: ['Springfield Cafe', 'Ocean Breeze', 'Mountain View', 'City Center', 'Sunset Plaza'],
      title: ['Great Product', 'Amazing Service', 'Top Quality', 'Best Choice', 'Premium Item'],
      cuisine: ['Italian', 'Japanese', 'Mexican', 'Indian', 'Thai'],
      status: ['active', 'pending', 'completed', 'cancelled', 'delivered'],
      priority: ['high', 'medium', 'low', 'urgent', 'normal'],
      type: ['standard', 'premium', 'basic', 'deluxe', 'lite'],
      category: ['Food', 'Drinks', 'Dessert', 'Appetizer', 'Main Course'],
      genre: ['Pop', 'Rock', 'Jazz', 'Classical', 'Hip-Hop'],
      instructor: ['Dr. Smith', 'Prof. Johnson', 'Ms. Williams', 'Mr. Brown', 'Dr. Davis'],
      artist: ['The Beatles', 'Daft Punk', 'Hans Zimmer', 'Adele', 'Drake'],
      country: ['France', 'Japan', 'Brazil', 'Italy', 'Thailand'],
      unit: ['kg', 'reps', 'minutes', 'km', 'miles'],
      description: ['High quality product', 'Best in class', 'Great value', 'Top rated', 'Highly recommended'],
      address: ['123 Main St', '456 Oak Ave', '789 Elm St', '321 Pine Rd', '654 Maple Dr'],
      email: ['user1@email.com', 'user2@email.com', 'user3@email.com', 'admin@demo.com', 'test@demo.com'],
      customer_name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward'],
      instructor_name: ['Dr. Smith', 'Prof. Johnson', 'Ms. Williams', 'Mr. Brown', 'Dr. Davis'],
      message: ['Interested in this', 'Please contact me', 'More details needed', 'Looks great!', 'Ready to buy'],
    }
    const vals = sampleData[lf] || sampleData[lf.replace(/s$/, '')]
    if (vals) return vals[index % vals.length]
    if (lf.includes('date') || lf.includes('deadline')) return new Date(Date.now() + (index + 1) * 86400000).toISOString().split('T')[0]
    if (lf.includes('time')) return ['10:00', '14:00', '18:00', '20:00', '22:00'][index % 5]
    if (lf.includes('url') || lf.includes('image')) return `https://picsum.photos/400/300?random=${index}`
    if (lf.includes('total') || lf.includes('price') || lf.includes('cost')) return `${(Math.random() * 100 + 10).toFixed(2)}`
    if (lf.includes('duration')) return `${Math.floor(Math.random() * 60) + 10}`
    if (lf.includes('rating')) return `${(4 + Math.random()).toFixed(1)}`
    if (lf.includes('progress')) return `${Math.floor(Math.random() * 100)}`
    if (lf.includes('guests') || lf.includes('quantity')) return `${Math.floor(Math.random() * 8) + 1}`
    if (lf.includes('bedrooms') || lf.includes('area')) return `${Math.floor(Math.random() * 5) + 1}`
    return `Sample ${field} ${index + 1}`
  }

  const seedDataCode = models.map(m => {
    const data = generateSeedData(m)
    return `DB['${m.name}'] = ${JSON.stringify(data, null, 2)};`
  }).join('\n    ')

  // Build sidebar nav
  const navItems = models.map((m: any, i: number) =>
    `<a href="#" class="nav-item ${i === 0 ? 'active' : ''}" onclick="showSection('${m.name}')">
      <span class="nav-icon">${getModelIcon(m.name)}</span>
      <span>${m.name}s</span>
    </a>`
  ).join('\n      ')

  // Build CRUD sections for each model
  const sections = models.map((m: any) => {
    const fields = m.fields.map((f: any) => `
        <div class="field-group">
          <label>${f.name} ${f.required ? '<span class="required">*</span>' : ''}</label>
          ${f.type === 'number'
            ? `<input type="number" id="input-${f.name}" step="0.01" ${f.required ? 'required' : ''}>`
            : `<input type="text" id="input-${f.name}" ${f.required ? 'required' : ''}>`
          }
        </div>`
    ).join('')

    return `
    <section id="section-${m.name}" class="content-section" style="display:${models.indexOf(m) === 0 ? 'block' : 'none'}">
      <div class="section-header">
        <h2>${getModelIcon(m.name)} ${m.name}s</h2>
        <button class="btn-primary" onclick="openModal('${m.name}')">+ Add ${m.name}</button>
      </div>

      <div class="stats-bar" id="stats-${m.name}"></div>

      <div class="table-container">
        <table id="table-${m.name}">
          <thead>
            <tr>
              <th>#</th>
              ${m.fields.map((f: any) => `<th>${f.name}</th>`).join('')}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="tbody-${m.name}"></tbody>
        </table>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal" id="modal-${m.name}">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modal-title-${m.name}">Add ${m.name}</h3>
            <button class="modal-close" onclick="closeModal('${m.name}')">&times;</button>
          </div>
          <form id="form-${m.name}" onsubmit="saveItem(event, '${m.name}')">
            <input type="hidden" id="edit-id-${m.name}" value="">
            ${fields}
            <div class="modal-actions">
              <button type="button" class="btn-secondary" onclick="closeModal('${m.name}')">Cancel</button>
              <button type="submit" class="btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </section>`
  }).join('\n')

  // Dashboard section
  const dashboardCards = models.map((m: any) => `
      <div class="dash-card" onclick="showSection('${m.name}')">
        <div class="dash-icon">${getModelIcon(m.name)}</div>
        <div class="dash-count" id="dash-count-${m.name}">0</div>
        <div class="dash-label">${m.name}s</div>
      </div>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${icon} ${name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg: #09090b;
      --surface: #18181b;
      --border: #27272a;
      --text: #fafafa;
      --muted: #a1a1aa;
      --primary: #8b5cf6;
      --primary-hover: #7c3aed;
      --danger: #ef4444;
      --success: #22c55e;
      --radius: 12px;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      min-height: 100vh;
    }

    /* Sidebar */
    .sidebar {
      width: 240px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
    }

    .sidebar-header {
      padding: 0 20px 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 10px;
    }

    .sidebar-header h1 {
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sidebar-header p {
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      color: var(--muted);
      text-decoration: none;
      font-size: 14px;
      transition: all 0.2s;
      cursor: pointer;
    }

    .nav-item:hover { background: rgba(139, 92, 246, 0.1); color: var(--text); }
    .nav-item.active { background: rgba(139, 92, 246, 0.15); color: var(--primary); border-right: 3px solid var(--primary); }

    .nav-icon { font-size: 18px; width: 24px; text-align: center; }

    /* Main Content */
    .main {
      margin-left: 240px;
      flex: 1;
      padding: 30px;
    }

    /* Dashboard */
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 30px;
    }

    .dash-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dash-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .dash-icon { font-size: 32px; margin-bottom: 8px; }
    .dash-count { font-size: 28px; font-weight: 700; color: var(--primary); }
    .dash-label { font-size: 13px; color: var(--muted); margin-top: 4px; }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-value { font-size: 18px; font-weight: 700; color: var(--primary); }
    .stat-label { font-size: 12px; color: var(--muted); }

    /* Section Header */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h2 { font-size: 22px; }

    /* Buttons */
    .btn-primary {
      background: var(--primary);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-primary:hover { background: var(--primary-hover); }

    .btn-secondary {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-danger { background: var(--danger); color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; }
    .btn-edit { background: var(--primary); color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; }

    /* Table */
    .table-container {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    table { width: 100%; border-collapse: collapse; }
    th { background: rgba(139, 92, 246, 0.1); padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
    td { padding: 12px 16px; border-top: 1px solid var(--border); font-size: 14px; }
    tr:hover { background: rgba(139, 92, 246, 0.05); }

    /* Modal */
    .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; }
    .modal.active { display: flex; }
    .modal-content { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border); }
    .modal-header h3 { font-size: 18px; }
    .modal-close { background: none; border: none; color: var(--muted); font-size: 24px; cursor: pointer; }
    .modal-close:hover { color: var(--text); }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; padding: 20px; border-top: 1px solid var(--border); }

    /* Form */
    form { padding: 20px; }
    .field-group { margin-bottom: 16px; }
    .field-group label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 6px; }
    .required { color: var(--danger); }
    .field-group input, .field-group select, .field-group textarea {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      color: var(--text);
      font-size: 14px;
      outline: none;
    }
    .field-group input:focus, .field-group select:focus { border-color: var(--primary); }

    .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
    .empty-state .icon { font-size: 48px; margin-bottom: 12px; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-active { background: rgba(34, 197, 94, 0.15); color: var(--success); }
    .badge-pending { background: rgba(234, 179, 8, 0.15); color: #eab308; }
    .badge-cancelled { background: rgba(239, 68, 68, 0.15); color: var(--danger); }

    .powered { position: fixed; bottom: 16px; right: 16px; font-size: 11px; color: var(--muted); opacity: 0.5; }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>${icon} ${name}</h1>
      <p>${description || 'Generated by AbhiBase'}</p>
    </div>
    <a href="#" class="nav-item active" onclick="showDashboard()">
      <span class="nav-icon">📊</span>
      <span>Dashboard</span>
    </a>
    ${navItems}
  </aside>

  <main class="main">
    <!-- Dashboard -->
    <section id="section-dashboard" class="content-section">
      <h2 style="margin-bottom:20px">📊 Dashboard</h2>
      <div class="dashboard">
        ${dashboardCards}
      </div>
    </section>

    <!-- CRUD Sections -->
    ${sections}
  </main>

  <div class="powered">Generated by AbhiBase AI App Generator</div>

  <script>
    // Database (localStorage)
    const DB_KEY = 'abhibase_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}';
    const DB = JSON.parse(localStorage.getItem(DB_KEY) || '{}');

    // Seed data on first load
    if (Object.keys(DB).length === 0) {
      ${seedDataCode}
      saveDB();
    }

    function saveDB() {
      localStorage.setItem(DB_KEY, JSON.stringify(DB));
    }

    function getModelIcon(name) {
      const icons = { Restaurant: '🍕', MenuItem: '🍽️', Order: '📦', Course: '📚', Lesson: '📖', Student: '🎓', Workout: '🏋️', Goal: '🎯', Property: '🏠', Inquiry: '📩', Track: '🎵', Playlist: '🎶', Destination: '✈️', Booking: '🎫', Task: '✅', Project: '📋', Item: '📦', Category: '🏷️' };
      return icons[name] || '📦';
    }

    // Navigation
    function showDashboard() {
      document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
      document.getElementById('section-dashboard').style.display = 'block';
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.nav-item')[0].classList.add('active');
      updateDashboard();
    }

    function showSection(modelName) {
      document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
      document.getElementById('section-' + modelName).style.display = 'block';
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      event.currentTarget.classList.add('active');
      renderTable(modelName);
    }

    // Dashboard counts
    function updateDashboard() {
      ${models.map((m: any) => `
      document.getElementById('dash-count-${m.name}').textContent = (DB['${m.name}'] || []).length;`).join('\n      ')}
    }

    // Table rendering
    function renderTable(modelName) {
      const items = DB[modelName] || [];
      const ${models[0]?.name || 'Item'}Model = ${JSON.stringify(models[0] || models[0])};
      const models = ${JSON.stringify(models)};
      const model = models.find(m => m.name === modelName);
      if (!model) return;

      const tbody = document.getElementById('tbody-' + modelName);
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + (model.fields.length + 2) + '" class="empty-state"><div class="icon">📭</div><p>No items yet. Click "Add ' + modelName + '" to create one.</p></td></tr>';
      } else {
        tbody.innerHTML = items.map((item, i) => {
          return '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            model.fields.map(f => {
              let val = item[f.name];
              if (f.name === 'status') {
                const cls = val === 'active' || val === 'completed' || val === 'delivered' ? 'badge-active' : val === 'pending' ? 'badge-pending' : 'badge-cancelled';
                return '<td><span class="badge ' + cls + '">' + (val || '-') + '</span></td>';
              }
              if (f.type === 'number' && (f.name.includes('price') || f.name.includes('cost') || f.name.includes('total') || f.name.includes('amount'))) {
                val = '$' + Number(val).toFixed(2);
              }
              return '<td>' + (val !== undefined && val !== null ? val : '-') + '</td>';
            }).join('') +
            '<td><button class="btn-edit" onclick="editItem(\\'' + modelName + '\\', \\'' + item.id + '\\')">Edit</button> <button class="btn-danger" onclick="deleteItem(\\'' + modelName + '\\', \\'' + item.id + '\\')">Delete</button></td>' +
          '</tr>';
        }).join('');
      }

      // Update stats
      const statsEl = document.getElementById('stats-' + modelName);
      if (statsEl) {
        statsEl.innerHTML = '<div class="stat"><span class="stat-value">' + items.length + '</span><span class="stat-label">Total</span></div>';
      }

      updateDashboard();
    }

    // Modal
    function openModal(modelName) {
      document.getElementById('modal-' + modelName).classList.add('active');
      document.getElementById('modal-title-' + modelName).textContent = 'Add ' + modelName;
      document.getElementById('form-' + modelName).reset();
      document.getElementById('edit-id-' + modelName).value = '';
    }

    function closeModal(modelName) {
      document.getElementById('modal-' + modelName).classList.remove('active');
    }

    // Save item
    function saveItem(e, modelName) {
      e.preventDefault();
      const models = ${JSON.stringify(models)};
      const model = models.find(m => m.name === modelName);
      const editId = document.getElementById('edit-id-' + modelName).value;

      const item = { id: editId || crypto.randomUUID() };
      model.fields.forEach(f => {
        const el = document.getElementById('input-' + f.name);
        item[f.name] = f.type === 'number' ? Number(el.value) || 0 : el.value;
      });
      item.created_at = new Date().toISOString();

      if (!DB[modelName]) DB[modelName] = [];

      if (editId) {
        const idx = DB[modelName].findIndex(x => x.id === editId);
        if (idx >= 0) DB[modelName][idx] = { ...DB[modelName][idx], ...item };
      } else {
        DB[modelName].push(item);
      }

      saveDB();
      closeModal(modelName);
      renderTable(modelName);
    }

    // Edit item
    function editItem(modelName, id) {
      const models = ${JSON.stringify(models)};
      const model = models.find(m => m.name === modelName);
      const item = DB[modelName].find(x => x.id === id);
      if (!item) return;

      document.getElementById('modal-title-' + modelName).textContent = 'Edit ' + modelName;
      document.getElementById('edit-id-' + modelName).value = id;

      model.fields.forEach(f => {
        const el = document.getElementById('input-' + f.name);
        if (el) el.value = item[f.name] || '';
      });

      document.getElementById('modal-' + modelName).classList.add('active');
    }

    // Delete item
    function deleteItem(modelName, id) {
      if (!confirm('Delete this item?')) return;
      DB[modelName] = DB[modelName].filter(x => x.id !== id);
      saveDB();
      renderTable(modelName);
    }

    // Initial render
    updateDashboard();
    ${models.map((m: any) => `renderTable('${m.name}');`).join('\n    ')}
  </script>
</body>
</html>`
}

function getModelIcon(name: string): string {
  const icons: Record<string, string> = {
    Restaurant: '🍕', MenuItem: '🍽️', Order: '📦', Course: '📚', Lesson: '📖', Student: '🎓',
    Workout: '🏋️', Goal: '🎯', Property: '🏠', Inquiry: '📩', Track: '🎵', Playlist: '🎶',
    Destination: '✈️', Booking: '🎫', Task: '✅', Project: '📋', Item: '📦', Category: '🏷️',
    Delivery: '🚚', CartSummary: '🛒', SavedProperty: '❤️', PlaylistTrack: '🎶',
  }
  return icons[name] || '📦'
}

function extractJSON(text: string): Record<string, unknown> {
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()
  try { return JSON.parse(cleaned) }
  catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
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
    let appStructure: Record<string, any>

    try {
      const rawResponse = await callGemini(prompt)
      appStructure = extractJSON(rawResponse)
    } catch (aiError) {
      console.log('Gemini unavailable, using local fallback')
      appStructure = getLocalFallback(prompt) as Record<string, any>
    }

    if (!appStructure.name || !appStructure.models) {
      throw new Error('Failed to generate app structure')
    }

    // Generate standalone HTML
    const html = generateHTML(appStructure)

    // Save HTML file
    const slug = appStructure.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const appDir = join(process.cwd(), 'generated-apps', slug)
    await mkdir(appDir, { recursive: true })
    const htmlPath = join(appDir, 'index.html')
    await writeFile(htmlPath, html)

    const files = ['index.html']

    // Also save the SQL schema for reference
    let sql = `-- ${appStructure.name} Database Schema\n\n`
    sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`
    appStructure.models.forEach((m: any) => {
      sql += `CREATE TABLE ${m.name.toLowerCase()}s (\n`
      sql += `  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n`
      m.fields.forEach((f: any) => {
        const pgType = f.type === 'number' ? 'DECIMAL(12,2)' : f.type === 'boolean' ? 'BOOLEAN DEFAULT false' : 'TEXT'
        sql += `  ${f.name} ${pgType}${f.required ? ' NOT NULL' : ''},\n`
      })
      sql += `  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n`
    })
    await writeFile(join(appDir, 'schema.sql'), sql)
    files.push('schema.sql')

    return NextResponse.json({
      success: true,
      structure: appStructure,
      rawPrompt: prompt,
      folder: `generated-apps/${slug}`,
      files,
      htmlPath: `generated-apps/${slug}/index.html`,
      url: `/generated/${slug}`,
    })
  } catch (error: any) {
    console.error('AI App Generation error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate app' },
      { status: 500 }
    )
  }
}
