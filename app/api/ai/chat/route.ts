import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query } from '@/lib/db'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are AbhiBase AI, a helpful productivity assistant. You help users manage their notes, tasks, habits, and projects.

You can:
- Answer questions about their data
- Help organize and plan tasks
- Suggest habit improvements
- Summarize notes
- Provide productivity tips

Keep responses concise and helpful. Use emoji sparingly. If you don't have enough information, ask clarifying questions.

Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

async function callGroq(messages: ChatMessage[], apiKey: string): Promise<string> {
  if (!apiKey) return ''
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages], temperature: 0.7, max_tokens: 1024 }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } catch { return '' }
}

async function callMistral(messages: ChatMessage[], apiKey: string): Promise<string> {
  if (!apiKey) return ''
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'mistral-small-latest', messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages], temperature: 0.7, max_tokens: 1024 }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } catch { return '' }
}

async function callGemini(messages: ChatMessage[], apiKey: string): Promise<string> {
  if (!apiKey) return ''
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          ...messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        ],
      }),
    })
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch { return '' }
}

async function getUserKeys(userId: string): Promise<Record<string, string>> {
  const rows = await query<{ provider: string; api_key: string }>(
    `SELECT provider, api_key FROM user_api_keys WHERE user_id = $1`,
    [userId]
  )
  const keys: Record<string, string> = {}
  for (const r of rows) keys[r.provider] = r.api_key
  return keys
}

async function callAI(messages: ChatMessage[], userId: string): Promise<string> {
  // First try user-stored keys
  const userKeys = await getUserKeys(userId)

  if (userKeys.groq) { const r = await callGroq(messages, userKeys.groq); if (r) return r }
  if (userKeys.mistral) { const r = await callMistral(messages, userKeys.mistral); if (r) return r }
  if (userKeys.gemini) { const r = await callGemini(messages, userKeys.gemini); if (r) return r }

  // Then try env keys
  if (process.env.GROQ_API_KEY) { const r = await callGroq(messages, process.env.GROQ_API_KEY); if (r) return r }
  if (process.env.MISTRAL_API_KEY) { const r = await callMistral(messages, process.env.MISTRAL_API_KEY); if (r) return r }
  if (process.env.GEMINI_API_KEY) { const r = await callGemini(messages, process.env.GEMINI_API_KEY); if (r) return r }

  return getLocalResponse(messages[messages.length - 1]?.content || '')
}

function getLocalResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('task') && (lower.includes('how many') || lower.includes('count')))
    return 'I can help you check your tasks! Add a free API key in Settings → AI API Keys to enable full AI features.'
  if (lower.includes('habit') && lower.includes('streak'))
    return 'Great question about habits! Consistency is key. Check your Habits page to see your current streaks.'
  if (lower.includes('productivity') || lower.includes('tip'))
    return 'Here are some productivity tips:\n1. Use the Pomodoro technique (25min work, 5min break)\n2. Prioritize tasks with the Eisenhower matrix\n3. Review your analytics weekly\n4. Build habits with small, consistent steps\n5. Use the planner to schedule focused work blocks'
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey'))
    return 'Hello! I\'m AbhiBase AI. Add a free API key in Settings → AI API Keys for full capabilities. How can I help?'
  return 'For full AI capabilities, go to Settings → AI API Keys and add a free key from Groq, Mistral, or Gemini. All are free with no credit card required!'
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  // Rate limit AI requests
  const rateLimit = checkRateLimit(g.user.id, 'ai')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    )
  }

  let body: { messages?: ChatMessage[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const messages = body.messages || []
  if (messages.length === 0) return NextResponse.json({ error: 'No messages' }, { status: 400 })

  const response = await callAI(messages, g.user.id)
  return NextResponse.json({ response }, { headers: getRateLimitHeaders(rateLimit) })
}
