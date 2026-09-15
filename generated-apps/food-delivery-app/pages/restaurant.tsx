// Restaurant Page
// View restaurant menu

import { RestaurantDetail } from '@/components/RestaurantDetail'
import { MenuItemList } from '@/components/MenuItemList'

export default function RestaurantPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <RestaurantDetail />
        <MenuItemList />
      </div>
    </div>
  )
}
