import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const STOPWORDS = new Set([
  'this','that','with','from','have','will','your','what','when','where','about',
  'there','their','would','could','should','been','they','them','then','than',
  'into','also','just','very','some','more','most','over','such','because','while',
])

function mockSummarize(content: string): { summary: string; tags: string[] } {
  const clean = content.replace(/\s+/g, ' ').trim()
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean)
  let summary = ''
  for (const s of sentences) {
    if ((summary + ' ' + s).trim().length > 260) break
    summary = (summary + ' ' + s).trim()
    if (summary.length > 80) break
  }
  if (!summary) summary = clean.slice(0, 220)

  const freq = new Map<string, number>()
  for (const word of clean.toLowerCase().match(/[a-z]{4,}/g) ?? []) {
    if (STOPWORDS.has(word)) continue
    freq.set(word, (freq.get(word) ?? 0) + 1)
  }
  const tags = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w)

  return { summary, tags }
}

async function openAiSummarize(apiKey: string, content: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You summarize personal notes. Respond with JSON: {"summary": string (max 2 sentences), "tags": string[] (exactly 3 lowercase single words)}.',
        },
        { role: 'user', content: content.slice(0, 8000) },
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI API error (${res.status})`)
  const json = await res.json()
  const raw = json?.choices?.[0]?.message?.content ?? '{}'
  return JSON.parse(raw) as { summary?: string; tags?: string[] }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const content: string = typeof body?.content === 'string' ? body.content : ''
    if (!content.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ...mockSummarize(content), mocked: true })
    }

    try {
      const parsed = await openAiSummarize(apiKey, content)
      return NextResponse.json({
        summary: parsed.summary?.trim() || mockSummarize(content).summary,
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [],
        mocked: false,
      })
    } catch {
      return NextResponse.json({ ...mockSummarize(content), mocked: true })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to summarize'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
