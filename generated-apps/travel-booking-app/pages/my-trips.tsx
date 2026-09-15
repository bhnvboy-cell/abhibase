// My Trips Page
// Your trips

import { TripList } from '@/components/TripList'

export default function MyTripsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <TripList />
      </div>
    </div>
  )
}
