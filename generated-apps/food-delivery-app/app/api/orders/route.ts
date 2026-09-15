import { NextResponse } from 'next/server'

const ORDERS = [
  { id: '1', status: 'delivered', total: 27.98, delivery_address: '123 Home St', user_id: '1', restaurant_id: '1', created_at: '2026-09-14' },
  { id: '2', status: 'in_transit', total: 14.99, delivery_address: '456 Work Ave', user_id: '1', restaurant_id: '2', created_at: '2026-09-15' },
]

export async function GET() {
  return NextResponse.json(ORDERS)
}

export async function POST(req: Request) {
  const body = await req.json()
  const newOrder = {
    id: Date.now().toString(),
    status: 'pending',
    ...body,
    created_at: new Date().toISOString(),
  }
  return NextResponse.json(newOrder, { status: 201 })
}
