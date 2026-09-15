// Trip Page
// Trip details

import { TripDashboard } from '@/components/TripDashboard'
import { BookingList } from '@/components/BookingList'

export default function TripPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <TripDashboard />
        <BookingList />
      </div>
    </div>
  )
}
