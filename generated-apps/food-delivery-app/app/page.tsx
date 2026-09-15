'use client'

import { RestaurantList } from '@/components/RestaurantList'
import { MenuItemList } from '@/components/MenuItemList'

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold mb-2">🍔 Food Delivery</h1>
        <p className="text-zinc-400">Browse restaurants and order your favorite food</p>
      </div>
      
      <section>
        <h2 className="text-xl font-bold mb-4">📍 Restaurants Near You</h2>
        <RestaurantList />
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-4">🍽️ Popular Items</h2>
        <MenuItemList />
      </section>
    </div>
  )
}
