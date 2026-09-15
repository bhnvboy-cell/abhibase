import { NextResponse } from 'next/server'

const MENU_ITEMS = [
  { id: '1', name: 'Margherita Pizza', description: 'Fresh tomato, mozzarella, basil', price: 12.99, category: 'Pizza', restaurant_id: '1' },
  { id: '2', name: 'Pepperoni Pizza', description: 'Classic pepperoni with cheese', price: 14.99, category: 'Pizza', restaurant_id: '1' },
  { id: '3', name: 'Salmon Roll', description: 'Fresh salmon with rice', price: 8.99, category: 'Sushi', restaurant_id: '2' },
  { id: '4', name: 'Dragon Roll', description: 'Shrimp tempura with avocado', price: 12.99, category: 'Sushi', restaurant_id: '2' },
  { id: '5', name: 'Classic Burger', description: 'Beef patty with lettuce and tomato', price: 9.99, category: 'Burgers', restaurant_id: '3' },
  { id: '6', name: 'Cheeseburger', description: 'Double cheese with pickles', price: 11.99, category: 'Burgers', restaurant_id: '3' },
  { id: '7', name: 'Chicken Tacos', description: 'Grilled chicken with salsa', price: 7.99, category: 'Tacos', restaurant_id: '4' },
  { id: '8', name: 'Beef Burrito', description: 'Loaded burrito with beans', price: 9.99, category: 'Burritos', restaurant_id: '4' },
  { id: '9', name: 'Butter Chicken', description: 'Creamy tomato curry', price: 13.99, category: 'Curry', restaurant_id: '5' },
  { id: '10', name: 'Palak Paneer', description: 'Spinach with cheese cubes', price: 11.99, category: 'Curry', restaurant_id: '5' },
]

export async function GET() {
  return NextResponse.json(MENU_ITEMS)
}
