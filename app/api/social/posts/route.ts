import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const posts = await query(`
      SELECT * FROM social_posts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [getUser()])

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { platform, content, hashtags, scheduled_for, status } = body

    const result = await query(`
      INSERT INTO social_posts (user_id, platform, content, hashtags, scheduled_for, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [getUser(), platform, content, hashtags || [], scheduled_for, status || 'draft'])

    return NextResponse.json({ post: result[0] })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 3}`)
    const values = [id, getUser(), ...Object.values(updates)]

    const result = await query(`
      UPDATE social_posts 
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, values)

    return NextResponse.json({ post: result[0] })
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await query('DELETE FROM social_posts WHERE id = $1 AND user_id = $2', [id, getUser()])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

function getUser() {
  return 'b58420a1-7578-49b8-ab59-8cb091b89917'
}
