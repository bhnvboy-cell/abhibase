// Home Page
// Browse restaurants and featured items

import { RestaurantList } from '@/components/RestaurantList'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <RestaurantList />
      </div>
    </div>
  )
}
