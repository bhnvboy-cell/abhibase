import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/api-helpers'
import { query } from '@/lib/db'

export const runtime = 'nodejs'

interface DiscussionMessage {
  role: 'user' | 'assistant'
  content: string
}

const DISCUSSION_PROMPT = `You are a brainstorming partner in AbhiBase's Discussion Mode. This is a free, low-cost mode for ideation and planning — no credits are burned.

Your role:
- Help users brainstorm ideas, plan projects, and think through problems
- Ask probing questions to expand their thinking
- Offer multiple perspectives and alternatives
- Be creative and encouraging
- Never suggest spending money or purchasing anything

Keep responses thoughtful but concise. Structure complex ideas with bullet points or numbered lists.`

async function callLocalAI(messages: DiscussionMessage[]): Promise<string> {
  const input = messages[messages.length - 1]?.content || ''
  const lower = input.toLowerCase()

  if (lower.includes('idea') || lower.includes('brainstorm')) {
    return `Here are some angles to consider:\n\n1. What's the core problem you're solving?\n2. Who specifically benefits from this?\n3. What's the simplest version you could start with?\n4. What existing solutions exist and how would yours differ?\n\nTell me more about your concept and I'll help you refine it.`
  }
  if (lower.includes('plan') || lower.includes('roadmap')) {
    return `For planning, let's break this down:\n\n- **Phase 1**: Define scope and MVP features\n- **Phase 2**: Set milestones and deadlines\n- **Phase 3**: Identify dependencies and blockers\n- **Phase 4**: Plan iteration cycles\n\nWhat's the project or goal you're planning for? I'll help you structure the roadmap.`
  }
  if (lower.includes('pro') || lower.includes('con') || lower.includes('compare')) {
    return `To do a thorough comparison:\n\n- List the key factors that matter to you\n- Score each option on those factors\n- Consider short-term vs long-term tradeoffs\n- Think about reversibility — can you undo this choice later?\n\nWhat specific options are you weighing?`
  }
  return `I'm here to help you think things through! Discussion Mode is free — no credits burned.\n\nI can help with:\n- Brainstorming ideas\n- Planning projects\n- Weighing pros and cons\n- Exploring different angles\n- Structuring your thoughts\n\nWhat would you like to discuss?`
}

async function callGroq(messages: DiscussionMessage[], apiKey: string): Promise<string> {
  if (!apiKey) return ''
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: DISCUSSION_PROMPT }, ...messages],
        temperature: 0.8,
        max_tokens: 1024,
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } catch {
    return ''
  }
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

async function discuss(messages: DiscussionMessage[], userId: string): Promise<string> {
  const userKeys = await getUserKeys(userId)

  if (userKeys.groq) {
    const r = await callGroq(messages, userKeys.groq)
    if (r) return r
  }
  if (process.env.GROQ_API_KEY) {
    const r = await callGroq(messages, process.env.GROQ_API_KEY)
    if (r) return r
  }

  return callLocalAI(messages)
}

export async function POST(req: Request) {
  const g = await authGuard()
  if (g.res) return g.res

  const body = await req.json()
  const messages = (body.messages || []) as DiscussionMessage[]
  if (messages.length === 0) {
    return NextResponse.json({ error: 'No messages' }, { status: 400 })
  }

  const response = await discuss(messages, g.user.id)
  return NextResponse.json({ response })
}
