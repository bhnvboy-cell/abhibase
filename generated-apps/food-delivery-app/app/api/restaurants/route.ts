import { NextResponse } from 'next/server'

const RESTAURANTS = [
  { id: '1', name: 'Pizza Palace', cuisine: 'Italian', rating: 4.5, delivery_time: '30 min', address: '123 Main St', image_url: '' },
  { id: '2', name: 'Sushi Supreme', cuisine: 'Japanese', rating: 4.8, delivery_time: '25 min', address: '456 Oak Ave', image_url: '' },
  { id: '3', name: 'Burger Barn', cuisine: 'American', rating: 4.2, delivery_time: '20 min', address: '789 Elm St', image_url: '' },
  { id: '4', name: 'Taco Town', cuisine: 'Mexican', rating: 4.6, delivery_time: '35 min', address: '321 Pine Rd', image_url: '' },
  { id: '5', name: 'Curry Corner', cuisine: 'Indian', rating: 4.7, delivery_time: '40 min', address: '654 Maple Dr', image_url: '' },
]

export async function GET() {
  return NextResponse.json(RESTAURANTS)
}
