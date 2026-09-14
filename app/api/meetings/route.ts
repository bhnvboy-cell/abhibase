import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const meetings = await query(`
      SELECT * FROM meetings 
      WHERE user_id = $1 
      ORDER BY date DESC
    `, [getUser()])

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('Failed to fetch meetings:', error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, date, duration, attendees, notes, platform, action_items } = body

    const result = await query(`
      INSERT INTO meetings (user_id, title, date, duration, attendees, notes, platform, action_items)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [getUser(), title, date, duration || 30, attendees || [], notes || '', platform || 'other', JSON.stringify(action_items || [])])

    return NextResponse.json({ meeting: result[0] })
  } catch (error) {
    console.error('Failed to create meeting:', error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 3}`)
    const values = [id, getUser(), ...Object.values(updates)]

    const result = await query(`
      UPDATE meetings 
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, values)

    return NextResponse.json({ meeting: result[0] })
  } catch (error) {
    console.error('Failed to update meeting:', error)
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await query('DELETE FROM meetings WHERE id = $1 AND user_id = $2', [id, getUser()])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete meeting:', error)
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 })
  }
}

function getUser() {
  return 'b58420a1-7578-49b8-ab59-8cb091b89917'
}
