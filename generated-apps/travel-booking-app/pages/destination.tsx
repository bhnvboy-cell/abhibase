// Destination Page
// Destination details

import { DestinationDetail } from '@/components/DestinationDetail'
import { TripForm } from '@/components/TripForm'

export default function DestinationPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <DestinationDetail />
        <TripForm />
      </div>
    </div>
  )
}
