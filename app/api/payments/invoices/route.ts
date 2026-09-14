import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const invoices = await query(`
      SELECT * FROM invoices 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [getUser()])

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { client_name, client_email, due_date, amount, currency, items, status } = body

    const result = await query(`
      INSERT INTO invoices (user_id, client_name, client_email, due_date, amount, currency, items, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [getUser(), client_name, client_email, due_date, amount, currency || 'INR', JSON.stringify(items || []), status || 'draft'])

    return NextResponse.json({ invoice: result[0] })
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 3}`)
    const values = [id, getUser(), ...Object.values(updates)]

    const result = await query(`
      UPDATE invoices 
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, values)

    return NextResponse.json({ invoice: result[0] })
  } catch (error) {
    console.error('Failed to update invoice:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await query('DELETE FROM invoices WHERE id = $1 AND user_id = $2', [id, getUser()])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}

function getUser() {
  // This should be replaced with actual auth
  return 'b58420a1-7578-49b8-ab59-8cb091b89917'
}
